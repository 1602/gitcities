exports.routes = function (map) {
    map.get('/', 'home#show');
    map.post('/', 'home#search');
    map.get(':username', 'user#show');
    map.get(':username/:reponame', 'repo#show');
};
