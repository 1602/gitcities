exports.routes = function (map) {
    map.get('/', 'home#show');
    map.get(':username', 'user#show');
    map.get(':username/:reponame', 'repo#show');
};
