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

    setCallback: function(callback) {
        this._update = callback;
        var M = L.Marker.PowerMarker;
        if (this.state != M.STATE_ON) {
            if (M.listTail) {
                M.listTail.next = {marker: this, next: null};
                M.listTail = M.listTail.next;
            } else {
                M.listHead = M.listTail = {marker: this, next: null};
            }
            this.state = M.STATE_ON;
        }
        return this;
    },

    start: function(callback) {
        if (callback) {
            this.setCallback(callback);
        }

        this._startTime = this._lastFrameTime = Date.now();
        if (!L.Marker.PowerMarker.nextFrame) {
            L.Marker.PowerMarker.nextFrame = true;
            L.Util.requestAnimFrame(this._animateAndClean, this, false);
        }
    },

    stop: function() {
        this.state = L.Marker.PowerMarker.STATE_OFF; 
    },

    _animateAndClean: function() {
        timestamp = Date.now(); 
        var M = L.Marker.PowerMarker; 
        var cur = M.listHead, prev; 

        while(cur) {
            if (cur.marker.state == M.STATE_ON) {
                cur.marker._update.call(cur.marker, timestamp - cur.marker._lastFrameTime, timestamp);
                cur.marker._lastFrameTime = timestamp; 
                prev = cur;
            } else {
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
}

L.Marker.PowerMarker.movement = function(points, durations) {
    if (points.length != durations.length) {
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
            while (runTime > dur) {
                if (index < durations.length) { // change path segment
                    startPoint = (index > 0) ? points[index - 1] : (p = this.getLatLng(), [p.lat, p.lng]); 
                    endPoint = points[index];
                    runTime -= dur;
                    dur = durations[index];
                    this.fire("begin", {destination: index});
                    index++;
                } else {
                    this.stop();
                    this.setLatLng(points[points.length - 1]);
                    this.fire("complete");
                    return; 
                }
            }
            var nextPoint = interpolate(startPoint, endPoint, runTime, dur);
            this.setLatLng(nextPoint); 
            
        }
    }

    return positionInterpolator(points, durations);
}



