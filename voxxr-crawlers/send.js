var request = require('request'),
    Q = require('q'),
    fs = require('fs'),
    stringify = require('json-stringify-safe'),
    token = require('./authorizationToken');

module.exports = function(options, data) {
    if ('string' == typeof options) options = { url: options }
    options.method = options.method || 'POST';
    options.headers = options.headers || {
        'Authorization':token.gae,
        'Content-Type': 'application/json'
    }
    options.body = JSON.stringify(data);

    var deferred = Q.defer();
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            deferred.resolve(body);
        } else {
            fs.appendFile(
                "/tmp/crawler.log",
                "Send error on ["+options.method+" "+options.url+"] and data : "+stringify(data, null, 2),
                function(err) { if(err) throw err; });
            deferred.reject({f:'send', error: error, response: response, options: options});
        }
    });
    return deferred.promise
}