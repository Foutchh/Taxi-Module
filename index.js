const { saveChauffeurData } = require('./chauffeurOpslag');  // Importeer de functie voor het opslaan van chauffeurgegevens
const { uploadImage } = require('./afbeeldingUpload');  // Importeer de functie voor het uploaden van de afbeelding

// Stel de chauffeurgegevens in
const chauffeurData = {
  id: 'chauffeur123',  // Unieke ID voor de chauffeur
  naam: 'John Doe',
  telefoon: '+123456789',
  afbeeldingUrl: '',  // URL van de afbeelding (wordt later ingevuld na upload)
  // Voeg hier andere chauffeurgegevens toe
};

// Functie om chauffeur te registreren (inclusief afbeelding upload en gegevens opslaan)
async function registreerChauffeur(chauffeurData, imageFilePath) {
  // Afbeelding uploaden
  try {
    const imageUrl = await uploadImage(imageFilePath, chauffeurData.id);
    chauffeurData.afbeeldingUrl = imageUrl;  // Stel de afbeelding URL in

    // Gegevens opslaan in Firestore en lokaal bestand
    await saveChauffeurData(chauffeurData);
  } catch (error) {
    console.error('Fout bij het registreren van de chauffeur:', error);
  }
}

// Stel het bestandspad in voor de afbeelding die moet worden geüpload
const imageFilePath = '/path/to/image.jpg';  // Zorg ervoor dat je het juiste pad opgeeft naar je afbeelding

// Registreer de chauffeur
registreerChauffeur(chauffeurData, imageFilePath);
