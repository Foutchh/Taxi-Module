const fs = require('fs');
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/your/serviceAccountKey.json');  // Voeg het pad naar je Firebase service account sleutelbestand toe

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-project-id.appspot.com'  // Vervang met je Firebase storage bucket ID
});

const db = admin.firestore();
const storage = admin.storage().bucket();

// Functie om chauffeurgegevens in zowel Firestore als lokaal bestand op te slaan
async function saveChauffeurData(chauffeurData) {
  try {
    // Gegevens naar Firestore opslaan
    const docRef = db.collection('chauffeurs').doc(chauffeurData.id);
    await docRef.set(chauffeurData);

    // Gegevens naar lokaal JSON bestand opslaan
    fs.readFile('./chauffeurs.json', (err, data) => {
      if (err) {
        console.error('Fout bij het lezen van het bestand:', err);
        return;
      }

      const chauffeurs = JSON.parse(data);
      chauffeurs.push(chauffeurData);
      fs.writeFile('./chauffeurs.json', JSON.stringify(chauffeurs, null, 2), (err) => {
        if (err) {
          console.error('Fout bij het schrijven van het bestand:', err);
        } else {
          console.log('Chauffeurgegevens succesvol opgeslagen in chauffeurs.json');
        }
      });
    });

    console.log('Chauffeurgegevens succesvol opgeslagen in Firestore');
  } catch (error) {
    console.error('Fout bij het opslaan van chauffeurgegevens:', error);
  }
}

module.exports = { saveChauffeurData };  // Exporteer de functie
