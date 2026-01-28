
import logging
logging.basicConfig(level=logging.DEBUG)
from spyne import Application, rpc, ServiceBase, Integer, Unicode
from spyne import Iterable
from spyne.protocol.soap import Soap11
from spyne.protocol.json import JsonDocument
from spyne.server.wsgi import WsgiApplication
from spyne import Float
import math

class DistanceCalculator(ServiceBase):
    @rpc(Integer, Integer, Integer, Integer, _returns=Float)
    def calculate(ctx, distance, vitesse, autonomie, temps_chargement):
        # distance en km, vitesse en km/h, autonomie en km, temps_chargement en minutes
        if autonomie <= 0 or vitesse <= 0:
            return -1.0  # ou lever une exception selon le besoin
        nb_recharges = max(0, math.ceil(distance / autonomie) - 1)
        temps_trajet = distance / float(vitesse)  # temps trajet en heures
        temps_total = temps_trajet + nb_recharges * (temps_chargement / 60.0)  # conversion minutes -> heures
        return float(temps_total) # temps total en heures

application = Application([DistanceCalculator],
    tns='spyne.examples.hello',
    in_protocol=Soap11(validator='lxml'),
    out_protocol=Soap11()
)

wsgi_application = WsgiApplication(application)

from wsgiref.simple_server import make_server
server = make_server('127.0.0.1', 8000, wsgi_application)
server.serve_forever()