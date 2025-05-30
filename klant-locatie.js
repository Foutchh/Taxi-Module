// ...functie voor ophalen van GPS en invullen in veld...
// Voorbeeld:
// document.getElementById('locate-btn').addEventListener('click', ...);
document.getElementById('locate-btn').addEventListener('click', function() {
  const errorDiv = document.getElementById('form-error');
  errorDiv.classList.remove('show');
  errorDiv.innerText = "";
  if (!navigator.geolocation) {
    errorDiv.innerText = "Geolocatie wordt niet ondersteund door deze browser.";
    errorDiv.classList.add('show');
    return;
  }
  document.getElementById('ophaal').value = "Locatie ophalen...";
  navigator.geolocation.getCurrentPosition(async function(pos) {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await resp.json();
      document.getElementById('ophaal').value = data.display_name || `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {
      document.getElementById('ophaal').value = `${pos.coords.latitude},${pos.coords.longitude}`;
    }
  }, function() {
    errorDiv.innerText = "Kon je locatie niet ophalen.";
    errorDiv.classList.add('show');
    document.getElementById('ophaal').value = "";
  });
});
