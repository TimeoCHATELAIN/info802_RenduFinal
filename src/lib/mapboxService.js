/**
 * Service pour interagir avec l'API Mapbox Geocoding et Directions
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const GEOCODING_URL = import.meta.env.VITE_MAPBOX_GEOCODING_URL;
const DIRECTIONS_URL = import.meta.env.VITE_MAPBOX_DIRECTIONS_URL;

/**
 * Recherche une adresse avec l'API Geocoding de Mapbox
 * @param {string} query - Texte de recherche
 * @returns {Promise<Array>} - Liste de suggestions
 */
export async function rechercherAdresse(query) {
    if (!query || query.length < 3) {
        return [];
    }

    try {
        const url = `${GEOCODING_URL}/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=FR&language=fr&limit=5`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();
        
        return data.features.map(feature => ({
            id: feature.id,
            nom: feature.place_name,
            coordinates: feature.geometry.coordinates, // [longitude, latitude]
            type: feature.place_type[0],
            context: feature.context
        }));
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        return [];
    }
}

/**
 * Calcule un itineraire entre deux points
 * @param {Array} depart - Coordonnees de depart [lng, lat]
 * @param {Array} arrivee - Coordonnees d'arrivee [lng, lat]
 * @returns {Promise<Object>} - Details de l'itineraire
 */
export async function calculerItineraire(depart, arrivee) {
    try {
        const coordinates = `${depart[0]},${depart[1]};${arrivee[0]},${arrivee[1]}`;
        const url = `${DIRECTIONS_URL}/${coordinates}.json?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&steps=true`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.routes || data.routes.length === 0) {
            throw new Error('Aucun itineraire trouve');
        }

        const route = data.routes[0];
        
        return {
            success: true,
            distance: (route.distance / 1000).toFixed(2), // Conversion en km
            duree: Math.round(route.duration / 60), // Conversion en minutes
            geometrie: route.geometry,
            etapes: route.legs[0].steps.map(step => ({
                instruction: step.maneuver.instruction,
                distance: (step.distance / 1000).toFixed(2)
            }))
        };
    } catch (error) {
        console.error('Erreur lors du calcul de l\'itineraire:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Ajoute un marqueur sur la carte
 * @param {Object} map - Instance Mapbox
 * @param {Array} coordinates - [lng, lat]
 * @param {string} color - Couleur du marqueur
 * @returns {Object} - Instance du marqueur
 */
export function ajouterMarqueur(map, coordinates, color = '#3b82f6') {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundColor = color;
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

    const marker = new window.mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .addTo(map);

    return marker;
}

/**
 * Affiche un itineraire sur la carte
 * @param {Object} map - Instance Mapbox
 * @param {Object} geometrie - Geometrie GeoJSON de l'itineraire
 */
export function afficherItineraire(map, geometrie) {
    // Supprimer l'ancien itineraire s'il existe
    if (map.getLayer('route')) {
        map.removeLayer('route');
    }
    if (map.getSource('route')) {
        map.removeSource('route');
    }

    // Ajouter le nouvel itineraire
    map.addSource('route', {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: geometrie
        }
    });

    map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.75
        }
    });
}
