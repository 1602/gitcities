var app = require('../')();
var should = require('should');
app.compound.init();
var GitHub = require('../lib/github.js');
var conf = app.get('gh');
var gh = new GitHub(conf.key, conf.secret, conf.token);

describe('github', function() {
    it('should request data using If-Modified-Since', function(done) {
        gh.get('/repos/1602/roco/commits', {ifModifiedSince: new Date}, function(err, res) {
            res.headers.status.should.equal('304 Not Modified');
            done();
        });
    });
});
