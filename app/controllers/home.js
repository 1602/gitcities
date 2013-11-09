module.exports = HomeController;

function HomeController() {
}

HomeController.prototype.show = function(c) {
    c.User.all({limit: 20}, function(err, users) {
        c.send({topContributors: users});
    });
};
