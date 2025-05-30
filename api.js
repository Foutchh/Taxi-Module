const OPENROUTES_API_KEY = "5b3ce3597851110001cf6248b59dc263cab24bdabda48748cd9122b3";
const WEATHER_API_KEY = "9d1afafb80f94518850212856252004";
const TOMTOM_API_KEY = "fLy6nvAxRi3ACx2G69Q9fHabDwHz80fe";

// Geocode adres naar lat/lng via Nominatim
async function geocodeAdres(adres) {
  // Gebruik alleen het eerste resultaat met type 'house', 'residential', 'station', 'public_transport', 'city', 'town', 'village'
  const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adres)}&addressdetails=1&limit=5`);
  const data = await resp.json();
  if (data && data.length > 0) {
    // Zoek eerst naar een station als het woord 'station' in het adres zit
    if (adres.toLowerCase().includes('station')) {
      const station = data.find(d =>
        (d.type && d.type.includes('station')) ||
        (d.class && d.class.includes('railway')) ||
        (d.display_name && d.display_name.toLowerCase().includes('station'))
      );
      if (station) {
        return { lat: parseFloat(station.lat), lng: parseFloat(station.lon) };
      }
    }
    // Anders: pak het eerste resultaat met een bruikbaar type
    const preferred = data.find(d =>
      ['house', 'residential', 'public_transport', 'station', 'city', 'town', 'village'].includes(d.type)
    );
    if (preferred) {
      return { lat: parseFloat(preferred.lat), lng: parseFloat(preferred.lon) };
    }
    // Fallback: pak het eerste resultaat
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  throw new Error("Adres niet gevonden");
}

// Haal route en reistijd op via OpenRouteService
async function getRouteInfo(start, end) {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTES_API_KEY}`;
  const body = {
    coordinates: [
      [parseFloat(start.lng), parseFloat(start.lat)],
      [parseFloat(end.lng), parseFloat(end.lat)]
    ]
  };
  try {
    if (window && window.console) {
      console.log("Route body naar ORS:", body);
    }
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      if (resp.status === 403 || resp.status === 401) {
        throw new Error("API key ongeldig of limiet bereikt (OpenRouteService).");
      }
      throw new Error("API-fout: " + resp.status);
    }
    const data = await resp.json();

    // OpenRouteService v2 geeft routes[] ipv features[]
    if (window && window.console) {
      console.log("OpenRouteService response:", data);
    }

    if (data && data.routes && data.routes[0]) {
      const summary = data.routes[0].summary;
      return {
        afstand: summary.distance / 1000, // km
        duur: summary.duration / 60, // min
        geometry: data.routes[0].geometry
      };
    }
    if (data && data.features && data.features[0]) {
      // fallback voor oude API
      const summary = data.features[0].properties.summary;
      return {
        afstand: summary.distance / 1000,
        duur: summary.duration / 60,
        geometry: data.features[0].geometry
      };
    }
    if (data && data.error && data.error.message) {
      throw new Error("Route API: " + data.error.message);
    }
    throw new Error(
      "Geen route gevonden (controleer of de coördinaten logisch zijn, probeer een andere route, of test met 'Amsterdam' en 'Rotterdam')."
    );
  } catch (err) {
    throw new Error("Route ophalen mislukt: " + (err.message || err));
  }
}

// Multi-point route ophalen (voor tussenstops)
async function getRouteInfoMulti(punten) {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTES_API_KEY}`;
  const coords = punten.map(p => [parseFloat(p.lng), parseFloat(p.lat)]);
  const body = { coordinates: coords };
  try {
    if (window && window.console) {
      console.log("Route body naar ORS:", body);
    }
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      if (resp.status === 403 || resp.status === 401) {
        throw new Error("API key ongeldig of limiet bereikt (OpenRouteService).");
      }
      throw new Error("API-fout: " + resp.status);
    }
    const data = await resp.json();
    if (window && window.console) {
      console.log("OpenRouteService response:", data);
    }
    if (data && data.routes && data.routes[0]) {
      const summary = data.routes[0].summary;
      return {
        afstand: summary.distance / 1000,
        duur: summary.duration / 60,
        geometry: data.routes[0].geometry
      };
    }
    throw new Error("Geen route gevonden (controleer tussenstops en adressen).");
  } catch (err) {
    throw new Error("Route ophalen mislukt: " + (err.message || err));
  }
}

// Haal weer op via WeatherAPI
async function getWeather(lat, lng) {
  const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lng}&lang=nl`;
  const resp = await fetch(url);
  const data = await resp.json();
  return data.current.condition.text;
}

// Haal verkeersdrukte op via TomTom
async function getTraffic(lat, lng) {
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lng}&key=${TOMTOM_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data && data.flowSegmentData && data.flowSegmentData.currentSpeed && data.flowSegmentData.freeFlowSpeed) {
    const ratio = data.flowSegmentData.currentSpeed / data.flowSegmentData.freeFlowSpeed;
    if (ratio > 0.8) return 1;
    if (ratio > 0.6) return 2;
    if (ratio > 0.4) return 3;
    return 4;
  }
  return 1;
}

window.api = {
  geocodeAdres,
  getRouteInfo,
  getWeather,
  getTraffic,
  getRouteInfoMulti
};
