var app = require('../')();
var should = require('should');
app.compound.init();

describe('github', function() {
    it('should request data using If-Modified-Since', function(done) {
        app.compound.gh.get('/repos/1602/roco/commits', {ifModifiedSince: new Date}, function(err, res) {
            res.headers.status.should.equal('304 Not Modified');
            done();
        });
    });
});
