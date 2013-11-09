var moment = require('moment');
var async = require('async');

module.exports = function(compound, Repository) {
    var Commit = compound.models.Commit;

    Repository.afterCreate = function() {
        this.loadCommits();
        this.lastCheckedAt = new Date();
        this.save();
    };

    Repository.processNext = function() {
        Repository.findOne(function(err, repo) {
            if (repo) {
                repo.loadCommits(console.log);
                repo.lastCheckedAt = new Date();
                repo.save();
            }
        });
    };

    Repository.prototype.loadStats = function(cb) {
        var repo = this;
        compound.gh.get('/repos/' + this.name, {ifModifiedSince: this.lastCheckedAt}, function(err, data, res) {
            console.log(data);
        });
    };

    Repository.prototype.loadCommits = function(cb) {
        var repo = this;
        compound.gh.get('/repos/' + this.name + '/commits?per_page=100&since=' + escape(moment(this.lastCheckedAt).format()), {ifModifiedSince: this.lastCheckedAt}, function(err, data, res) {
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
                    Commit.create({
                        id: line.sha,
                        date: moment(line.commit.committer.date),
                        message: line.commit.message,
                        userId: userId,
                        repoId: repo.id
                    }, next);
                }, cb);
            } else {
                cb('not modified');
            }
        });
    };

};
