// ...form validatie, ophalen van velden, aanroepen van api.js, klant-locatie.js, klant-map.js, ritprijs.js...
// Voorbeeld:
// document.getElementById('boeking-form').addEventListener('submit', ...);

document.getElementById('boeking-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const ophaalInput = document.getElementById('ophaal');
  const afzetInput = document.getElementById('afzet');
  const personenInput = document.getElementById('personen');
  const errorDiv = document.getElementById('form-error');
  errorDiv.classList.remove('show');
  errorDiv.innerText = "";

  if (!ophaalInput || !afzetInput || !personenInput) {
    errorDiv.innerText = "Ophaal-, afzetveld of aantal personen niet gevonden.";
    errorDiv.classList.add('show');
    return;
  }

  const ophaal = ophaalInput.value.trim();
  const afzet = afzetInput.value.trim();
  const personen = parseInt(personenInput.value, 10);

  // Verzamel tussenstops
  const tussenstopInputs = Array.from(document.querySelectorAll('.tussenstop'));
  const tussenstops = tussenstopInputs.map(input => input.value.trim()).filter(Boolean);

  if (!ophaal || !afzet || !personen || personen < 1 || personen > 8) {
    errorDiv.innerText = "Vul alle verplichte velden in en kies het aantal personen.";
    errorDiv.classList.add('show');
    return;
  }

  document.getElementById('ritprijs').innerText = "Route en prijs worden berekend...";
  document.getElementById('kaart').innerHTML = "";

  // Reservering toeslag
  const reservering = window._reserveringToegevoegd === true;
  let reserveringDatumTijd = "";
  const reserveringDatetimeInput = document.getElementById('reservering-datetime');
  if (reservering && reserveringDatetimeInput) {
    reserveringDatumTijd = reserveringDatetimeInput.value;
    if (!reserveringDatumTijd) {
      errorDiv.innerText = "Kies een gewenste datum en tijd voor de reservering.";
      errorDiv.classList.add('show');
      return;
    }
  }

  try {
    // Geocode alle adressen
    const ophaalLoc = await window.api.geocodeAdres(ophaal);
    const tussenstopLocs = [];
    for (let stop of tussenstops) {
      tussenstopLocs.push(await window.api.geocodeAdres(stop));
    }
    const afzetLoc = await window.api.geocodeAdres(afzet);

    // Controleer locaties
    if (!ophaalLoc || !afzetLoc || isNaN(ophaalLoc.lat) || isNaN(ophaalLoc.lng) || isNaN(afzetLoc.lat) || isNaN(afzetLoc.lng)) {
      throw new Error("Kon locaties niet vinden. Controleer de adressen.");
    }
    for (const loc of tussenstopLocs) {
      if (!loc || isNaN(loc.lat) || isNaN(loc.lng)) throw new Error("Kon een tussenstop niet vinden.");
    }

    // Bouw alle punten in volgorde
    const punten = [ophaalLoc, ...tussenstopLocs, afzetLoc];

    // Haal route op (meerdere punten)
    const route = await window.api.getRouteInfoMulti(punten);

    if (!route || !route.afstand || !route.duur || !route.geometry) {
      throw new Error("Geen route gevonden tussen deze locaties.");
    }

    const weer = await window.api.getWeather(ophaalLoc.lat, ophaalLoc.lng);
    const trafficLevel = await window.api.getTraffic(ophaalLoc.lat, ophaalLoc.lng);
    const prijs = window.berekenRitprijs(
      route.afstand,
      route.duur,
      weer,
      trafficLevel,
      personen,
      reserveringDatumTijd
    );

    // Voeg reserveringstoeslag toe
    let totaalPrijs = prijs;
    let reserveringMsg = "";
    if (reservering) {
      totaalPrijs += 17.5;
      reserveringMsg = `<div style="color:#2563eb;font-weight:600;margin-top:6px;">
        Reserveringstoeslag: <span style="color:#23283a;background:#ffe082;padding:2px 8px;border-radius:6px;">€17,50</span>
      </div>`;
    }

    window.toonKaartMetTussenstops(punten, route.geometry);

    // Surge melding tonen als er toeslag is door verkeer of weer
    let surgeMsg = "";
    if (
      (weer && (
        weer.toLowerCase().includes("rain") ||
        weer.toLowerCase().includes("thunderstorm") ||
        weer.toLowerCase().includes("snow")
      )) ||
      (trafficLevel && trafficLevel >= 3)
    ) {
      surgeMsg = `<div style="color:#ff6b6b;font-weight:600;margin-top:8px;">
        Er is op dit moment veel vraag en/of slecht weer. De prijzen zijn tijdelijk hoger.
      </div>`;
    }

    // Nachttoeslag melding (gebruik geplande tijd)
    let nachtMsg = "";
    let nachtUur = null;
    if (reserveringDatumTijd) {
      nachtUur = new Date(reserveringDatumTijd).getHours();
    } else {
      nachtUur = new Date().getHours();
    }
    if (nachtUur >= 23 || nachtUur < 7) {
      nachtMsg = `<div style="color:#ffe082;font-weight:600;margin-top:6px;">
        Nachttoeslag: €5 (tussen 23:00 en 07:00)
      </div>`;
    }

    // Toon ritprijs, reserveringstoeslag en totaalprijs apart
    document.getElementById('ritprijs').innerHTML =
      `<strong>Afstand:</strong> ${route.afstand.toFixed(2)} km &nbsp; | &nbsp; <strong>Duur:</strong> ${route.duur.toFixed(0)} min<br>
      <strong>Weer:</strong> ${weer} &nbsp; | &nbsp; <strong>Verkeersdrukte:</strong> ${["Laag","Matig","Druk","Zeer druk"][trafficLevel-1]}<br>
      <strong>Personen:</strong> ${personen}<br>
      <div style="margin-top:8px;">
        <span style="font-weight:600;">Ritprijs:</span>
        <span style="color:#fbbf24;font-size:1.13em;">€${prijs.toFixed(2)}</span>
      </div>
      ${reserveringMsg}
      <div style="margin-top:8px;font-weight:700;">
        Totaalprijs: <span style="color:#2563eb;font-size:1.18em;">€${totaalPrijs.toFixed(2)}</span>
      </div>
      ${nachtMsg}
      ${surgeMsg}`;

    // Sla gegevens op in localStorage (voor demo)
    localStorage.setItem("ophaaladres", ophaal);
    localStorage.setItem("afzetadres", afzet);
    localStorage.setItem("personen", personen);
    localStorage.setItem("tussenstops", JSON.stringify(tussenstops));
    localStorage.setItem("reservering", reservering ? "1" : "0");
    localStorage.setItem("reservering_datumtijd", reserveringDatumTijd || "");
    localStorage.setItem("rit_afstand_km", route.afstand);
    localStorage.setItem("rit_duur_min", route.duur);
    localStorage.setItem("rit_prijs", totaalPrijs);
    localStorage.removeItem("rit_id"); // rit_id alleen na betaling!

    // Genereer een unieke rit-id, maar voeg deze pas toe na geslaagde betaling!
    let ritId = null;

    // Sla gegevens op in localStorage (voor demo)
    localStorage.setItem("ophaaladres", ophaal);
    localStorage.setItem("afzetadres", afzet);
    localStorage.setItem("personen", personen);
    localStorage.setItem("tussenstops", JSON.stringify(tussenstops));
    localStorage.setItem("reservering", reservering ? "1" : "0");
    localStorage.setItem("reservering_datumtijd", reserveringDatumTijd || "");
    localStorage.setItem("rit_afstand_km", route.afstand);
    localStorage.setItem("rit_duur_min", route.duur);
    localStorage.setItem("rit_prijs", totaalPrijs);
    localStorage.removeItem("rit_id"); // rit_id alleen na betaling!

    // ...rest van bestaande code...
  } catch (err) {
    errorDiv.innerText = "Er ging iets mis: " + err.message;
    errorDiv.classList.add('show');
    document.getElementById('ritprijs').innerText = "";
    document.getElementById('kaart').innerHTML = "";
  }
});

