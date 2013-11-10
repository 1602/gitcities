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
            c.Repository.create(name, function(err, data) {
                c.send(data);
            });
        } else {
            c.send(data);
        }
    });
};
