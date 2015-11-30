L.Marker.PowerMarker = L.Marker.extend({
    statics: {
        id: 0,
        listHead: null, 
        listTail: null,
        nextFrame: false, 
        STATE_OFF: 0, 
        STATE_ON: 1
    },

    initialize: function(latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);
        //console.log("i")
        this.state = L.Marker.PowerMarker.STATE_OFF; 
    }, 

    on: function(updateCallback) {
        this._update = updateCallback;
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

        this._onTime = this._lastFrameTime = Date.now(); 
        this._run(); 
    },

    off: function() {
        this.state = L.Marker.PowerMarker.STATE_OFF; 
    },

    _run: function() {
        if (!L.Marker.PowerMarker.nextFrame) {
            L.Marker.PowerMarker.nextFrame = true; 
            L.Util.requestAnimFrame(this._animateAndClean, this, false);  
        }      
    },

    _animateAndClean: function() {
        timestamp = Date.now(); 
        var M = L.Marker.PowerMarker; 
        var cur = M.listHead, prev; 

        while(cur) {
            console.log(cur);
            if (cur.marker.state == M.STATE_ON) {
                cur.marker._update.call(cur.marker, timestamp - cur.marker._lastFrameTime, timestamp - cur.marker._onTime, timestamp); 
                cur.marker._lastFrameTime = timestamp; 
                console.log("Animate marker", cur.marker.options.name);
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
            console.log("cur next:", cur.next);
            cur = cur.next; 
            console.log("cur now:", cur);
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

    function PositionGenerator(points, durations) {
        console.log("points", points); 
        console.log("durations", durations); 

        var index = 0; 
        var totalTime = 0;
        var startPoint, endPoint, dur; 

        return function(elapsedTime, runTime, timestamp) {
            //console.log(this.getLatLng()); 

            while (runTime >= totalTime) {
                if (index < durations.length) {
                    startPoint = (index > 0) ? points[index - 1] : (p = this.getLatLng(), [p.lat, p.lng]); 
                    endPoint = points[index];
                    dur = durations[index];
                    totalTime += dur; 
                    index++; 
                } else {
                    this.off(); 
                    this.setLatLng(points[points.length - 1]); 
                    return; 
                }
            }
            //console.log("index", index); 
            console.log("totalTime", totalTime, "runTime", runTime); 
            //console.log("startPoint", startPoint); 
            //console.log("endPoint", endPoint); 
            var nextPoint = interpolate(startPoint, endPoint, dur - (totalTime - runTime), dur); 
            this.setLatLng(nextPoint); 
            
        }
    }

    return PositionGenerator(points, durations);
}



