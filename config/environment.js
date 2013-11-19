module.exports = function (compound) {

    var express = require('express');
    var app = compound.app;
    var GitHub = require('../lib/github.js');

    app.configure(function(){
        app.use(express.static(app.root + '/public', { maxAge: 86400000 }));
        app.set('jsDirectory', '/javascripts/');
        app.set('cssDirectory', '/stylesheets/');
        app.set('cssEngine', 'stylus');
        app.enable('noeval schema');
        app.enable('autoupdate');
        compound.loadConfigs(__dirname);
        app.use(express.bodyParser());
        app.use(express.cookieParser('secret'));
        app.use(express.session({secret: 'secret'}));
        app.use(express.methodOverride());
        app.use(app.router);

        var conf = app.get('gh');
        compound.gh = new GitHub(conf.key, conf.secret, conf.token);
    });

};
