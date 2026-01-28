from zeep import Client

# Remplacez l'URL ci-dessous par l'URL réelle du WSDL généré par votre service SOAP
wsdl_url = 'http://127.0.0.1:8000/?wsdl'

client = Client(wsdl=wsdl_url)

# Exemple d'appel à la méthode 'calculate' du service
# distance = 500, vitesse = 100, autonomie = 200, temps_chargement = 30
result = client.service.calculate(500, 100, 200, 30)
print(f"Temps total de trajet (en heures) : {result}")
