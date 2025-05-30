window.toonKaart = function(ophaalLoc, afzetLoc, geometry) {
  // Verwijder bestaande kaart-instantie als die er is (Leaflet v1.9+)
  if (window._kaartLeafletInstance) {
    window._kaartLeafletInstance.remove();
    window._kaartLeafletInstance = null;
  }
  // Vervang de kaartdiv om "Map container is already initialized" te voorkomen
  var kaartDiv = document.getElementById('kaart');
  if (kaartDiv) {
    var parent = kaartDiv.parentNode;
    var newDiv = document.createElement('div');
    newDiv.id = 'kaart';
    newDiv.style.height = kaartDiv.style.height;
    newDiv.style.minHeight = kaartDiv.style.minHeight;
    newDiv.style.minWidth = kaartDiv.style.minWidth;
    parent.replaceChild(newDiv, kaartDiv);
    kaartDiv = newDiv;
  }

  setTimeout(function() {
    const kaart = L.map('kaart', { zoomControl: true }).setView([ophaalLoc.lat, ophaalLoc.lng], 13);
    window._kaartLeafletInstance = kaart;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(kaart);

    // Ophaalpunt marker
    L.marker([ophaalLoc.lat, ophaalLoc.lng], {icon: L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })}).addTo(kaart).bindPopup('Ophaalpunt').openPopup();

    // Afzetpunt marker
    L.marker([afzetLoc.lat, afzetLoc.lng], {icon: L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })}).addTo(kaart).bindPopup('Afzetpunt');

    // Route lijn tekenen (OpenRouteService v2: geometry is een encoded polyline!)
    if (geometry && typeof geometry === "string") {
      // Decodeer polyline naar LatLngs
      const coords = decodeORSLine(geometry);
      if (coords.length > 1) {
        L.polyline(coords, {color: '#2563eb', weight: 5, opacity: 0.85}).addTo(kaart);
        kaart.fitBounds(coords, {padding: [30, 30]});
      }
    } else if (geometry && geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
      // GeoJSON LineString
      const coords = geometry.coordinates.map(c => [c[1], c[0]]);
      L.polyline(coords, {color: '#2563eb', weight: 5, opacity: 0.85}).addTo(kaart);
      kaart.fitBounds(coords, {padding: [30, 30]});
    } else {
      // Fallback: zoom op markers
      kaart.fitBounds([
        [ophaalLoc.lat, ophaalLoc.lng],
        [afzetLoc.lat, afzetLoc.lng]
      ], {padding: [30, 30]});
    }
  }, 100);
};

// Nieuwe functie voor kaart met tussenstops
window.toonKaartMetTussenstops = function(punten, geometry) {
  // Verwijder bestaande kaart-instantie als die er is (Leaflet v1.9+)
  if (window._kaartLeafletInstance) {
    window._kaartLeafletInstance.remove();
    window._kaartLeafletInstance = null;
  }
  // Vervang de kaartdiv om "Map container is already initialized" te voorkomen
  var kaartDiv = document.getElementById('kaart');
  if (kaartDiv) {
    var parent = kaartDiv.parentNode;
    var newDiv = document.createElement('div');
    newDiv.id = 'kaart';
    newDiv.style.height = kaartDiv.style.height;
    newDiv.style.minHeight = kaartDiv.style.minHeight;
    newDiv.style.minWidth = kaartDiv.style.minWidth;
    parent.replaceChild(newDiv, kaartDiv);
    kaartDiv = newDiv;
  }

  setTimeout(function() {
    const kaart = L.map('kaart', { zoomControl: true }).setView([punten[0].lat, punten[0].lng], 13);
    window._kaartLeafletInstance = kaart;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(kaart);

    // Markers: ophaal (groen), tussenstops (blauw), afzet (rood)
    if (punten.length > 0) {
      L.marker([punten[0].lat, punten[0].lng], {icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })}).addTo(kaart).bindPopup('Ophaalpunt').openPopup();
    }
    for (let i = 1; i < punten.length - 1; i++) {
      L.marker([punten[i].lat, punten[i].lng], {icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/3177/3177361.png",
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      })}).addTo(kaart).bindPopup('Tussenstop ' + i);
    }
    if (punten.length > 1) {
      L.marker([punten[punten.length-1].lat, punten[punten.length-1].lng], {icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })}).addTo(kaart).bindPopup('Afzetpunt');
    }

    // Route lijn tekenen (OpenRouteService v2: geometry is een encoded polyline!)
    if (geometry && typeof geometry === "string") {
      const coords = decodeORSLine(geometry);
      if (coords.length > 1) {
        L.polyline(coords, {color: '#2563eb', weight: 5, opacity: 0.85}).addTo(kaart);
        kaart.fitBounds(coords, {padding: [30, 30]});
      }
    } else if (geometry && geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
      const coords = geometry.coordinates.map(c => [c[1], c[0]]);
      L.polyline(coords, {color: '#2563eb', weight: 5, opacity: 0.85}).addTo(kaart);
      kaart.fitBounds(coords, {padding: [30, 30]});
    } else {
      // Fallback: zoom op markers
      kaart.fitBounds(punten.map(p => [p.lat, p.lng]), {padding: [30, 30]});
    }
  }, 100);
};

// Polyline decode voor OpenRouteService (Google polyline algoritme)
function decodeORSLine(str, precision) {
  precision = precision || 5;
  var index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change,
    factor = Math.pow(10, precision);

  while (index < str.length) {
    byte = null;
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += latitude_change;

    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += longitude_change;

    coordinates.push([lat / factor, lng / factor]);
  }
  // [lat, lng] => [lat, lng]
  return coordinates;
}
