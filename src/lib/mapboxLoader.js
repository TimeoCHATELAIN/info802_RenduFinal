import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export function initMap(container, options = {}) {
    const {
        style = 'mapbox://styles/mapbox/standard',
        projection = 'globe',
        zoom = 5.75,
        center = [2.3, 46.6],
        scrollZoom = true
    } = options;

    const map = new mapboxgl.Map({
        container,
        style,
        projection,
        zoom,
        center,
    });

    map.addControl(new mapboxgl.NavigationControl());
    
    if (!scrollZoom) {
        map.scrollZoom.disable();
    }

    map.on('style.load', () => {
        map.setFog({});
    });

    return map;
}