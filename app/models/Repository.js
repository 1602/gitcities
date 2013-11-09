var moment = require('moment');
var async = require('async');

module.exports = function(compound, Repository) {
    var Commit = compound.models.Commit;

    Repository.afterCreate = function() {
        this.syncData();
        this.lastCheckedAt = new Date();
        this.save();
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

    Repository.prototype.loadCommits = function(force, cb) {
        if ('function' === typeof force) {
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
                    console.log(line);
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
                }, cb);
            } else if(cb) {
                cb('not modified');
            }
        });
    };

};
