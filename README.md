# Documentation - Calculateur de Trajet pour Vehicules Electriques

## Vue d'ensemble

Application web calculant le temps de trajet pour vehicules electriques en tenant compte des recharges necessaires. Architecture SOAP avec frontend Svelte et backend Python.

---

## Installation et Demarrage

### Installation

```bash
# Cloner le projet
git clone https://github.com/TimeoCHATELAIN/info802_RenduFinal.git
cd info802_RenduFinal

# Dependances JavaScript
npm install

# Environnement Python
cd soap
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install spyne lxml
```

### Demarrage

**Terminal 1 - Service SOAP:**
```bash
cd soap
source venv/bin/activate  # Windows: venv\Scripts\activate
python vehiculeService.py
```

**Terminal 2 - Application Web:**
```bash
npm run dev
```

Acces: http://localhost:5174

---

## Architecture

```
src/
├── lib/
│   ├── components/CalculateurTrajet.svelte    # Formulaire et resultats
│   ├── mapboxLoader.js                        # Configuration carte
│   └── soapClient.js                          # Client SOAP
├── routes/+page.svelte                        # Page principale
└── styles/app.css                             # Styles

soap/
└── vehiculeService.py                         # Service SOAP backend
```

---

## Fonctionnement

### Service SOAP

Methode `calculerTempsTrajet` avec parametres:
- distance (km), vitesse (km/h), autonomie (km), temps_chargement (minutes)

### Formule

```python
nb_recharges = max(0, ceil(distance / autonomie) - 1)
temps_total = (distance / vitesse) + nb_recharges * (temps_chargement / 60)
```

### Exemple

Trajet 400 km a 110 km/h, autonomie 350 km, recharge 30 min:
- Recharges: 1
- Temps conduite: 3.64h
- Temps recharge: 0.5h
- **Total: 4.14h**

---

## Technologies

- Python/Spyne: Service SOAP
- Svelte/Vite: Frontend
- Mapbox GL: Carte interactive