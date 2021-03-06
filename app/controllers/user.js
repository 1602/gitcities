module.exports = UserController;

function UserController() {
}

var cache = {};

setInterval(function() {
    for (var i in cache) delete cache[i];
}, 1000);

UserController.prototype.show = function(c) {

    var name = c.req.param('username');

    if (cache[name] && !c.req.param('nocache')) {
        return respondWith(cache[name]);
    }

    c.User.findOne({where: {username: name}}, function(err, user) {
        if (!user) {
            return c.next(new Error('Not found'));
        }
        c.locals.title = user.name || user.username;
        user.loadProfile(function(err) {
            user.explainKarma(function(karma) {
                c.Contribution.all({where: {userId: user.id}}, function(err, cs) {
                    var projectIds = karma.projectIds;
                    cs.forEach(function(c) {
                        projectIds[c.repositoryId] = null;
                    });
                    c.Repository.all({where: {id: {inq: Object.keys(projectIds)}}}, function(err, projects) {
                        projects.forEach(function(x) {
                            projectIds[x.id] = x;
                        });
                        karma.projects = projectIds;
                        cache[name] = {
                            user: user,
                            karma: karma,
                            contributions: cs
                        };
                        respondWith(cache[name]);
                        user.visitedAt = new Date();
                        user.save();
                    });
                });
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

UserController.prototype.avatar = function(c) {
    var name = c.req.param('username');
    c.User.findOne({where: {username: name}}, function(err, user) {
        if (!user) {
            return c.User.find(name, go);
        } else {
            go(err, user);
        }
    });
    function go(err, user) {
        if (!user) {
            return c.next(new Error(404));
        }
        if (user.avatar) {
            return c.redirect(user.avatar);
        }
        user.loadProfile(1, function(err, u) {
            if (u) {
                u.save();
                c.redirect(user.avatar);
            } else {
                c.next(new Error(404));
            }
        });
    }
};
