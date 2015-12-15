L.Marker.PowerMarker = L.Marker.extend({
    statics: {
        listHead: null,
        listTail: null,
        nextFrame: false,
        STATE_OFF: 0,
        STATE_ON: 1
    },

    initialize: function(latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);
        this.state = L.Marker.PowerMarker.STATE_OFF;
    },

    addCallback: function(callback) {
        if (!this._callbacks)
            this._callbacks = [];

        this._callbacks.push(callback);
        return this;
    },

    start: function(callback) {
        if (callback) {
            this.addCallback(callback);
        }

        var M = L.Marker.PowerMarker;
        if (this.state != M.STATE_ON) {
            if (M.listTail) {
                M.listTail.next = {
                    marker: this,
                    next: null
                };
                M.listTail = M.listTail.next;
            } else {
                M.listHead = M.listTail = {
                    marker: this,
                    next: null
                };
            }
            this.state = M.STATE_ON;
        }

        this._startTime = this._lastFrameTime = Date.now();
        if (!L.Marker.PowerMarker.nextFrame) {
            L.Marker.PowerMarker.nextFrame = true;
            L.Util.requestAnimFrame(this._animateAndClean, this, false);
        }
        this.fire("started", {
            "timestamp": this._startTime
        });
    },

    stop: function() {
        this.state = L.Marker.PowerMarker.STATE_OFF;
        this.fire("stopped", {
            "timestamp": Date.now()
        });
    },

    _animateAndClean: function() {
        var timestamp = Date.now();
        var M = L.Marker.PowerMarker;
        var cur = M.listHead,
            prev;

        while (cur) {
            if (cur.marker.state == M.STATE_ON) {
                var elapsedTime = timestamp - cur.marker._lastFrameTime;
                for (var i = 0; i < cur.marker._callbacks.length; i++) {
                    var c = cur.marker._callbacks[i];
                    c.call(cur.marker, elapsedTime, timestamp);
                }
                cur.marker._lastFrameTime = timestamp;
                prev = cur;
            } else {
                cur._callbacks = null;
                if (prev) {
                    prev.next = cur.next;
                } else {
                    M.listHead = cur.next;
                }

                if (!cur.next) {
                    M.listTail = prev;
                }
            }
            cur = cur.next;
        }

        if (M.listHead) {
            L.Util.requestAnimFrame(this._animateAndClean, this, false);
        } else {
            M.nextFrame = false;
        }
    }

});

L.Marker.powerMarker = function(latlng, options) {
    return new L.Marker.PowerMarker(latlng, options);
};

L.Marker.PowerMarker.movement = function(points, durations) {
    // if durations is a numeric value, calculate the average time to move between points
    if (durations.constructor !== Array) {
        var d = Math.round(durations / points.length);
        durations = [];
        for (var i = 0; i < points.length; i++) {
            durations.push(d);
        }
    } else if (points.length != durations.length) {
        throw new Error("There must be " + durations.length + " durations for " + points.length + " points");
    }

    function interpolate(start, end, t, dur) {
        var f = t / dur;
        var startLat = (end[0] - start[0]) * f + start[0];
        var startLng = (end[1] - start[1]) * f + start[1];
        return [startLat, startLng];
    }

    function positionInterpolator(points, durations) {
        var index = 0;
        var runTime = 0;
        var startPoint, endPoint, dur = 0;

        return function(elapsedTime, timestamp) {
            runTime += elapsedTime;
            if (runTime != runTime) console.log("elapsedTime", elapsedTime);
            var newSeg = false;
            while (runTime >= dur) {
                if (index < durations.length) { // change path segment
                    startPoint = (index > 0) ? points[index - 1] : (p = this.getLatLng(), [p.lat, p.lng]);
                    endPoint = points[index];
                    runTime -= dur;
                    if (runTime != runTime) console.log("duration ", dur);
                    dur = durations[index];
                    newSeg = true;
                    index++;
                } else {
                    this.stop();
                    this.setLatLng(points[points.length - 1]);
                    this.fire("complete");
                    return;
                }
            }

            if (newSeg) {
                this.fire("stepped", {
                    destination: index - 1
                });
            }
            var nextPoint = interpolate(startPoint, endPoint, runTime, dur);
            this.setLatLng(nextPoint);

        };
    }

    return positionInterpolator(points, durations);
};