// Functie om een unieke rit-id te genereren (bijvoorbeeld na betaling)
window.genereerRitId = function() {
  // Simpel: timestamp + random hex
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 1e8).toString(16);
  return `RIT-${ts}-${rnd}`;
};

// Na geslaagde online betaling: sla rit op in array in localStorage
window.ritBetalingGeslaagd = function() {
  const ritId = window.genereerRitId();
  localStorage.setItem("rit_id", ritId);

  // Verzamel ritgegevens
  const rit = {
    id: ritId,
    ophaaladres: localStorage.getItem("ophaaladres") || "",
    afzetadres: localStorage.getItem("afzetadres") || "",
    datumtijd: localStorage.getItem("reservering_datumtijd") || "",
    personen: localStorage.getItem("personen") || "",
    status: "betaald",
    prijs: localStorage.getItem("rit_prijs") || ""
  };

  // Voeg toe aan array in localStorage
  let ritten = [];
  const rittenStr = localStorage.getItem("ritten");
  if (rittenStr) {
    try { ritten = JSON.parse(rittenStr); } catch (e) {}
  }
  ritten.push(rit);
  localStorage.setItem("ritten", JSON.stringify(ritten));

  // Toon eventueel aan de gebruiker
  if (document.getElementById('ritprijs')) {
    document.getElementById('ritprijs').innerHTML +=
      `<div style="margin-top:10px;font-weight:700;color:#bfa046;">Jouw rit-ID: <span style="background:#fffbe6;color:#a07d1a;padding:2px 10px;border-radius:7px;font-size:1.1em;">${ritId}</span></div>`;
  }
  return ritId;
};

// Na Mollie-betaling: update rit-status (demo, in productie via webhook)
window.updateRitStatus = function(ritId, status) {
  let ritten = [];
  const rittenStr = localStorage.getItem("ritten");
  if (rittenStr) { try { ritten = JSON.parse(rittenStr); } catch (e) {} }
  ritten = ritten.map(r => r.id === ritId ? { ...r, status } : r);
  localStorage.setItem("ritten", JSON.stringify(ritten));
};
