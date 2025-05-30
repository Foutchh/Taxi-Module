import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { MongoClient } = require("mongodb");
const MONGO_URI = "mongodb+srv://fataxiservice:EhiH3bdU62OooWlx@cluster0.3fq9l9r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "fa_taxi_centrale";
let db;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, 'chauffeurs.json');

// MongoDB configuration

// Maak verbinding met MongoDB bij server start
MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);
    console.log("MongoDB connected");
  })
  .catch(err => {
    console.error("MongoDB connectie fout:", err);
    process.exit(1);
  });

// Gebruik Gmail SMTP, via environment variables (Render: MAIL_USER en MAIL_PASS)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // jouw gmail-adres
    pass: process.env.MAIL_PASS  // app-wachtwoord van Gmail
  }
});

app.post("/api/send-verificatie", async (req, res) => {
  const { email, code, naam } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email en code verplicht" });
  try {
    // Log voor debuggen
    console.log("Verificatie e-mail versturen naar:", email, "code:", code, "naam:", naam);
    await transporter.verify();
    await transporter.sendMail({
      from: `"FA Taxi Centrale" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Uw verificatiecode voor FA Taxi Centrale",
      text: `Beste ${naam || "klant"},\n\nUw verificatiecode is: ${code}\n\nMet vriendelijke groet,\nFA Taxi Centrale`
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Fout bij verzenden e-mail:", err);
    // Geef meer details terug voor debuggen (alleen tijdelijk!)
    res.status(500).json({ error: "E-mail verzenden mislukt", details: err.message, stack: err.stack });
  }
});

app.get("/", (req, res) => {
  res.send("<h1>FA Taxi Centrale backend draait!</h1>");
});

// 🚗 Registratie
app.post('/registreer', (req, res) => {
  const { naam, wachtwoord } = req.body;
  const gebruikers = JSON.parse(fs.readFileSync(dataPath));

  const bestaat = gebruikers.find((g) => g.naam === naam);
  if (bestaat) return res.status(400).json({ message: 'Gebruiker bestaat al' });

  gebruikers.push({ naam, wachtwoord });
  fs.writeFileSync(dataPath, JSON.stringify(gebruikers, null, 2));
  res.json({ message: 'Registratie gelukt!' });
});

// 🔐 Login
app.post('/login', (req, res) => {
  const { naam, wachtwoord } = req.body;
  const gebruikers = JSON.parse(fs.readFileSync(dataPath));

  const gebruiker = gebruikers.find((g) => g.naam === naam && g.wachtwoord === wachtwoord);
  if (!gebruiker) return res.status(401).json({ message: 'Onjuiste inloggegevens' });

  res.json({ message: 'Inloggen gelukt!' });
});

// 📍 Locatie ophalen
app.get('/locatie', (req, res) => {
  const locatie = {
    lat: 52.3784,  // Voorbeeld latitude
    lon: 4.9009   // Voorbeeld longitude
  };
  res.json(locatie);
});

// Zorg dat ritten.json en klanten.json altijd bestaan (ook op Render)
const rittenPath = path.join(__dirname, "ritten.json");
if (!fs.existsSync(rittenPath)) {
  fs.writeFileSync(rittenPath, "[]");
}

// Zorg dat klanten.json altijd bestaat (zoals bij ritten.json)
const klantenPath = path.join(__dirname, "klanten.json");
if (!fs.existsSync(klantenPath)) {
  fs.writeFileSync(klantenPath, "[]");
}

// Zorg dat alle klant-routes wachten tot MongoDB connectie klaar is
function requireDb(req, res, next) {
  if (!db) {
    res.status(503).json({ error: "Database nog niet verbonden" });
  } else {
    next();
  }
}

// Klantenbestand API (MongoDB)
app.get("/api/klanten", requireDb, async (req, res) => {
  try {
    const klanten = await db.collection("klanten").find({}).toArray();
    res.json(klanten);
  } catch (e) {
    res.status(500).json({ error: "Kan klanten niet ophalen" });
  }
});

// Klant opslaan (POST, MongoDB)
app.post("/api/klant", requireDb, async (req, res) => {
  const klant = req.body;
  if (!klant || !klant.email) return res.status(400).json({ error: "Klantgegevens ongeldig" });
  try {
    await db.collection("klanten").updateOne(
      { email: klant.email },
      { $set: klant },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Kan klant niet opslaan" });
  }
});

// Rittenbestand API (MongoDB)
app.get("/api/ritten", async (req, res) => {
  try {
    const ritten = await db.collection("ritten").find({}).toArray();
    res.json(ritten);
  } catch (e) {
    res.status(500).json({ error: "Kan ritten niet ophalen" });
  }
});

// Rit opslaan (POST, MongoDB)
app.post("/api/rit", async (req, res) => {
  const rit = req.body;
  if (!rit || !rit.id) return res.status(400).json({ error: "Ritgegevens ongeldig" });
  try {
    await db.collection("ritten").updateOne(
      { id: rit.id },
      { $set: rit },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Kan rit niet opslaan" });
  }
});

// Voeg favicon route toe om 404 te voorkomen
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Geen actie nodig in server.js voor 'text-fill-color' foutmelding.
// Deze fout hoort bij CSS in je HTML-bestanden, niet bij deze server code.

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server draait op http://localhost:${port}`);
});
