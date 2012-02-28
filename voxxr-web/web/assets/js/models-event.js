(function(exports) {
    var Event = function(data) {
        var self = this;
        self.id = ko.observable(data.id);
        self.title = ko.observable(data.title);
        self.subtitle = ko.observable(data.subtitle);
        self.from = ko.observable(data.from);
        self.to = ko.observable(data.to);
        self.nbPresentations = ko.observable(data.nbPresentations);
        self.dates = ko.observable(data.dates);
        self.nowplaying = ko.observableArray([]);
        self.days = ko.observableArray(_(data.days).map(function(day) { return ds.scheduleDay(day);}));
        self.remaining = ko.observable();
        self.since = ko.observable();
        var crons = {};

        function updateRemaining() {
            var remainingSeconds = remaining.getSeconds(self.from());
            if (remainingSeconds > 0) {
                self.remaining(remaining.getString(remainingSeconds) + " remaining");
                crons.remaining = setTimeout(updateRemaining, 1000);
            } else {
                self.remaining("");
                self.refreshNowPlaying();
            }
        }
        function updateSince() {
            var sinceSeconds = -remaining.getSeconds(self.to());
            if (sinceSeconds > 0) {
                self.since(remaining.getString(sinceSeconds) + " ago");
                crons.since = setTimeout(updateSince, 1000);
            } else {
                self.since("");
            }
        }

        self.refreshNowPlaying = function() {
            console.log("refreshing now playing");
            $.ajax({
                url: models.baseUrl + "/events/" + self.id() + "/nowplaying",
                dataType:"json",
                success: function(data) {
                    var wasplaying = self.nowplaying();

                    self.nowplaying(_(data).map(function(presentation) {
                        var p = ds.presentation(presentation);
                        p.playing(true);
                        p.room().currentPresentation(p);
                        wasplaying = _(wasplaying).reject(function(e) { return e.id() === p.id() });
                        return p;
                    }));

                    // reset playing status for old nowplaying presentations
                    _(wasplaying).each(function(p) {
                        p.playing(false);
                        if (p.room().currentPresentation() === p) {
                            p.room().currentPresentation(null);
                        }
                    });

                    // auto update
                    if (crons.refreshNowPlaying) {
                        clearTimeout(crons.refreshNowPlaying);
                        crons.refreshNowPlaying = null;
                    }
                    var refreshIn = 15000;
                    if (data.length === 0) {
                        var remainingSeconds = remaining.getSeconds(self.from());
                        if (remainingSeconds > 0) {
                            console.log("event not started yet");
                            refreshIn = (remainingSeconds * 1000) - (5 * 60 * 1000);
                        } else {
                            var sinceSeconds = -remaining.getSeconds(self.to());
                            if (sinceSeconds > (5 * 60 * 1000)) {
                                console.log("event finished");
                                return;
                            }
                        }
                    }
                    // never shedule auto refresh for more than 2 days
                    // http://stackoverflow.com/questions/3468607/why-does-settimeout-break-for-large-millisecond-delay-values
                    if (refreshIn < 172800000) {
                        refreshIn = Math.max(refreshIn, 15000); // never refresh faster than every 15 seconds
                        console.log("scheduling now playing auto refresh in ", (refreshIn / 1000), " s");
                        crons.refreshNowPlaying = setTimeout(self.refreshNowPlaying, refreshIn);
                    }
                },
                error: function() {
                    console.log("error when getting now playing, retry in 15 seconds");
                    crons.refreshNowPlaying = setTimeout(self.refreshNowPlaying, 15000);
                }
            });
        }

        self.enter = function() {
            self.autorefresh(true);
        }

        self.quit = function() {
            self.autorefresh(false);
        }

        self.autorefresh = function(b) {
            if (self.autorefresh.status === b) return;
            self.autorefresh.status = b;
            if (b) {
                self.refreshNowPlaying();
                updateRemaining();
                updateSince();
            } else {
                 _(crons).each(function(cron, key) {
                    if (cron) {
                        clearTimeout(cron);
                        crons[key] = null;
                    }
                });
            }
        }

    }


    exports.models = exports.models || {};
    exports.models.Event = Event;
})(window);