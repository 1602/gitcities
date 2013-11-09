module.exports = RepoController;
function RepoController(){
}

RepoController.prototype.show = function( c ) {
    var name = c.params.username + '/' + c.params.reponame;
    this.title = name;
    c.Repository.findOne({where: {name: name}}, function(err, data) {
        if (err) {
            c.next(err);
        }
        if (!data) {
            c.Repository.create({name: name}, function(force, data) {
                c.render('show', {repo: data});
            });
        } else {
            c.render('show', {repo: data});
        }
    });
};
