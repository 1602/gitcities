module.exports = RepoController;
function RepoController(){
}

RepoController.prototype.show = function( c ) {
    var name = c.params.username + '/' + c.params.reponame;
    this.title = name;
    c.Repository.create(name, function(err, repo) {
        if (err) {
            c.next(err);
        } else {
            c.render({
                repository: repo
            });
        }
    });
};
