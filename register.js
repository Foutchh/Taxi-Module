// register.js
import { auth, createUserWithEmailAndPassword } from './firebase-config.js';

const registerForm = document.getElementById('register-form');
const errorMessage = document.getElementById('error-message');

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert("Registratie succesvol!");
      console.log(user);
      // Hier kun je de gebruiker doorsturen naar de dashboardpagina of andere pagina
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessageText = error.message;
      errorMessage.textContent = `Fout: ${errorMessageText}`;
      console.error('Registratiefout:', errorCode, errorMessageText);
    });
});
