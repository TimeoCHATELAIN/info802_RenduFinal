<script>
	import { onMount } from 'svelte';
	import { initMap } from '$lib/mapboxLoader.js';
	import CalculateurTrajet from '$lib/components/CalculateurTrajet.svelte';
	import RechercheBar from '$lib/components/ResercheBar.svelte';
	import { calculerItineraire, ajouterMarqueur, afficherItineraire } from '$lib/mapboxService.js';
	import '../styles/app.css';

	let mapContainer;
	let map;
	let marqueurDepart = null;
	let marqueurArrivee = null;
	let itineraireActuel = null;

	onMount(() => {
		map = initMap(mapContainer);

		return () => {
			map.remove();
		};
	});

	function handleDepartSelectionne(event) {
		const lieu = event.detail;
		
		// Supprimer l'ancien marqueur
		if (marqueurDepart) {
			marqueurDepart.remove();
		}
		
		// Ajouter nouveau marqueur
		marqueurDepart = ajouterMarqueur(map, lieu.coordinates, '#10b981');
		
		// Centrer la carte
		map.flyTo({
			center: lieu.coordinates,
			zoom: 13,
			duration: 1000
		});
	}

	function handleArriveeSelectionnee(event) {
		const lieu = event.detail;
		
		// Supprimer l'ancien marqueur
		if (marqueurArrivee) {
			marqueurArrivee.remove();
		}
		
		// Ajouter nouveau marqueur
		marqueurArrivee = ajouterMarqueur(map, lieu.coordinates, '#ef4444');
		
		// Centrer la carte
		map.flyTo({
			center: lieu.coordinates,
			zoom: 13,
			duration: 1000
		});
	}

	async function handleCalculerItineraire(event) {
		const { depart, arrivee } = event.detail;
		
		// Calculer l'itineraire
		itineraireActuel = await calculerItineraire(depart.coordinates, arrivee.coordinates);
		
		if (itineraireActuel.success) {
			// Afficher l'itineraire sur la carte
			afficherItineraire(map, itineraireActuel.geometrie);
			
			// Ajuster la vue pour montrer tout l'itineraire
			const bounds = new window.mapboxgl.LngLatBounds();
			bounds.extend(depart.coordinates);
			bounds.extend(arrivee.coordinates);
			
			map.fitBounds(bounds, {
				padding: 100,
				duration: 1000
			});
			
			console.log('Itineraire calcule:', itineraireActuel);
		}
	}
</script>

<svelte:head>
	<title>Vehicules Electriques - Calculateur de trajet</title>
</svelte:head>

<div class="map-container" bind:this={mapContainer}></div>

<div class="recherche-panel">
	<RechercheBar 
		on:departSelectionne={handleDepartSelectionne}
		on:arriveeSelectionnee={handleArriveeSelectionnee}
		on:calculerItineraire={handleCalculerItineraire}
	/>
	
	{#if itineraireActuel && itineraireActuel.success}
		<div class="itineraire-info">
			<h3>Informations du trajet</h3>
			<div class="info-item">
				<span class="label">Distance:</span>
				<span class="value">{itineraireActuel.distance} km</span>
			</div>
			<div class="info-item">
				<span class="label">Duree estimee:</span>
				<span class="value">{Math.floor(itineraireActuel.duree / 60)}h{itineraireActuel.duree % 60}min</span>
			</div>
		</div>
	{/if}
</div>

<CalculateurTrajet />
