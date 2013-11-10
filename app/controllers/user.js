module.exports = UserController;

function UserController() {
}

var cache;

UserController.prototype.show = function(c) {

    if (cache) {
        return respondWith(cache);
    }

    c.User.findOne({where: {username: c.req.param('username')}}, function(err, user) {
        c.locals.title = user.name || user.username;
        user.loadProfile(function(err) {
            cache = {
                user: user
            };
            respondWith(cache);
            user.visitedAt = new Date();
            user.save();
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
