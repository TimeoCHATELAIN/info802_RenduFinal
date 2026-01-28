/**
 * Client SOAP pour communiquer avec le service de véhicules électriques
 * 
 * Ce module permet d'appeler le service SOAP Python depuis l'application Svelte
 */

const SOAP_ENDPOINT = 'http://127.0.0.1:8000';

/**
 * Crée une requête SOAP XML pour calculer le temps de trajet
 * 
 * @param {number} distance - Distance du trajet en km
 * @param {number} vitesse - Vitesse moyenne en km/h
 * @param {number} autonomie - Autonomie du véhicule en km
 * @param {number} tempsChargement - Temps de recharge en minutes
 * @returns {string} - Enveloppe SOAP XML
 */
function createSoapRequest(distance, vitesse, autonomie, tempsChargement) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope 
    xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
    xmlns:tns="vehicule.electrique.soap">
    <soap:Body>
        <tns:calculerTempsTrajet>
            <tns:distance>${distance}</tns:distance>
            <tns:vitesse>${vitesse}</tns:vitesse>
            <tns:autonomie>${autonomie}</tns:autonomie>
            <tns:temps_chargement>${tempsChargement}</tns:temps_chargement>
        </tns:calculerTempsTrajet>
    </soap:Body>
</soap:Envelope>`;
}

/**
 * Parse la réponse SOAP XML pour extraire le temps total
 * 
 * @param {string} xmlText - Réponse SOAP en XML
 * @returns {number} - Temps total du trajet en heures
 */
function parseSoapResponse(xmlText) {
    console.log('Réponse SOAP reçue:', xmlText); // Debug
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Vérifier s'il y a une erreur SOAP
    const fault = xmlDoc.getElementsByTagName("Fault")[0] || 
                xmlDoc.getElementsByTagNameNS("*", "Fault")[0];
    if (fault) {
        const faultString = fault.getElementsByTagName("faultstring")[0] || 
                        fault.getElementsByTagNameNS("*", "faultstring")[0];
        throw new Error(faultString ? faultString.textContent : "Erreur SOAP");
    }
    
    // Recherche de la balise contenant le résultat (plusieurs variantes possibles)
    let result = xmlDoc.getElementsByTagName("calculerTempsTrajetResult")[0];
    
    if (!result) {
        // Essai avec namespace
        result = xmlDoc.getElementsByTagNameNS("*", "calculerTempsTrajetResult")[0];
    }
    
    if (!result) {
        // Essai avec Response
        result = xmlDoc.getElementsByTagName("calculerTempsTrajetResponse")[0];
        if (result) {
            result = result.getElementsByTagName("calculerTempsTrajetResult")[0];
        }
    }
    
    if (!result) {
        // Dernière tentative : chercher tous les éléments float
        const floats = xmlDoc.getElementsByTagName("float");
        if (floats.length > 0) {
            result = floats[0];
        }
    }
    
    if (result) {
        const value = parseFloat(result.textContent);
        console.log('Valeur extraite:', value); // Debug
        return value;
    }
    
    console.error('Structure XML:', xmlDoc.documentElement); // Debug
    throw new Error("Impossible de parser la réponse SOAP");
}

/**
 * Calcule le temps de trajet en appelant le service SOAP
 * 
 * @param {Object} params - Paramètres du calcul
 * @param {number} params.distance - Distance en km
 * @param {number} params.vitesse - Vitesse en km/h
 * @param {number} params.autonomie - Autonomie en km
 * @param {number} params.tempsChargement - Temps de recharge en minutes
 * @returns {Promise<Object>} - Résultat du calcul avec détails
 */
export async function calculerTempsTrajet({ distance, vitesse, autonomie, tempsChargement }) {
    try {
        // Validation des paramètres
        if (distance <= 0 || vitesse <= 0 || autonomie <= 0 || tempsChargement < 0) {
            throw new Error("Paramètres invalides");
        }

        // Création de la requête SOAP
        const soapRequest = createSoapRequest(distance, vitesse, autonomie, tempsChargement);
        
        // Envoi de la requête au serveur SOAP
        const response = await fetch(SOAP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'calculerTempsTrajet'
            },
            body: soapRequest
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        // Parse de la réponse
        const xmlText = await response.text();
        const tempsTotal = parseSoapResponse(xmlText);

        // Calcul des détails pour l'affichage
        const nbRecharges = Math.max(0, Math.ceil(distance / autonomie) - 1);
        const tempsConduite = distance / vitesse;
        const tempsRecharge = nbRecharges * (tempsChargement / 60);

        return {
            success: true,
            tempsTotal,
            details: {
                tempsConduite: tempsConduite.toFixed(2),
                nbRecharges,
                tempsRecharge: tempsRecharge.toFixed(2),
                heures: Math.floor(tempsTotal),
                minutes: Math.round((tempsTotal - Math.floor(tempsTotal)) * 60)
            }
        };

    } catch (error) {
        console.error("Erreur lors de l'appel SOAP:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Vérifie si le service SOAP est disponible
 * 
 * @returns {Promise<boolean>} - true si le service est disponible
 */
export async function verifierServiceSOAP() {
    try {
        const response = await fetch(`${SOAP_ENDPOINT}/?wsdl`);
        return response.ok;
    } catch {
        return false;
    }
}
