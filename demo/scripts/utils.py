#!/usr/bin/python
import requests
from polyline.codec import PolylineCodec

key_state = 0
def getPolylines(points, mode):
    baseUrl = "https://maps.googleapis.com/maps/api/directions/json"
    fullCall = baseUrl + "?origin=%s&destination=%s&waypoints=%s&key=%s&mode=%s"
    origin = points[0][0] + ',' + points[0][1]
    destination = points[-1][0] + ',' + points[-1][1]
    #key =
    keys = ["AIzaSyDL2VC7RL7sqek1eRoRO9tPFB8YJuShKLU", "AIzaSyDxROIMqdEWlKrmJ6wfWrWA6muRr6sSu7c", "AIzaSyDqLk1AvK98l-tEdQhX7vnKPR32LsfOLFk", "AIzaSyD8qhkp66UtPCIfk9fvn8rjAz4d2iGA2pE"]
    global key_state
    key = keys[key_state]
    key_state = (key_state + 1) % len(keys)
    waypoints = '|'.join(map(lambda p: p[0] + ',' + p[1], points[1:-1]))

    r = requests.get(fullCall % (origin, destination, waypoints, key, mode))
    js = r.json()
    try:
        legs = js['routes'][0]['legs'] #TODO: take the first route for now. Should use driving or walking?
        polylines = []
        for leg in legs:
            legStepPoints = [PolylineCodec().decode(s['polyline']['points']) for s in leg['steps']]
            legPolyline = PolylineCodec().encode([p for step in legStepPoints for p in step])
            polylines.append(legPolyline)
    except Exception as e:
        print e
        print js
        print "request:", origin, destination, waypoints
        return None

    return polylines
