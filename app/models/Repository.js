var moment = require('moment');
var parse = require('parse-link-header');
var async = require('async');

module.exports = function(compound, Repository) {
    var Commit = compound.models.Commit;
    var User = compound.models.User;
    var Contribution = compound.models.Contribution;

    compound.gh.redis = Repository.schema.adapter.client;

    Repository.hasAndBelongsToMany('users');
    Repository.hasMany('contributions');

    Repository.validatesUniquenessOf('name');

    Repository.getter.karma = function() {
        with (this) {
            return stars + subscribers * 3 - issues * 5;
        }
    };

    Repository.create = function(name, cb) {
        Repository.findOne({where: {name: name}}, function(err, repo) {
            if (repo) {
                return cb(err, repo);
            }
            var r = new Repository({name: name});
            r.loadStats(true, function(err) {
                if (!err) {
                    if (r.fork) {
                        return Repository.create(r.fork.full_name, cb);
                    }
                    r.syncAllData(function() {
                        r.lastCheckedAt = new Date();
                        r.save(cb);
                    });
                } else if (cb) {
                    cb(err);
                }
            });
        });
    };

    Repository.prototype.loadCitizens = function(cb) {
        this.contributions({limit: 100}, function(err, cs) {
            cs.forEach(function(x) {
                if (x.u.mayorships.length) {
                    console.log(x.u);
                }
            });
            cb(err, {
                mayor: cs[0],
                active: cs.slice(1, 13),
                others: cs.slice(13, cs.length)
            });
        });
    };

    Repository.prototype.buildContributions = function(userIds, cb) {
        var now = new Date();
        var repo = this;
        async.forEach(userIds.map(Number).filter(Boolean), function(id, next) {
            Commit.all({where: {repoId: repo.id, userId: id}}, function(err, cs) {
                var weight = repo.owner && repo.owner.id === id ? cs.length / 20 : cs.length / 5;
                cs.forEach(function(c) {
                    var daysAgo = Math.ceil((now - c.date.getTime()) / 86400000);
                    if (daysAgo < 4) daysAgo = 4;
                    var gravity = Math.log(daysAgo) * Math.log(daysAgo / 2);
                    weight +=  10 / gravity;
                });
                Contribution.findOne({where: {repositoryId: repo.id, userId: id}}, function(err, con) {
                    if (con) {
                        con.updateAttributes({
                            count: cs.length,
                            weight: Math.round(weight)
                        });
                    } else {
                        Contribution.updateOrCreate({
                            repositoryId: repo.id,
                            userId: id,
                            count: cs.length,
                            weight: Math.round(weight)
                        }, next);
                    }
                });
            });
        }, function(err) {
            if (err) {
                cb(err);
            } else {
                
            }
        });
    };

    Repository.prototype.loadAllCommits = function(cb) {
        var repo = this;
        var limit = 10000;
        var userIds = [];
        var commits = [];
        compound.gh.get('/repos/' + this.name + '/commits?per_page=100', {}, handlePage);

        function handlePage(err, data, res) {
            limit -= data.length;

            async.forEach(data, function(line, next) {
                var userId;
                if (line.author) {
                    userId = line.author.id;
                } else if (line.commit.author) {
                    userId = line.commit.author.email;
                } else {
                    return next();
                }
                if (userIds.indexOf(userId) === -1) {
                    userIds.push(userId);
                }
                var commit = new Commit({
                    id: line.sha,
                    date: moment(line.commit.committer.date),
                    message: line.commit.message,
                    userId: userId,
                    repoId: repo.id
                });
                commits.push(commit);
                commit.save(next);
            }, function(err) {
                if (err) {
                    cb(err);
                } else {
                    var links = parse(res.headers.link);
                    if (links && links.next && limit > 0) {
                        compound.gh.get(links.next.url.replace('https://api.github.com', ''), {}, handlePage);
                    } else if (cb) {
                        cb(null, userIds, commits);
                    }
                }
            });
        }
    };

    Repository.prototype.buildContributionHistory = function (commits, userIds, cb) {
        var repo = this;
        var now = Date.now();
        if (commits.length > 1 && commits[0].date > commits[1].date) {
            commits = commits.reverse();
        }
        if (!userIds) {
            userIds = {};
            commits.forEach(function(ci) {
                userIds[ci.userId] = 1;
            });
            userIds = Object.keys(userIds).map(Number).filter(Boolean);
        }
        var mayor = userIds[0];
        if (this.owner) {
            mayor = this.ownerId;
        }
        var conributions = {};
        User.all({where: {id:{inq: userIds}}}, function(err, users) {
            users.forEach(function(u) {
                conributions[u.id] = {
                    id: repo.id + ':' + u.id,
                    userId: u.id,
                    repositoryId: repo.id,
                    count: 0,
                    weight: 0,
                    updatedAt: new Date,
                    u: {
                        id: u.id,
                        name: u.name,
                        avatar: u.avatar,
                        login: u.login,
                        isMayor: u.id === mayor ? 1 : 0,
                        mayorships: u.id === mayor ? [{start: commits[0].toObject()}] : [],
                        commits: {}
                    }
                };
            });
            commits.forEach(function(ci) {
                var isMayor = mayor === ci.userId;
                var cn = conributions[ci.userId];
                var week = Math.round(ci.date.getTime() / 86400000 / 7);
                if (!cn) return;
                cn.count += 1;
                cn.weight += ci.getWeight(
                    Math.ceil((now - ci.date.getTime()) / 86400000),
                    isMayor
                );
                // increment weekly sum
                cn.u.commits[week] = cn.u.commits[week] || 0;
                cn.u.commits[week] += isMayor ? 1 : 5;

                // check if current mayorship is ended
                if (!isMayor && conributions[mayor].weight < cn.weight) {
                    conributions[mayor].u.mayorships.push({end: ci.toObject()});
                    conributions[mayor].isMayor = 0;
                    mayor = ci.userId;
                    conributions[mayor].u.mayorships.push({start: ci.toObject()});
                    conributions[mayor].isMayor = 1;
                }
            });
            async.forEach(Object.keys(conributions), function(userId, next) {
                (new Contribution(conributions[userId])).save(next);
            }, cb);
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
            }
        ], done);
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
                console.log(data);
                repo.id = data.id;
                repo.ownerId = data.owner.id;
                repo.owner = {
                    id: data.owner.id,
                    login: data.owner.login,
                    avatar: data.owner.avatar_url
                };
                repo.homepage = data.homepage;
                repo.watchers = data.watchers_count;
                repo.fork = 'source' in data ? data.source : false;
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
