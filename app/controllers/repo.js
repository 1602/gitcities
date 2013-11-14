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
            repo.loadCitizens(100, function(err, citizens) {
                c.Commit.count({repoId: repo.id}, function(err, cc) {
                    c.render({
                        commitsCount: cc,
                        repository: repo,
                        citizens: citizens
                    });
                });
            });
        }
    });
};
