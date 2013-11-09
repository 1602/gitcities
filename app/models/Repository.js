var moment = require('moment');
var async = require('async');

module.exports = function(compound, Repository) {
    var Commit = compound.models.Commit;
    var User = compound.models.User;

    Repository.validatesUniquenessOf('name');

    Repository.afterCreate = function(next) {
        this.syncData(next);
    };

    Repository.prototype.syncData = function(done) {
        var repo = this;
        async.series([
            function(next) {
                repo.loadCommits(next);
            },
            function(next) {
                repo.loadStats(next);
            },
            done
        ]);
    };

    Repository.processNext = function() {
        Repository.findOne(function(err, repo) {
            if (repo) {
                repo.syncData();
            }
        });
    };

    Repository.prototype.loadStats = function(force, cb) {
        if ('function' === typeof force) {
            cb = force;
            force = false;
        }
        var repo = this;
        compound.gh.get('/repos/' + this.name, {ifModifiedSince: !force && this.lastCheckedAt}, function(err, data, res) {
            if (data) {
                repo.watchers = data.watchers_count;
                repo.stars = data.stargazers_count;
                repo.forks = data.forks_count;
                repo.size = data.size;
                repo.issues = data.open_issues_count;
                repo.network = data.network_count;
                repo.subscribers = data.subscribers_count;
            }
            repo.lastCheckedAt = new Date();
            repo.save(cb);
        });
    };

    Repository.prototype.loadCollaborators = function(force, cb) {
        if ('function' === typeof force) {
            cb = force;
            force = false;
        }
        var repo = this;
        compound.gh.get('/repos/' + this.name + '/collaborators?per_page=100', {ifModifiedSince: !force && this.lastCheckedAt}, function(err, data, res) {
            if (data) {
                async.forEach(data, function(user, next) {
                    User.updateOrCreate({
                        id: user.id,
                        username: user.login
                    }, next);
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
        compound.gh.get(uri, {ifModifiedSince: !force && this.lastCheckedAt}, function(err, data, res) {
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
