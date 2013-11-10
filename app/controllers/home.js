module.exports = HomeController;

function HomeController() {
}

HomeController.prototype.show = function(c) {
    c.User.all({order: 'nishkamKarma desc', limit: 20}, function(err, users) {
        c.User.all({order: 'kriyamanaKarma desc', limit: 20}, function(err, authors) {
            c.send({
                topContributors: users.map(prepare),
                topAuthors: authors.map(prepare)
            });
        });
    });

    function prepare(user) {
        user = user.toObject();
        user.authorOf = user.authorOf.length;
        return user;
    }
};
