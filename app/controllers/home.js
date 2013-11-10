module.exports = HomeController;

function HomeController() {
}

var cache, limit = 100;

HomeController.prototype.show = function(c) {
    this.title = 'NodeJS Suburbs';

    if (cache && !c.req.param('nocache')) {
        c.render(cache);
    } else {

        c.Repository.all({order: 'karma desc', limit: 30}, function(err, cities) {
            c.User.all({order: 'karma desc', limit: limit}, function(err, users) {
                cache = {
                    citizens: users.map(prepare),
                    cities: cities
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
