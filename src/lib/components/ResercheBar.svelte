<script>
	import { rechercherAdresse } from '$lib/mapboxService.js';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let departQuery = '';
	let arriveeQuery = '';
	let suggestionsDepart = [];
	let suggestionsArrivee = [];
	let departSelectionne = null;
	let arriveeSelectionnee = null;
	let showDepartSuggestions = false;
	let showArriveeSuggestions = false;

	let debounceTimer;

	async function handleDepartInput() {
		clearTimeout(debounceTimer);
		showDepartSuggestions = true;

		if (departQuery.length < 3) {
			suggestionsDepart = [];
			return;
		}

		debounceTimer = setTimeout(async () => {
			suggestionsDepart = await rechercherAdresse(departQuery);
		}, 300);
	}

	async function handleArriveeInput() {
		clearTimeout(debounceTimer);
		showArriveeSuggestions = true;

		if (arriveeQuery.length < 3) {
			suggestionsArrivee = [];
			return;
		}

		debounceTimer = setTimeout(async () => {
			suggestionsArrivee = await rechercherAdresse(arriveeQuery);
		}, 300);
	}

	function selectionnerDepart(suggestion) {
		departQuery = suggestion.nom;
		departSelectionne = suggestion;
		suggestionsDepart = [];
		showDepartSuggestions = false;
		dispatch('departSelectionne', suggestion);
	}

	function selectionnerArrivee(suggestion) {
		arriveeQuery = suggestion.nom;
		arriveeSelectionnee = suggestion;
		suggestionsArrivee = [];
		showArriveeSuggestions = false;
		dispatch('arriveeSelectionnee', suggestion);
	}

	function calculerTrajet() {
		if (departSelectionne && arriveeSelectionnee) {
			dispatch('calculerItineraire', {
				depart: departSelectionne,
				arrivee: arriveeSelectionnee
			});
		}
	}

	function inverserPoints() {
		const tempQuery = departQuery;
		const tempSelection = departSelectionne;
		
		departQuery = arriveeQuery;
		departSelectionne = arriveeSelectionnee;
		
		arriveeQuery = tempQuery;
		arriveeSelectionnee = tempSelection;

		if (departSelectionne && arriveeSelectionnee) {
			dispatch('calculerItineraire', {
				depart: departSelectionne,
				arrivee: arriveeSelectionnee
			});
		}
	}
</script>

<div class="recherche-container">
	<div class="recherche-group">
		<label for="depart">Point de depart</label>
		<input
			type="text"
			id="depart"
			bind:value={departQuery}
			on:input={handleDepartInput}
			on:focus={() => showDepartSuggestions = true}
			placeholder="Rechercher une adresse..."
			autocomplete="off"
		/>
		
		{#if showDepartSuggestions && suggestionsDepart.length > 0}
			<ul class="suggestions">
				{#each suggestionsDepart as suggestion}
					<li on:click={() => selectionnerDepart(suggestion)}>
						<span class="suggestion-nom">{suggestion.nom}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<button class="btn-inverser" on:click={inverserPoints} type="button" title="Inverser">
		⇅
	</button>

	<div class="recherche-group">
		<label for="arrivee">Point d'arrivee</label>
		<input
			type="text"
			id="arrivee"
			bind:value={arriveeQuery}
			on:input={handleArriveeInput}
			on:focus={() => showArriveeSuggestions = true}
			placeholder="Rechercher une adresse..."
			autocomplete="off"
		/>
		
		{#if showArriveeSuggestions && suggestionsArrivee.length > 0}
			<ul class="suggestions">
				{#each suggestionsArrivee as suggestion}
					<li on:click={() => selectionnerArrivee(suggestion)}>
						<span class="suggestion-nom">{suggestion.nom}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<button 
		class="btn-calculer-itineraire" 
		on:click={calculerTrajet}
		disabled={!departSelectionne || !arriveeSelectionnee}
	>
		Calculer l'itineraire
	</button>
</div>

<style>
	.recherche-container {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.recherche-group {
		position: relative;
	}

	.recherche-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 13px;
		font-weight: 600;
		color: #374151;
	}

	.recherche-group input {
		width: 100%;
		padding: 10px 12px;
		border: 2px solid #e5e7eb;
		border-radius: 6px;
		font-size: 14px;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.recherche-group input:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		margin-top: 4px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 1000;
		list-style: none;
		padding: 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.suggestions li {
		padding: 10px 12px;
		cursor: pointer;
		transition: background 0.15s;
		border-bottom: 1px solid #f3f4f6;
	}

	.suggestions li:last-child {
		border-bottom: none;
	}

	.suggestions li:hover {
		background: #f9fafb;
	}

	.suggestion-nom {
		font-size: 14px;
		color: #1f2937;
	}

	.btn-inverser {
		align-self: center;
		width: 36px;
		height: 36px;
		background: #f3f4f6;
		border: none;
		border-radius: 50%;
		font-size: 18px;
		cursor: pointer;
		transition: all 0.2s;
		color: #6b7280;
	}

	.btn-inverser:hover {
		background: #e5e7eb;
		transform: rotate(180deg);
	}

	.btn-calculer-itineraire {
		width: 100%;
		padding: 12px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-calculer-itineraire:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-calculer-itineraire:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}
</style>
