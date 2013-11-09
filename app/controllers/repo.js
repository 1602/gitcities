module.exports = RepoController
function RepoController(){}
RepoController.prototype.show = function( c ) {
  name = c.params.username + '/' + c.params.reponame
  this.title = name;
  c.Repository.findOne(
    {where: {name: name}},
    function(force, data) {
      if(data == null) {
        c.Repository.create(
          {name: name},
          function(force, data) {
            c.render('show', {repo: data});
          }
        );
      } else {
        c.render('show', {repo: data});
      }
    }
  );

}