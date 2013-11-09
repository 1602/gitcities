var app = require('../')();
app.compound.init();

var User = app.compound.models.User;

describe.only('user', function() {

    it('should calc karma points', function(done) {
        User.findOne({where: {username: '1602'}}, function(err, user) {
            user.contributions(function(err, cs) {
                console.log(user, cs);
                done();
            });
        });
    });

});
