window.berekenRitprijs = function(afstand, duur, weer, trafficLevel, personen, reserveringDatumTijd) {
  // Personen: 1-4 = standaard, 5-8 = hogere tarieven
  let basis = 0;
  if (personen >= 5) {
    if (afstand <= 3) basis = 15;
    else if (afstand <= 4) basis = 17.5;
    else if (afstand <= 5) basis = 20;
    else if (afstand <= 6) basis = 22.5;
    else if (afstand <= 7) basis = 25;
    else if (afstand <= 8) basis = 27.5;
    else if (afstand <= 9) basis = 30;
    else basis = 3.5 + (afstand * 2.5) + (duur * 0.5);
  } else {
    if (afstand <= 3) basis = 10;
    else if (afstand <= 4) basis = 11.5;
    else if (afstand <= 5) basis = 13;
    else if (afstand <= 6) basis = 14.5;
    else if (afstand <= 7) basis = 16;
    else if (afstand <= 8) basis = 17.5;
    else if (afstand <= 9) basis = 19;
    else basis = 2.5 + (afstand * 1.5) + (duur * 0.5);
  }

  let weerToeslag = 1;
  if (weer && weer.toLowerCase().includes("patchy rain")) weerToeslag = 1.05;
  else if (weer && weer.toLowerCase().includes("light rain")) weerToeslag = 1.10;
  else if (weer && weer.toLowerCase().includes("moderate rain")) weerToeslag = 1.15;
  else if (weer && weer.toLowerCase().includes("heavy rain")) weerToeslag = 1.20;
  else if (weer && weer.toLowerCase().includes("torrential rain")) weerToeslag = 1.25;
  else if (weer && weer.toLowerCase().includes("thunderstorm")) weerToeslag = 1.25;
  else if (weer && weer.toLowerCase().includes("snow")) weerToeslag = 1.25;

  // Spitsuren: 07:00-09:00 en 16:00-18:00 (extra toeslag op verkeersdrukte)
  let spitsToeslag = 1;
  let uur = null;
  if (reserveringDatumTijd) {
    const dt = new Date(reserveringDatumTijd);
    uur = dt.getHours();
  } else {
    const nu = new Date();
    uur = nu.getHours();
  }
  if ((uur >= 7 && uur < 9) || (uur >= 16 && uur < 18)) {
    spitsToeslag = 1.30; // 30% extra toeslag tijdens spits
  }

  let verkeerToeslag = 1;
  if (trafficLevel === 2) verkeerToeslag = 1.10;
  else if (trafficLevel === 3) verkeerToeslag = 1.20;
  else if (trafficLevel === 4) verkeerToeslag = 1.30;
  verkeerToeslag *= spitsToeslag;

  // Nachttoeslag €5 tussen 23:00 en 07:00
  let nachtToeslag = 0;
  if (uur !== null && (uur >= 23 || uur < 7)) {
    nachtToeslag = 5;
  }

  const prijs = (basis * weerToeslag * verkeerToeslag) + nachtToeslag;
  return Math.round(prijs * 100) / 100;
};
