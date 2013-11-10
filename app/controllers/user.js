module.exports = UserController;

function UserController() {
}

var cache = {};

UserController.prototype.show = function(c) {

    var name = c.req.param('username');

    if (cache[name] && !c.req.param('nocache')) {
        return respondWith(cache[name]);
    }

    c.User.findOne({where: {username: name}}, function(err, user) {
        c.locals.title = user.name || user.username;
        user.loadProfile(function(err) {
            user.explainKarma(function(karma) {
                cache[name] = {
                    user: user,
                    karma: karma
                };
                respondWith(cache[name]);
                user.visitedAt = new Date();
                user.save();
            });
        });
    });

    function respondWith(data) {
        if (c.req.param('format') === 'json') {
            c.send(data);
        } else {
            c.render(data);
        }
    }

};
