var request = require('request');
var moment = require('moment');

var apiUri = 'https://api.github.com';
var ISODATE = 'ddd, DD MMM YYYY hh:mm:ss';

module.exports = Client;

function Client(api, secret, token) {
    this.api = api;
    this.secret = secret;
    this.token = token;
}

Client.prototype.get = function(path, opts, cb) {
    return this.request('GET', path, opts, cb);
};

Client.prototype.request = function(method, path, opts, cb) {
    var headers = {};
    if (opts.ifModifiedSince) {
        if (opts.ifModifiedSince instanceof Date) {
            opts.ifModifiedSince = moment.utc(opts.ifModifiedSince).format(ISODATE) + ' GMT';
        }
        headers['If-Modified-Since'] = opts.ifModifiedSince;
    }
    request({
        uri: apiUri + path,
        method: method,
        headers: headers,
        auth: {
            user: this.token,
            pass: 'x-oauth-basic'
        }
    }, cb);
};
