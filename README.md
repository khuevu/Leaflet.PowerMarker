# Leaflet.PowerMarker plugin

A leaflet plugin to animate markers. 

The plugin is designed as a framework for highly concurrent animation of
markers on a map. For all of the animated markers, the update callbacks to update their visual are stacked into a single `requestAnimFrame` instead of multiple calls. Using single `requestAnimFrame` improves performance over multiple `requestAnimFrame` for large number of calls (The referenced benchmark can be found [here](http://jsperf.com/single-vs-multiple-requestanimationframe/2) ) 

Besides a built-in implementation of marker movment callback to move marker
between geo points, custom callback can be easily built to facilitate different
type of animation for markers (e.g update icons, labels...)

## Demo

[Visualization of Bay Area Bike Sharing
Trips with Leaflet.PowerMarker](http://khuevu.github.io/Leaflet.PowerMarker/)

## API

`PowerMarker` extends `Leaflet.Marker` therefore all functionalities of
`Leaflet.Marker` exists with `PowerMarker`. It can also be used in conjunction
with other Marker plugin for Leaflet. For example
[Leaflet.awesome-markers](https://github.com/lvoogdt/Leaflet.awesome-markers)
and [Leaflet.label](https://github.com/Leaflet/Leaflet.label).

### Create PowerMarker

    var marker = L.Marker.powerMarker( <LatLng> latlng, <Marker_options> options? ).addTo(map); 
   
`PowerMarker` is created just like normal `Leaflet.Marker`

### Add animation callbacks

    marker.addCallback( <Function> callback )

The callback function is passed two arguments: 
    
 * `elapsed`: the time in millisecond that has elapsed between animation frames. It is useful to know how much time has passed between frames in order to calculate exactly the new state of the marker. 
 * `timestamp`: the timestamp when the frame starts. Thus all callbacks function
   will have the same timestamp.  

### Start and stop animation

    marker.start(); 
    ...
    marker.stop(); 

Added callbacks for the marker will be invoked continously when the browser
paints new frame for the page until `stop()` is called. 

## Movement function

    var mov = L.Marker.PowerMarker.movement( <LatLng[]> destinations,
    <Number[]> durations )

The `L.Marker.PowerMarker.movement` function takes two array arguments: the
list of destinations and the respective durations in millisecond. The returned
object is a function which takes two arguments `elapsed` and `timestamp`. When the
marker starts, it will move to these destinations in order. The marker
automatically stops when it finishes the path:

    marker.addCallback( mov );
    marker.start();


    





