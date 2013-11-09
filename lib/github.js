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
    var uri = apiUri + path;
    var auth = {
        user: this.token,
        pass: 'x-oauth-basic'
    };
    if (opts.ifModifiedSince) {
        if (opts.ifModifiedSince instanceof Date) {
            opts.ifModifiedSince = moment.utc(opts.ifModifiedSince).format(ISODATE) + ' GMT';
        }
        headers['If-Modified-Since'] = opts.ifModifiedSince;
        var split = uri.split('?');
        if (split[1]) {
            uri = split[0] + '?per_page=1';
        }
    }
    query(uri, function(res, data) {
        if (!opts.ifModifiedSince) {
            cb(null, data, res);
        } else if (res.statusCode === 304) {
            cb(null, null, res);
        } else if (split[1]) {
            query(split.join('?'), function(res, data) {
                cb(null, data, res);
            });
        } else {
            cb(null, data, res);
        }
    });

    function query(uri, done) {
        console.log('request', uri, 'with headers', headers);
        request({
            uri: uri,
            method: method,
            headers: headers,
            auth: auth
        }, function(err, res) {
            if (err) {
                console.log('got', uri, 'with error', err.message);
                return cb(err);
            }
            console.log('got', uri, res.headers.status);
            if (res.body) {
                try {
                    var data = JSON.parse(res.body);
                } catch(e) {
                    return cb(e, null, res);
                }
                done(res, data);
            } else {
                done(res);
            }
        });
    }

};
