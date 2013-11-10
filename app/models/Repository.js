var moment = require('moment');
var async = require('async');

module.exports = function(compound, Repository) {
    var Commit = compound.models.Commit;
    var User = compound.models.User;

    compound.gh.redis = Repository.schema.adapter.client;

    Repository.hasAndBelongsToMany('users');
    Repository.hasMany('contributions');

    Repository.validatesUniquenessOf('name');

    Repository.create = function(name, cb) {
        var r = new Repository({name: name});
        r.loadStats(true, function(err) {
            if (!err) {
                r.save(cb);
                r.syncAllData();
            } else if (cb) {
                cb(err);
            }
        });
    };

    Repository.prototype.syncData = function(done) {
        var repo = this;
        async.series([
            function(next) {
                repo.loadCommits(next);
            },
            function(next) {
                repo.loadStats(next);
            }
        ], done);
    };

    Repository.prototype.syncAllData = function(done) {
        var repo = this;
        async.series([
            function(next) {
                repo.loadCommits(next);
            },
            function(next) {
                repo.loadCollaborators(next);
            },
            function(next) {
                repo.loadContributors(next);
            },
            done
        ]);
    };

    Repository.processNext = function(cb) {
        Repository.findOne(function(err, repo) {
            if (repo) {
                repo.syncData(function() {
                    repo.lastCheckedAt = new Date();
                    repo.save(cb);
                });
            } else if (cb) {
                cb();
            }
        });
    };

    Repository.prototype.loadStats = function(force, cb) {
        if ('function' === typeof force) {
            cb = force;
            force = false;
        }
        var repo = this;
        compound.gh.get('/repos/' + this.name, {ifNoneMatch: !force}, function(err, data, res) {
            if (data) {
                repo.id = data.id;
                repo.watchers = data.watchers_count;
                repo.stars = data.stargazers_count;
                repo.forks = data.forks_count;
                repo.size = data.size;
                repo.issues = data.open_issues_count;
                repo.network = data.network_count;
                repo.subscribers = data.subscribers_count;
                repo.language = data.language;
            }
            if (typeof cb === 'function') {
                cb(!data && res.status !== 304 ? new Error('Not found') : null);
            }
        });
    };

    Repository.prototype.loadCollaborators = function(force, cb) {
        if ('function' === typeof force) {
            cb = force;
            force = false;
        }
        var repo = this;
        compound.gh.get('/repos/' + this.name + '/collaborators', {ifNoneMatch: !force}, function(err, data, res) {
            if (data) {
                async.forEach(data, function(user, next) {
                    User.findOrCreate({where: {id: user.id}}, {
                        id: user.id,
                        username: user.login
                    }, function(err, user) {
                        repo.users.add(user, next);
                    });
                });
            }
            cb();
        });
    };

    Repository.prototype.loadContributors = function(force, cb) {
        if ('function' === typeof force) {
            cb = force;
            force = false;
        }
        var repo = this;
        compound.gh.get('/repos/' + this.name + '/contributors', {ifNoneMatch: !force}, function(err, data, res) {
            if (data) {
                async.forEach(data, function(c, next) {
                    User.findOrCreate({where: {id: c.id}}, {
                        id: c.id,
                        username: c.login
                    }, function(err, user) {
                        user.contributions.create({
                            repositoryId: repo.id,
                            count: c.contributions
                        });
                    });
                });
            }
            cb();
        });
    };

    Repository.prototype.loadCommits = function(force, cb) {
        if ('function' === typeof force) {
            cb = force;
            force = false;
        }
        var repo = this;
        var uri = '/repos/' + this.name + '/commits?per_page=100';
        if (!force) {
            uri += '&since=' + escape(moment(this.lastCheckedAt).format());
        }
        compound.gh.get(uri, {ifModifiedSince: force ? null : this.lastCheckedAt}, function(err, data, res) {
            if (data) {
                async.forEach(data, function(line, next) {
                    var userId;
                    if (line.author) {
                        userId = line.author.id;
                    } else if (line.commit.author) {
                        userId = line.commit.author.email;
                    } else {
                        return next();
                    }
                    (new Commit({
                        id: line.sha,
                        date: moment(line.commit.committer.date),
                        message: line.commit.message,
                        userId: userId,
                        repoId: repo.id
                    })).save(next);
                });
            }
            if ('function' === typeof cb) {
                cb();
            }
        });
    };

};
