module.exports = RepoController;
function RepoController(){
}

RepoController.prototype.show = function( c ) {
    var name = c.params.username + '/' + c.params.reponame;
    this.title = name;
    var first = true;
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
    }, function(msg, end) {
        if (first) {
            first = false;
            c.render('pipe', {pipe: true}, function(err, html) {
                c.res.write(html);
                pipe(msg);
            });
            return;
        }
        if (end) {
            c.res.end('<script type="text/javascript">location.href = "/' + name + '";</script></body></html>');
        } else {
            pipe(msg);
        }
    });

    function pipe(msg) {
        var str = '<script type="text/javascript">pipe("' + msg + '");</script>';
        console.log(str);
        c.res.write(str);
    }
};
