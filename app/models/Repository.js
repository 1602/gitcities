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

    Repository.create = function(name, cb, pipe) {
        Repository.findOne({where: {name: name}}, function(err, repo) {
            if (repo) {
                if (Date.now() - repo.lastCheckedAt > 300000) {
                    repo.loadStats(function() {
                        repo.lastCheckedAt = new Date();
                        repo.save();
                        cb(null, repo);
                    });
                } else {
                    cb(null, repo);
                }
                return;
            }
            if (pipe) {
                cb = function() {
                    pipe('</body>', true);
                };
            }
            var r = new Repository({name: name});
            r.pipe = pipe;
            r.loadStats(true, function(err) {
                if (!err) {
                    if (r.fork) {
                        return Repository.create(r.fork.full_name, cb);
                    }
                    r.syncAllData(function() {
                        r.lastCheckedAt = new Date();
                        r.save(cb);
                    }, pipe);
                } else if (cb) {
                    cb(err);
                }
            });
        });
    };

    Repository.prototype.loadCitizens = function(limit, cb) {
        if ('function' === typeof limit) {
            cb = limit;
            limit = 20;
        }
        this.contributions({limit: limit}, function(err, cs) {
            var i = 0;
            async.forEach(cs, function(c, done) {
                c.n = ++i;
                if (c.u && (c.u.name || c.u.avatar) || c.n > 13) {
                    done();
                } else {
                    console.log('find user' + c.userId);
                    User.find(c.userId, function(err, u) {
                        if (u.name || u.avatar || c.n > 13) {
                            c.u = {
                                id: u.id,
                                login: u.username,
                                avatar: u.avatar,
                                name: u.name
                            };
                            done();
                            c.save();
                        } else {
                            u.loadProfile(true, function() {
                                u.save();
                                c.u = {
                                    id: u.id,
                                    login: u.username,
                                    avatar: u.avatar,
                                    name: u.name
                                };
                                c.save();
                                done();
                            });
                        }
                    });
                }
            }, function() {
                cb(err, {
                    mayor: cs[0],
                    active: cs.slice(1, 17),
                    others: cs.slice(17, cs.length),
                    totalCount: cs.countBeforeLimit
                });
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
        var userIds = {};
        var commits = [];
        if (repo.pipe) {
            repo.pipe('commit');
        }
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
                if (!userIds[userId]) {
                    userIds[userId] = line.author ? line.author.login : true;
                }
                var commit = new Commit({
                    id: line.sha,
                    date: moment(line.commit.author.date),
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
                        if (repo.pipe) {
                            repo.pipe('commit');
                        }
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
                userIds[ci.userId] = true;
            });
        }
        var mayor, i = -1, number = /^\d+$/;
        while (!mayor && commits[++i]) {
            if (commits[i] && commits[i].userId.match(number)) {
                mayor = commits[i].userId;
            }
        }
        var conributions = {};
        var userIdsArray = Object.keys(userIds);
        User.all({where: {id:{inq: userIdsArray}}}, function(err, users) {
            if (userIdsArray.length > users.length) {
                userIdsArray.forEach(function(userId, done) {
                    if (!users.some(function(u) {
                        return u.id === userId;
                    }) && userIds[userId] !== true) {
                        var user = new User({username: userIds[userId], id: userId});
                        users.push(user);
                        user.save();
                    }
                });
            }
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
                console.log(conributions[mayor], mayor);
                if (!isMayor && conributions[mayor].weight < cn.weight) {
                    conributions[mayor].u.mayorships.push({end: ci.toObject()});
                    conributions[mayor].isMayor = 0;
                    mayor = ci.userId;
                    conributions[mayor].u.mayorships.push({start: ci.toObject()});
                    conributions[mayor].isMayor = 1;
                }
            });
            async.forEach(Object.keys(conributions), function(userId, next) {
                repo.pipe && repo.pipe('contributor');
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
                repo.loadAllCommits(function(err, us, cs) {
                    if (err) {
                        console.log(err);
                    }
                    repo.buildContributionHistory(cs, us, next);
                });
            },
            function(next) {
                repo.loadCollaborators(next);
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
                repo.description = data.description;
                repo.watchers = data.watchers_count;
                repo.pushedAt = moment(data.pushed_at);
                repo.createdAt = moment(data.created_at);
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
                        date: moment(line.commit.author.date),
                        message: line.commit.message,
                        userId: userId,
                        repoId: repo.id
                    })).save(next);
                }, function(err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
            if ('function' === typeof cb) {
                cb();
            }
        });
    };

};
