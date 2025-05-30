// Import Cloudinary
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import fs from 'fs';

// Configureren van Cloudinary met jouw API-sleutels
cloudinary.config({ 
  cloud_name: 'db48g9zis', 
  api_key: '896781555618925', 
  api_secret: 'Cl3zUh6ToOfJ8AFNCCnDIwqfwVg'
});

// Functie om een afbeelding naar Cloudinary te uploaden
async function uploadImage(imageUrl) {
  try {
    // Upload afbeelding naar Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      public_id: 'chauffeurs/afbeelding'  // Specificeer de naam van de afbeelding op Cloudinary
    });

    console.log('Upload Result:', uploadResult);

    // URL voor het ophalen van de afbeelding (geoptimaliseerd voor web)
    const imageUrlOptimized = cloudinary.url('chauffeurs/afbeelding', {
      fetch_format: 'auto',
      quality: 'auto'
    });

    console.log('Optimized Image URL:', imageUrlOptimized);

  } catch (error) {
    console.error('Error uploading image:', error);
  }
}

// Voorbeeld URL van een afbeelding die je wil uploaden
const imageUrl = 'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg';  // Verander dit naar je eigen afbeelding

uploadImage(imageUrl);
