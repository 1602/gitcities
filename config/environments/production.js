var express = require('express');

module.exports = function (compound) {
    var app = compound.app;

    app.configure('production', function () {

        app.compound.on('ready', function() {
            app.compound.models.Repository.processNext(function again() {
                setTimeout(function() {
                    app.compound.models.Repository.processNext(again);
                }, 200);
            });

            app.compound.models.User.processNext(function anotherUser() {
                setTimeout(function() {
                    app.compound.models.User.processNext(anotherUser);
                }, 200);
            });
        });

        app.enable('quiet');
        app.enable('merge javascripts');
        app.enable('merge stylesheets');
        app.disable('assets timestamps');
        app.use(express.errorHandler());
    });
};
