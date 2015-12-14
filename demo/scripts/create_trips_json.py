#!/usr/bin/python
import csv
import datetime
import utils
import json
from polyline.codec import PolylineCodec

def to_datetime(ts):
    return datetime.datetime.strptime(ts, "%m/%d/%Y %H:%M")

class Trip: 
    def __init__(self, data):
        self.tripId = data['Trip ID']
        self.dur = data['Duration']
        self.sStation = int(data['Start Terminal'])
        self.eStation = int(data['End Terminal'])
        self.sTime = to_datetime(data['Start Date']).isoformat()
        self.eTime = to_datetime(data['End Date']).isoformat()
        self.bikeId = int(data['Bike #'])
        self.path = None

class Station: 
    def __init__(self, data):
        self.id = int(data['station_id'])
        self.name = data['name']
        self.lat = data['lat']
        self.long = data['long']


def get_trips(): 
    with open('20150830_trip_data.csv', 'rb') as inputFile: 
        csvReader = csv.DictReader(inputFile)
        for row in csvReader:
            yield Trip(row)

def get_stations():
    stations = dict()
    with open('201508_station_data.csv', 'rb') as inputFile:
        csvReader = csv.DictReader(inputFile)
        for row in csvReader:
            stat = Station(row)
            stations[stat.id] = stat
    return stations

def get_trip_encoded_polylines(trips):
    with open('trips_route.txt', 'w') as outputFile:
        for t in trips:
            startStation = allStations[t.sStation]
            endStation = allStations[t.eStation]
            polylines = utils.getPolylines([[startStation.lat, startStation.long], [endStation.lat, endStation.long]], 'bicycling')
            t.polyline = polylines[0]
            t.path = PolylineCodec().decode(t.polyline)
            entry = "%d -  %s\n" % (t.tripId, t.polyline)
            outputFile.write(entry)
   
def get_paths():
    paths = dict()
    with open('trips_route.txt', 'rb') as inputFile:
        for line in inputFile.readlines():
            (tripId, path) = (d.strip() for d in line.split('-'))
            paths[tripId] = path
    return paths


trips = [t for t in get_trips()]
allStations = get_stations()
paths = get_paths()
for t in trips: 
    if t.tripId in paths:
        t.path = PolylineCodec().decode(paths[t.tripId])


START_TIME = '06:00:00' # only animate trips from 7 a.m
with open('../trips.json', 'w') as output:
    json.dump([t.__dict__ for t in trips if t.path and t.sTime.split("T")[1] > START_TIME], output)
