<script>
	import { onMount } from 'svelte';
	import { calculerTempsTrajet, verifierServiceSOAP } from '$lib/soapClient.js';

	let serviceDisponible = false;
	let calculEnCours = false;
	let resultat = null;
	let erreur = null;

	// Paramètres du formulaire
	let distance = 400;
	let vitesse = 110;
	let autonomie = 350;
	let tempsChargement = 30;

	onMount(async () => {
		// Vérification du service SOAP
		serviceDisponible = await verifierServiceSOAP();
	});

	async function handleCalculer() {
		calculEnCours = true;
		erreur = null;
		resultat = null;

		const result = await calculerTempsTrajet({
			distance: parseFloat(distance),
			vitesse: parseFloat(vitesse),
			autonomie: parseFloat(autonomie),
			tempsChargement: parseFloat(tempsChargement)
		});

		if (result.success) {
			resultat = result;
		} else {
			erreur = result.error;
		}

		calculEnCours = false;
	}
</script>

<div class="panel">
	<div class="panel-header">
		<h1>Calculateur de Trajet</h1>
		<p class="subtitle">Vehicules Electriques</p>
		
		{#if !serviceDisponible}
			<div class="alert alert-warning">
				Service SOAP non disponible. Assurez-vous que le serveur Python est demarre.
			</div>
		{/if}
	</div>

	<form on:submit|preventDefault={handleCalculer} class="form">
		<div class="form-group">
			<label for="distance">
				Distance (km)
			</label>
			<input 
				type="number" 
				id="distance" 
				bind:value={distance} 
				min="1" 
				step="1"
				required
			/>
		</div>

		<div class="form-group">
			<label for="vitesse">
				Vitesse moyenne (km/h)
			</label>
			<input 
				type="number" 
				id="vitesse" 
				bind:value={vitesse} 
				min="1" 
				step="1"
				required
			/>
		</div>

		<div class="form-group">
			<label for="autonomie">
				Autonomie du vehicule (km)
			</label>
			<input 
				type="number" 
				id="autonomie" 
				bind:value={autonomie} 
				min="1" 
				step="1"
				required
			/>
		</div>

		<div class="form-group">
			<label for="tempsChargement">
				Temps de recharge (minutes)
			</label>
			<input 
				type="number" 
				id="tempsChargement" 
				bind:value={tempsChargement} 
				min="0" 
				step="1"
				required
			/>
		</div>

		<button 
			type="submit" 
			class="btn-calculer"
			disabled={calculEnCours || !serviceDisponible}
		>
			{#if calculEnCours}
				Calcul en cours...
			{:else}
				Calculer le temps de trajet
			{/if}
		</button>
	</form>

	{#if erreur}
		<div class="alert alert-error">
			Erreur: {erreur}
		</div>
	{/if}

	{#if resultat}
		<div class="resultat">
			<h2>Resultat</h2>
			
			<div class="resultat-principal">
				<div class="temps-total">
					<span class="label">Temps total estimé</span>
					<span class="valeur">
						{resultat.details.heures}h {resultat.details.minutes}min
					</span>
				</div>
			</div>

			<div class="details-grid">
				<div class="detail-card">
					<span class="detail-label">Temps de conduite</span>
					<span class="detail-valeur">{resultat.details.tempsConduite}h</span>
				</div>

				<div class="detail-card">
					<span class="detail-label">Nombre de recharges</span>
					<span class="detail-valeur">{resultat.details.nbRecharges}</span>
				</div>

				<div class="detail-card">
					<span class="detail-label">Temps de recharge</span>
					<span class="detail-valeur">{resultat.details.tempsRecharge}h</span>
				</div>
			</div>
		</div>
	{/if}
</div>
