import logging
logging.basicConfig(level=logging.INFO)
from spyne import Application, rpc, ServiceBase, Integer, Unicode, Float
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
import math

# Middleware CORS pour permettre les requêtes cross-origin
class CORSMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        def custom_start_response(status, headers, exc_info=None):
            # Ajout des headers CORS
            headers.append(('Access-Control-Allow-Origin', '*'))
            headers.append(('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'))
            headers.append(('Access-Control-Allow-Headers', 'Content-Type, SOAPAction'))
            headers.append(('Access-Control-Max-Age', '86400'))
            return start_response(status, headers, exc_info)

        # Gestion des requêtes OPTIONS (preflight)
        if environ['REQUEST_METHOD'] == 'OPTIONS':
            custom_start_response('200 OK', [('Content-Type', 'text/plain')])
            return [b'']

        return self.app(environ, custom_start_response)


class VehiculeElectriqueService(ServiceBase):
    """
    Service SOAP pour calculer le temps de trajet d'un véhicule électrique.
    
    Paramètres:
    - distance: distance totale du trajet en km
    - vitesse: vitesse moyenne en km/h
    - autonomie: autonomie du véhicule en km (distance parcourable avec une charge)
    - temps_chargement: temps nécessaire pour une recharge complète en minutes
    
    Retourne: le temps total du trajet en heures (incluant le temps de conduite et les recharges)
    """
    
    @rpc(Float, Float, Float, Float, _returns=Float)
    def calculerTempsTrajet(ctx, distance, vitesse, autonomie, temps_chargement):
        """
        Calcule le temps total de trajet en tenant compte des recharges nécessaires.
        
        Logique de calcul:
        1. Calcul du nombre de recharges nécessaires
        2. Calcul du temps de conduite pur
        3. Ajout du temps de recharge total
        """
        
        # Validation des entrées
        if distance <= 0 or vitesse <= 0 or autonomie <= 0 or temps_chargement < 0:
            logging.error(f"Paramètres invalides: distance={distance}, vitesse={vitesse}, autonomie={autonomie}, temps_chargement={temps_chargement}")
            return -1.0
        
        # Calcul du nombre de recharges
        # On soustrait 1 car on part avec une charge complète
        nb_recharges = max(0, math.ceil(distance / autonomie) - 1)
        
        # Temps de conduite pur (en heures)
        temps_conduite = distance / vitesse
        
        # Temps de recharge total (conversion minutes -> heures)
        temps_recharge_total = nb_recharges * (temps_chargement / 60.0)
        
        # Temps total
        temps_total = temps_conduite + temps_recharge_total
        
        logging.info(f"Calcul: distance={distance}km, vitesse={vitesse}km/h, autonomie={autonomie}km")
        logging.info(f"Résultat: {nb_recharges} recharge(s), temps total={temps_total:.2f}h")
        
        return float(temps_total)
    
    @rpc(Float, Float, Float, Float, _returns=Unicode)
    def calculerTempsTrajetDetaillee(ctx, distance, vitesse, autonomie, temps_chargement):
        """
        Version détaillée qui retourne un résumé en texte.
        """
        
        if distance <= 0 or vitesse <= 0 or autonomie <= 0 or temps_chargement < 0:
            return "Erreur: Paramètres invalides"
        
        nb_recharges = max(0, math.ceil(distance / autonomie) - 1)
        temps_conduite = distance / vitesse
        temps_recharge_total = nb_recharges * (temps_chargement / 60.0)
        temps_total = temps_conduite + temps_recharge_total
        
        heures = int(temps_total)
        minutes = int((temps_total - heures) * 60)
        
        resultat = f"Trajet de {distance}km à {vitesse}km/h avec une autonomie de {autonomie}km:\n"
        resultat += f"- Temps de conduite: {temps_conduite:.2f}h\n"
        resultat += f"- Nombre de recharges: {nb_recharges}\n"
        resultat += f"- Temps de recharge total: {temps_recharge_total:.2f}h\n"
        resultat += f"- Temps total: {heures}h{minutes}min"
        
        return resultat


# Configuration de l'application SOAP
application = Application(
    [VehiculeElectriqueService],
    tns='vehicule.electrique.soap',
    in_protocol=Soap11(validator='lxml'),
    out_protocol=Soap11()
)

# Application WSGI avec middleware CORS
wsgi_application = CORSMiddleware(WsgiApplication(application))

# Démarrage du serveur
if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    
    HOST = '127.0.0.1'
    PORT = 8000
    
    server = make_server(HOST, PORT, wsgi_application)
    
    print(f"Service SOAP Vehicules Electriques demarre sur http://{HOST}:{PORT}")
    print(f"WSDL disponible sur: http://{HOST}:{PORT}/?wsdl")
    print("Appuyez sur Ctrl+C pour arreter le serveur\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServeur arrete")
