exports.routes = function (map) {
    // Generic routes. Add all your routes below this line
    // feel free to remove generic routes

    map.get(':username/:reponame', 'repo#show');
};
