var tiles = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});


var map = L.map('map', {
        zoomControl: true
    })
    .addLayer(tiles)
    .setView([37.780751, -122.427838], 14);

var bikeIcon = L.AwesomeMarkers.icon({
    icon: 'bicycle',
    prefix: 'fa',
    markerColor: 'orange',
    iconColor: 'white'
});

var stationIcon = L.AwesomeMarkers.icon({icon: 'glyphicon-log-out', prefix: 'glyphicon', markerColor: 'green', iconColor: 'white'});

var time; // animation time
var timestamp; // viz timestamp
var timeFactor = 8; // 4 minutes = 1 second in the demo
var markers = [];

function addZ(num) {
    return (num < 10) ? '0' + num : '' + num;
}

function updateTimer() {
    setTimeout(updateTimer, 1000 / timeFactor);
    var newTimeStamp = Date.now();
    var elapsedMinute = (newTimeStamp - timestamp) / 1000 * timeFactor; // minute passed in the animation

    timestamp = newTimeStamp;
    time = new Date(time.getTime() + elapsedMinute * 60000); // update the clock

    $('.date').text("Date: " + time.getUTCDate() + "-" + addZ(time.getUTCMonth() + 1) + "-" + time.getUTCFullYear());
    $('.time').text(time.getUTCHours() + ":" + addZ(time.getUTCMinutes()));

    while (markers.length > 0 && markers[markers.length - 1].startTime < time.toISOString()) {
        var m = markers.pop();
        m.addTo(map);
        m.start();
    }

}

$.get("stations.json", function(stations) {

    $.get("trips.json", function(data) {
        $.each(data, function(i, trip) {
            if (trip.path.length <= 1) return;

            var startPos = trip.path[0];
            var destinations = trip.path.slice(1);
            var duration = trip.dur * 1000 / (timeFactor * 60); // duration in millisecond

            var marker = L.Marker.powerMarker(startPos, {
                icon: bikeIcon
            }).addCallback(L.Marker.PowerMarker.movement(destinations, duration));
            marker.startTime = trip.sTime; // keep the information with marker
            markers.push(marker);
        });

        time = new Date(Date.parse('2015-08-30T07:00:00'));
        timestamp = Date.now();
        updateTimer();

    });

    // add stations to the map: 
    $.each(stations, function(i, station) {
        var sMarker = L.marker([station.lat, station.long], {icon: stationIcon, opacity: 0.8}).addTo(map); 
        sMarker.bindPopup("<b>Station: </b>" + station.name);   
    });
});

