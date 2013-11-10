var express = require('express');

module.exports = function (compound) {
    var app = compound.app;

    app.configure('production', function () {

        Repository.processNext(function again() {
            setTimeout(function() {
                Repository.processNext(again);
            }, 200);
        });

        User.processNext(function anotherUser() {
            setTimeout(function() {
                User.processNext(anotherUser);
            }, 200);
        });

        app.enable('quiet');
        app.enable('merge javascripts');
        app.enable('merge stylesheets');
        app.disable('assets timestamps');
        app.use(express.errorHandler());
    });
};
