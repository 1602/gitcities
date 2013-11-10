module.exports = HomeController;

function HomeController() {
}

var cache, limit = 50;

HomeController.prototype.show = function(c) {
    this.title = 'Opensource world';

    if (cache && !c.req.param('nocache')) {
        c.render(cache);
    } else {

        c.User.all({order: 'nishkamKarma desc', limit: limit}, function(err, users) {
            c.User.all({order: 'kriyamanaKarma desc', limit: limit}, function(err, authors) {
                cache = {
                    topContributors: users.map(prepare),
                    topAuthors: authors.map(prepare)
                };
                c.render(cache);
            });
        });
    }

    function prepare(user) {
        user = user.toObject();
        user.authorOf = user.authorOf.length;
        return user;
    }
};
