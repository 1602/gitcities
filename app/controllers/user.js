module.exports = UserController;

function UserController() {
}

UserController.prototype.show = function(c) {
    c.User.findOne({where: {username: c.req.param('username')}}, function(err, user) {
        user.loadProfile(function(err) {
            c.send(user);
            user.visitedAt = new Date();
            user.save();
        });
    });
};
