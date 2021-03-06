exports.makeGutHubLink = function(s) {
    if ('undefined' === typeof s) return '';
    var link = s;
    if (typeof s !== 'string') {
        link = s.username || s.login || s.name;
        s = s.name;
    }
    return '<a href="https://github.com/' + link + '">' + s + '</a>';
};

exports.percent = function(v) {
    return Math.round(10000 * v) / 100 + '%';
};
