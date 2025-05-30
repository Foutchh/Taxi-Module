const loginForm = document.getElementById('login');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();  // Voorkom dat het formulier wordt verzonden

    const naam = document.getElementById('naam').value;
    const wachtwoord = document.getElementById('wachtwoord').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ naam, wachtwoord })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Inloggen gelukt!', data.message);
            window.location.href = '/dashboard'; // Redirect naar dashboard
        } else {
            errorMessage.textContent = data.message; // Toon foutmelding
        }
    } catch (error) {
        console.error('Er is iets misgegaan bij het inloggen:', error);
        errorMessage.textContent = 'Er is iets misgegaan. Probeer het later opnieuw.';
    }
});
