exports.makeGutHubLink = function(s) {
    var link = s;
    if (typeof s !== 'string') {
        link = s.username || s.name;
        s = s.name;
    }
    return '<a href="https://github.com/' + link + '">' + s + '</a>';
};
