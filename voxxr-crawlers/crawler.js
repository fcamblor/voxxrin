var http = require("http"),
    _ = require('underscore'),
    url = require('url'),
    token = require('./authorizationToken'),
    mixit = require('./crawler_mixit.js'),
    jugsummercamp = require('./crawler_jugsummercamp.js'),
    lanyrd = require('./crawler_lanyrd.js'),
    devoxxfr = require('./crawler_devoxxfr.js'),
    breizhcamp = require('./crawler_breizhcamp.js')
    ;

var PROD_BASE_URL = 'http://app.voxxr.in';
var DEV_BASE_URL = 'http://localhost:8080';

var EVENTS = {
    "devoxxfr14": {
        crawlerType: devoxxfr, authTokens: [ "6", "all" ],
        event: {
            /* Devoxx Fr 2014 */
            id: 14,
            /* Hardcoding some event details here, since not provided by REST API */
            from: new Date(Date.parse("2014-04-16T08:00:00.000+02:00")),
            to: new Date(Date.parse("2014-04-18T18:55:00.000+02:00")),
            title: "Devoxx France 2014",
            subtitle: "",
            description: "",
            timezone: "Europe/Paris",
            location: "Mariott Hotel",
            initialCrawlingUrls: [
                "http://cfp.devoxx.fr/api/conferences/devoxxFR2014/schedules/wednesday",
                "http://cfp.devoxx.fr/api/conferences/devoxxFR2014/schedules/thursday",
                "http://cfp.devoxx.fr/api/conferences/devoxxFR2014/schedules/friday"
            ]
        }
    },
    "mixit13": {
        crawlerType: mixit, authTokens: [ "1", "all" ],
        event: {
            /* Mix-IT 2013 */
            id: 13,
            /* Hardcoding some event details here, since not provided by REST API */
            from: new Date(Date.parse("2013-04-25T08:30:00.000+02:00")),
            to: new Date(Date.parse("2013-04-26T18:30:00.000+02:00")),
            title: "Mix-IT 2013",
            subtitle: "",
            description: "Java, Agilité, Web, Innovations... Des idées pour tout de suite !",
            location: "SUPINFO Lyon - Lyon"
        }
    },
    "mixit14": {
        crawlerType: mixit, authTokens: [ "1", "all" ],
        event: {
            /* Mix-IT 2014 */
            id: 14,
            /* Hardcoding some event details here, since not provided by REST API */
            from: new Date(Date.parse("2014-04-29T09:00:00.000+02:00")),
            to: new Date(Date.parse("2013-04-30T18:30:00.000+02:00")),
            title: "Mix-IT 2014",
            subtitle: "",
            description: "Java, Agilité, Web, Innovations... Des idées pour tout de suite !",
            location: "CPE Lyon"
        }
    },
    "lkbf13": {
        crawlerType: lanyrd, authTokens: [ "5", "all" ],
        event: {
            /* Lean Kanban France 2013 */
            id: 'lkbf13',
            /* Hardcoding some event details here, since not provided by REST API */
            title: 'Lean Kanban France 2013',
            domainUrl: 'http://lanyrd.com',
            baseUrl: 'http://lanyrd.com/2013/lean-kanban-france/'
        }
    },
    "jsc13": {
        crawlerType: jugsummercamp, authTokens: [ "4", "all" ],
        event: {
            /* Jugsummercamp 2013 */
            id: 13,
            /* Hardcoding some event details here, since not provided by REST API */
            title: "JugSummerCamp 2013",
            description: "Une journée entière, à l'espace Encan de La Rochelle, pour prendre les dernières nouvelles du monde Java.",
            initialCrawlingUrls: ["http://www.jugsummercamp.com/api/edition/4"]
        }
    },
    "bzh14": {
        crawlerType: breizhcamp, authTokens: [ "2", "all" ],
        event: {
            /* Breizhcamp 2014 */
            id: 14,
            /* Hardcoding some event details here, since not provided by REST API */
            title: "Breizhcamp 2014",
            description: "Un mix de technologies, un max de connaissances",
            initialCrawlingUrls: [
                "https://raw.githubusercontent.com/BreizhJUG/breizhcamp-www/gh-pages/json/schedule.json",
                "https://raw.githubusercontent.com/BreizhJUG/breizhcamp-www/gh-pages/json/talks.json"
            ]
        }
    }
};

var port = process.env.PORT || 3000;
http.createServer(function(req, response) {
    var urlObj = url.parse(req.url, true);
    var mode = urlObj.query.mode;
    var apiKey = urlObj.query.apiKey;

    // Updating base url in dev mode
    var baseUrl = mode==="dev"?DEV_BASE_URL:PROD_BASE_URL;
    var debugQueries = true || mode==="dev";


    // Browsing only specific event family if "eventFamiliyId" http query param is provided
    var specificEventFamilyId = urlObj.query.eventFamilyId;
    if(specificEventFamilyId){
        if(!_.isArray(specificEventFamilyId)){
            specificEventFamilyId = [ specificEventFamilyId ];
        }
    } else {
        specificEventFamilyId = _.keys(EVENTS);
    }

    // Ensuring given apiKey allows the user to call the crawler for given family id
    for(var i=0; i<specificEventFamilyId.length; i++) {
        var eventName = specificEventFamilyId[i];
        var allowedApiKeys = _.map(EVENTS[ eventName].authTokens, function(authToken){ return token.crawlersFamilies[authToken]; });
        if(_.contains(allowedApiKeys, apiKey)) {
            // No problem
        } else {
            response.writeHead(401, {"Content-Type": "text/plain"});
            response.write("Bad apiKey for event ["+eventName+"] !");
            response.end();
            return;
        }
    }

    var eventsToCrawl = _.map(specificEventFamilyId, function(famId){ return EVENTS[famId]; });

    response.writeHead(200, {"Content-Type": "text/plain"});
    if (req.method === 'POST') {
        response.write("Started crawling...");
        _(eventsToCrawl).each(function(eventToCrawl) {
            eventToCrawl["crawlerType"].crawlEvent(baseUrl, eventToCrawl["event"], debugQueries);
        });
    } else {
        response.write("Ready...");
    }
    response.end();
}).listen(port);

console.log('server ready on http://localhost:' + port + '/');