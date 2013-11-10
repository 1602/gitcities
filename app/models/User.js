var async = require('async');

module.exports = function(compound, User) {
    var Commit = compound.models.Commit;
    var Repository = compound.models.Repository;

    User.hasAndBelongsToMany('repositories');
    User.hasMany('contributions');

    User.prototype.loadOwnRepos = function(cb) {
        var user = this;
        compound.gh.get('/users/' + this.username + '/repos?type=owner&sort=pushed', {ifNoneMatch: true}, function(err, data) {
            if (data) {
                user.authorOf = data.map(function(r) {
                    return r.id;
                });
                user.save(function() {
                    cb(err, data);
                });
            } else if (cb) {
                cb();
            }
        });
    };

    User.prototype.explainKarma = function(cb) {
        var now = Date.now();
        var karma = {
            week: {a: 0, c: 0, p: {}},
            month: {a: 0, c: 0, p: {}},
            later: {a: 0, c: 0, p: {}}
        };
        var projectIds = {};
        var ownRepos = this.authorOf.map(function(x) {
            return x.id;
        });
        Commit.all({min: Date.now() - 86400000 * 108, max: Date.now(), where: {userId: this.id}}, function(err, cs) {

            cs.forEach(function(c) {
                var daysAgo = Math.ceil((now - c.date.getTime()) / 86400000);
                if (daysAgo <= 1) daysAgo = 2;
                var ca, cc, type;
                if (ownRepos.indexOf(c.repoId) === -1) {
                    type = 'contributor';
                    ca = 10;
                    cc = 50;
                } else {
                    type = 'author';
                    cc = 10;
                    ca = 50;
                }
                var gravity = Math.log(daysAgo);
                var period = 'later';
                if (daysAgo <= 7) {
                    period = 'week';
                } else if (daysAgo <= 31) {
                    period = 'month';
                }
                karma[period].a += c.gainA = Math.round(ca / gravity);
                karma[period].c += c.gainC = Math.round(cc / gravity);
                c.gain = c.gainC + c.gainA;
                karma[period].p[c.repoId] = karma[period].p[c.repoId] || [];
                karma[period].p[c.repoId].push(c);
                projectIds[c.repoId] = null;
            });
            Repository.all({where: {id: {inq: Object.keys(projectIds)}}}, function(err, projects) {
                projects.forEach(function(x) {
                    projectIds[x.id] = x;
                });
                karma.projects = projectIds;
                console.log(karma.projects);
                cb(karma);
            });
        });
    };

    User.prototype.calcKarma = function(cb) {
        var ka = 0, kc = 0, now = Date.now(), user = this;
        var ownRepos = this.authorOf.map(function(x) {
            return x.id;
        });
        Commit.all({where: {userId: this.id}}, function(err, cs) {
            cs.forEach(function(c) {
                var daysAgo = Math.ceil((now - c.date.getTime()) / 86400000) + 1;
                if (daysAgo <= 1) daysAgo = 2;
                var ca, cc;
                if (ownRepos.indexOf(c.repoId) === -1) {
                    ca = 10;
                    cc = 50;
                } else {
                    cc = 10;
                    ca = 50;
                }
                var gravity = Math.log(daysAgo);
                ka += Math.round(ca / gravity);
                kc += Math.round(cc / gravity);
            });
            user.karma = ka + kc * Math.PI;
            user.kriyamanaKarma = ka; // author's karma
            user.nishkamKarma = kc; // contributor's karma
            user.lastCheckedAt = new Date();
            user.save(cb);
        });
    };

    User.prototype.loadProfile = function(force, cb) {
        if ('function' === typeof force) {
            cb = force;
            force = false;
        }
        var user = this;
        compound.gh.get('/users/' + this.username, {ifNoneMatch: !force}, function(err, data, res) {
            if (data) {
                user.avatar = data.avatar_url;
                user.name = data.name;
                user.location = data.location;
                user.publicRepos = data.public_repos;
                user.followers = data.followers;
                user.following = data.following;
                cb(null, user);
            } else {
                cb(err, null);
            }
        });
    };

    User.processNext = function(cb) {
        User.findOne({order: 'lastCheckedAt ASC'}, function(err, user) {
            if (user) {
                if (user.lastCheckedAt > new Date(10)) {
                    console.log('FINISHED');
                    return;
                }
                var wasUndef = typeof user.karma === 'undefined';
                user.calcKarma(function() {
                    if (wasUndef && user.karma > 0 && user.authorOf.length === 0) {
                        user.loadOwnRepos(function(err, repos) {
                            if (user.kriyamanaKarma > 10) {
                                async.forEach(repos.filter(function(x) {
                                    return x.language === 'JavaScript';
                                }).slice(-5), function(repo, next) {
                                    Repository.create(repo.full_name, next);
                                }, function() {
                                    user.calcKarma(cb);
                                });
                            } else {
                                user.calcKarma(cb);
                            }
                        });
                    } else {
                        cb();
                    }
                });
            } else {
                cb();
            }
        });
    };

    User.prototype.syncData = function(done) {
        var user = this;
        async.series([
            function(next) {
                user.calcKarma();
            },
            done
        ]);
    };
};
