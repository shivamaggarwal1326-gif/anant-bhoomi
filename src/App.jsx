import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";

// ─────────────────────────────────────────────────────────────────
// §1  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const C = {
  obsidian: "#0B0907",
  darkStone: "#1A1714",
  stone: "#221F1A",
  gold: "#B8965A",
  goldLight: "#D4AF6A",
  goldDim: "#8A6D3B",
  goldGlow: "rgba(184,150,90,0.35)",
  goldGlowStrong: "rgba(184,150,90,0.6)",
  border: "rgba(184,150,90,0.12)",
  land: "#13110E",
  landStroke: "rgba(184,150,90,0.18)",
  muted: "rgba(184,150,90,0.5)",
  body: "rgba(184,150,90,0.75)",
  white: "rgba(255,252,245,0.9)",
  green: "#4ADE80",
  greenGlow: "rgba(74,222,128,0.5)",
  red: "#EF4444",
};

// ─────────────────────────────────────────────────────────────────
// §2  GLOBAL CITY DATABASE (mock — swap with Google Places / Amadeus)
// ─────────────────────────────────────────────────────────────────
const CITY_DB = {
  "oslo":        { coords: [10.75, 59.91],   iata: "OSL", name: "Oslo",          country: "Norway",       region: "Scandinavia" },
  "london":      { coords: [-0.12, 51.51],   iata: "LHR", name: "London",        country: "United Kingdom", region: "Western Europe" },
  "tokyo":       { coords: [139.69, 35.69],  iata: "NRT", name: "Tokyo",         country: "Japan",        region: "East Asia" },
  "new york":    { coords: [-74.00, 40.71],  iata: "JFK", name: "New York",      country: "United States", region: "North America" },
  "dubai":       { coords: [55.27, 25.20],   iata: "DXB", name: "Dubai",         country: "UAE",          region: "Middle East" },
  "singapore":   { coords: [103.85, 1.35],   iata: "SIN", name: "Singapore",     country: "Singapore",    region: "Southeast Asia" },
  "sydney":      { coords: [151.21, -33.87], iata: "SYD", name: "Sydney",        country: "Australia",    region: "Oceania" },
  "paris":       { coords: [2.35, 48.86],    iata: "CDG", name: "Paris",         country: "France",       region: "Western Europe" },
  "cape town":   { coords: [18.42, -33.93],  iata: "CPT", name: "Cape Town",     country: "South Africa", region: "Southern Africa" },
  "são paulo":   { coords: [-46.63, -23.55], iata: "GRU", name: "São Paulo",     country: "Brazil",       region: "South America" },
  "sao paulo":   { coords: [-46.63, -23.55], iata: "GRU", name: "São Paulo",     country: "Brazil",       region: "South America" },
  "los angeles": { coords: [-118.24, 34.05], iata: "LAX", name: "Los Angeles",   country: "United States", region: "North America" },
  "moscow":      { coords: [37.62, 55.76],   iata: "SVO", name: "Moscow",        country: "Russia",       region: "Eastern Europe" },
  "beijing":     { coords: [116.40, 39.90],  iata: "PEK", name: "Beijing",       country: "China",        region: "East Asia" },
  "nairobi":     { coords: [36.82, -1.29],   iata: "NBO", name: "Nairobi",       country: "Kenya",        region: "East Africa" },
  "istanbul":    { coords: [28.98, 41.01],   iata: "IST", name: "Istanbul",      country: "Turkey",       region: "Eurasia" },
  "hong kong":   { coords: [114.17, 22.32],  iata: "HKG", name: "Hong Kong",     country: "China (SAR)",  region: "East Asia" },
  "mumbai":      { coords: [72.88, 19.08],   iata: "BOM", name: "Mumbai",        country: "India",        region: "South Asia" },
  "toronto":     { coords: [-79.38, 43.65],  iata: "YYZ", name: "Toronto",       country: "Canada",       region: "North America" },
  "berlin":      { coords: [13.40, 52.52],   iata: "BER", name: "Berlin",        country: "Germany",      region: "Central Europe" },
  "buenos aires":{ coords: [-58.38, -34.60], iata: "EZE", name: "Buenos Aires",  country: "Argentina",    region: "South America" },
  "bangkok":     { coords: [100.50, 13.76],  iata: "BKK", name: "Bangkok",       country: "Thailand",     region: "Southeast Asia" },
  "rome":        { coords: [12.50, 41.90],   iata: "FCO", name: "Rome",          country: "Italy",        region: "Southern Europe" },
  "stockholm":   { coords: [18.07, 59.33],   iata: "ARN", name: "Stockholm",     country: "Sweden",       region: "Scandinavia" },
  "doha":        { coords: [51.53, 25.29],   iata: "DOH", name: "Doha",          country: "Qatar",        region: "Middle East" },
  "mexico city": { coords: [-99.13, 19.43],  iata: "MEX", name: "Mexico City",   country: "Mexico",       region: "Central America" },
  "zurich":      { coords: [8.54, 47.38],    iata: "ZRH", name: "Zurich",        country: "Switzerland",  region: "Central Europe" },
  "auckland":    { coords: [174.76, -36.85], iata: "AKL", name: "Auckland",      country: "New Zealand",  region: "Oceania" },
  "cairo":       { coords: [31.24, 30.04],   iata: "CAI", name: "Cairo",         country: "Egypt",        region: "North Africa" },
  "lisbon":      { coords: [-9.14, 38.74],   iata: "LIS", name: "Lisbon",        country: "Portugal",     region: "Western Europe" },
};

// ─────────────────────────────────────────────────────────────────
// §2b  INDIAN DESTINATION HUB
// ─────────────────────────────────────────────────────────────────
const DEST_HUB = {
  DEL: { coords: [77.20, 28.61], iata: "DEL", name: "New Delhi",  state: "Delhi",        tagline: "Imperial Capital" },
  BOM: { coords: [72.88, 19.08], iata: "BOM", name: "Mumbai",     state: "Maharashtra",  tagline: "City of Dreams" },
  JAI: { coords: [75.79, 26.92], iata: "JAI", name: "Jaipur",     state: "Rajasthan",    tagline: "The Pink City" },
  UDR: { coords: [73.71, 24.58], iata: "UDR", name: "Udaipur",    state: "Rajasthan",    tagline: "City of Lakes" },
  CCU: { coords: [88.36, 22.57], iata: "CCU", name: "Kolkata",    state: "West Bengal",  tagline: "Cultural Heart" },
  GOI: { coords: [73.83, 15.38], iata: "GOI", name: "Goa",        state: "Goa",          tagline: "Coastal Paradise" },
};

const DEST_POIS = {
  DEL: [
    { name: "Humayun's Tomb",       coords: [77.25, 28.59], region: "Nizamuddin", type: "Mughal Heritage" },
    { name: "Qutub Minar",          coords: [77.19, 28.52], region: "Mehrauli",   type: "UNESCO Monument" },
    { name: "Red Fort",             coords: [77.24, 28.66], region: "Old Delhi",  type: "Imperial Fortress" },
    { name: "The Imperial Hotel",   coords: [77.22, 28.63], region: "Janpath",    type: "Heritage Hotel" },
    { name: "Lodhi Gardens",        coords: [77.22, 28.59], region: "Lodhi Road", type: "Historic Gardens" },
  ],
  BOM: [
    { name: "Gateway of India",     coords: [72.83, 18.92], region: "Colaba",     type: "Historic Monument" },
    { name: "Elephanta Caves",      coords: [72.93, 18.96], region: "Harbour",    type: "UNESCO Heritage" },
    { name: "Taj Mahal Palace",     coords: [72.83, 18.92], region: "Apollo Bunder", type: "Grand Hotel" },
    { name: "CST Station",          coords: [72.84, 18.94], region: "Fort",       type: "Victorian Gothic" },
    { name: "Haji Ali Dargah",      coords: [72.81, 18.98], region: "Worli",      type: "Sacred Islet" },
  ],
  JAI: [
    { name: "Hawa Mahal",           coords: [75.83, 26.92], region: "Old City",   type: "Palace of Winds" },
    { name: "Amber Fort",           coords: [75.85, 26.99], region: "Amer",       type: "Hilltop Fortress" },
    { name: "City Palace",          coords: [75.82, 26.93], region: "Old City",   type: "Royal Complex" },
    { name: "Jantar Mantar",        coords: [75.82, 26.92], region: "Old City",   type: "Observatory" },
    { name: "Nahargarh Fort",       coords: [75.82, 26.94], region: "Aravalli",   type: "Mountain Fort" },
  ],
  UDR: [
    { name: "Lake Palace",          coords: [73.68, 24.57], region: "Pichola",    type: "Floating Palace" },
    { name: "City Palace Udaipur",  coords: [73.68, 24.58], region: "Old City",   type: "Royal Complex" },
    { name: "Jag Mandir",           coords: [73.69, 24.57], region: "Lake Island", type: "Island Palace" },
    { name: "Monsoon Palace",       coords: [73.63, 24.58], region: "Sajjangarh", type: "Hilltop Palace" },
    { name: "Saheliyon Ki Bari",    coords: [73.69, 24.59], region: "Fatehsagar", type: "Garden Retreat" },
  ],
  CCU: [
    { name: "Victoria Memorial",    coords: [88.34, 22.55], region: "Maidan",     type: "Heritage Museum" },
    { name: "Howrah Bridge",        coords: [88.35, 22.58], region: "Hooghly",    type: "Iconic Landmark" },
    { name: "Indian Museum",        coords: [88.35, 22.56], region: "Chowringhee",type: "Grand Museum" },
    { name: "Marble Palace",        coords: [88.36, 22.58], region: "North Kolkata", type: "Heritage Mansion" },
    { name: "Dakshineswar Temple",  coords: [88.36, 22.65], region: "Baranagar",  type: "Sacred Temple" },
  ],
  GOI: [
    { name: "Basilica of Bom Jesus",coords: [73.91, 15.50], region: "Old Goa",    type: "UNESCO Church" },
    { name: "Fort Aguada",          coords: [73.77, 15.49], region: "Sinquerim",  type: "Portuguese Fort" },
    { name: "Chapora Fort",         coords: [73.74, 15.61], region: "Vagator",    type: "Hilltop Ruins" },
    { name: "Dudhsagar Falls",      coords: [74.31, 15.31], region: "Sanguem",    type: "Natural Wonder" },
    { name: "Se Cathedral",         coords: [73.91, 15.50], region: "Old Goa",    type: "Historic Cathedral" },
  ],
};

const DEFAULT_DEST = DEST_HUB.DEL;

// ─────────────────────────────────────────────────────────────────
// §3  MOCK API FUNCTIONS (swap-ready for production)
// ─────────────────────────────────────────────────────────────────

/** Mock city lookup — replace with Google Places Autocomplete */
function fetchCityCoords(query) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const key = query.toLowerCase().trim();
      const match = CITY_DB[key];
      if (match) resolve({ found: true, ...match });
      else resolve({ found: false });
    }, 300);
  });
}

/** Mock search suggestions */
function fetchCitySuggestions(query) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  return Object.entries(CITY_DB)
    .filter(([k, v]) => k.startsWith(q) || v.name.toLowerCase().startsWith(q))
    .slice(0, 5)
    .map(([, v]) => v);
}

/** Compute flight metadata — swap with Amadeus Flight Offers API */
function computeFlightData(origin, dest) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const [lon1, lat1] = origin.coords;
  const [lon2, lat2] = dest.coords;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const hours = dist / 850;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  const carriers = [
    { name: "Air India", prefix: "AI" },
    { name: "Emirates", prefix: "EK" },
    { name: "Singapore Airlines", prefix: "SQ" },
    { name: "Lufthansa", prefix: "LH" },
    { name: "Qatar Airways", prefix: "QR" },
    { name: "British Airways", prefix: "BA" },
    { name: "SAS Scandinavian", prefix: "SK" },
  ];
  const carrier = carriers[Math.floor(Math.random() * carriers.length)];
  const flightNum = String(Math.floor(Math.random() * 900) + 100);

  const routes = {
    "Scandinavia":     "Nordic Passage",
    "Western Europe":  "Continental Crossing",
    "Eastern Europe":  "Eastern Meridian",
    "Central Europe":  "Alpine Corridor",
    "Southern Europe": "Mediterranean Arc",
    "North America":   "Transatlantic Traverse",
    "South America":   "Southern Hemisphere Arc",
    "East Asia":       "Orient Express Route",
    "Southeast Asia":  "Silk Route Passage",
    "Middle East":     "Arabian Corridor",
    "Oceania":         "Pacific Odyssey",
    "Southern Africa": "Cape Meridian",
    "East Africa":     "Equatorial Passage",
    "North Africa":    "Saharan Corridor",
    "South Asia":      "Subcontinent Link",
    "Eurasia":         "Bosphorus Corridor",
    "Central America": "Tropic Gateway",
  };

  return {
    route: routes[origin.region] || `${origin.name} Expedition`,
    origin: origin.iata,
    originFull: `${origin.name}, ${origin.country}`,
    destination: dest.iata,
    destFull: `${dest.name}, India`,
    distance: `${Math.round(dist).toLocaleString()} km`,
    duration: `${h}h ${String(m).padStart(2, "0")}m`,
    carrier: carrier.name,
    flightNo: `${carrier.prefix} ${flightNum}`,
    aircraft: ["Boeing 787-9 Dreamliner", "Airbus A350-900", "Boeing 777-300ER"][Math.floor(Math.random() * 3)],
    altitude: "39,000 ft",
    speed: `${Math.round(830 + Math.random() * 80)} km/h`,
    status: "Active",
  };
}

// ─── §3b  AMADEUS FLIGHT OFFERS — live integration ───────────────
const AMADEUS_KEY    = import.meta.env?.VITE_AMADEUS_KEY || "";
const AMADEUS_SECRET = import.meta.env?.VITE_AMADEUS_SECRET || "";

let _amadeusToken = null;
let _amadeusExpiry = 0;

async function getAmadeusToken() {
  if (_amadeusToken && Date.now() < _amadeusExpiry) return _amadeusToken;
  const res = await fetch("https://api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: AMADEUS_KEY, client_secret: AMADEUS_SECRET }),
  });
  if (!res.ok) throw new Error(`Amadeus auth ${res.status}`);
  const data = await res.json();
  _amadeusToken = data.access_token;
  _amadeusExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _amadeusToken;
}

/** Fetch real flight offers. Returns enrichment overlay or null on failure. */
async function fetchAmadeusOffers(originIata, destIata) {
  if (!AMADEUS_KEY || !AMADEUS_SECRET) {
    console.log("[Anant Bhoomi] No Amadeus creds — using computed flight data");
    return null;
  }
  try {
    const token = await getAmadeusToken();
    const depDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(
      `https://api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originIata}&destinationLocationCode=${destIata}&departureDate=${depDate}&adults=1&travelClass=BUSINESS&nonStop=false&max=3`,
      { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!res.ok) throw new Error(`Amadeus ${res.status}`);
    const data = await res.json();
    if (!data.data?.length) return null;
    const best = data.data[0];
    const seg0 = best.itineraries[0].segments[0];
    const durM = best.itineraries[0].duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    console.log("[Anant Bhoomi] Amadeus offer:", best.price.total, best.price.currency);
    return {
      carrier: best.validatingAirlineCodes?.[0] || seg0.carrierCode,
      flightNo: `${seg0.carrierCode} ${seg0.number}`,
      duration: durM ? `${durM[1] || 0}h ${(durM[2] || "00").padStart(2, "0")}m` : best.itineraries[0].duration,
      price: `${best.price.currency === "EUR" ? "€" : best.price.currency === "USD" ? "$" : best.price.currency + " "}${parseFloat(best.price.total).toLocaleString()}`,
      stops: best.itineraries[0].segments.length - 1,
    };
  } catch (err) {
    console.warn("[Anant Bhoomi] Amadeus fetch failed:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// §3c  WEATHER API — Open-Meteo (live, no API key required)
// ─────────────────────────────────────────────────────────────────

/** WMO Weather Code → human-readable description + category */
const WMO_CODES = {
  0:  { desc: "Clear Skies",           icon: "☀", category: "clear" },
  1:  { desc: "Mostly Clear",          icon: "🌤", category: "clear" },
  2:  { desc: "Partly Cloudy",         icon: "⛅", category: "cloudy" },
  3:  { desc: "Overcast",              icon: "☁", category: "cloudy" },
  45: { desc: "Foggy",                 icon: "🌫", category: "fog" },
  48: { desc: "Depositing Rime Fog",   icon: "🌫", category: "fog" },
  51: { desc: "Light Drizzle",         icon: "🌦", category: "rain" },
  53: { desc: "Moderate Drizzle",      icon: "🌦", category: "rain" },
  55: { desc: "Dense Drizzle",         icon: "🌧", category: "rain" },
  56: { desc: "Freezing Drizzle",      icon: "🌧", category: "rain" },
  57: { desc: "Heavy Freezing Drizzle",icon: "🌧", category: "rain" },
  61: { desc: "Slight Rain",           icon: "🌦", category: "rain" },
  63: { desc: "Moderate Rain",         icon: "🌧", category: "rain" },
  65: { desc: "Heavy Rain",            icon: "🌧", category: "rain" },
  66: { desc: "Freezing Rain",         icon: "🌧", category: "rain" },
  67: { desc: "Heavy Freezing Rain",   icon: "🌧", category: "rain" },
  71: { desc: "Slight Snowfall",       icon: "🌨", category: "snow" },
  73: { desc: "Moderate Snowfall",     icon: "🌨", category: "snow" },
  75: { desc: "Heavy Snowfall",        icon: "❄", category: "snow" },
  77: { desc: "Snow Grains",           icon: "❄", category: "snow" },
  80: { desc: "Slight Showers",        icon: "🌦", category: "rain" },
  81: { desc: "Moderate Showers",      icon: "🌧", category: "rain" },
  82: { desc: "Violent Showers",       icon: "⛈", category: "storm" },
  85: { desc: "Slight Snow Showers",   icon: "🌨", category: "snow" },
  86: { desc: "Heavy Snow Showers",    icon: "🌨", category: "snow" },
  95: { desc: "Thunderstorm",          icon: "⛈", category: "storm" },
  96: { desc: "Thunderstorm with Hail",icon: "⛈", category: "storm" },
  99: { desc: "Severe Thunderstorm",   icon: "⛈", category: "storm" },
};

function decodeWeatherCode(code) {
  return WMO_CODES[code] || { desc: "Unknown", icon: "—", category: "unknown" };
}

/** Fetch live weather from Open-Meteo for any coordinates.
 *  Falls back to seasonally-accurate mock if network unavailable. */
async function fetchDestinationWeather(lat, lon) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
      `&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature,wind_speed_10m`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Weather API ${res.status}`);
    const data = await res.json();
    const cur = data.current;
    console.log("[Anant Bhoomi] Live weather received:", cur);
    const decoded = decodeWeatherCode(cur.weather_code);
    return {
      temperature: Math.round(cur.temperature_2m),
      feelsLike:   Math.round(cur.apparent_temperature),
      humidity:    cur.relative_humidity_2m,
      windSpeed:   Math.round(cur.wind_speed_10m),
      weatherCode: cur.weather_code,
      description: decoded.desc,
      icon:        decoded.icon,
      category:    decoded.category,
      isLive:      true,
    };
  } catch (err) {
    console.warn("[Anant Bhoomi] Weather fetch failed, using seasonal mock:", err.message);
    return generateSeasonalMock();
  }
}

/** Generates seasonally-accurate mock weather with ±3° jitter for liveness */
function generateSeasonalMock() {
  const month = new Date().getMonth(); // 0-11
  const seasons = {
    winter:  { min: 7,  max: 21, hum: 55, codes: [0,1,2,45],       cat: "clear" },
    spring:  { min: 18, max: 34, hum: 30, codes: [0,1,2],          cat: "clear" },
    summer:  { min: 28, max: 45, hum: 25, codes: [0,1,2,3],        cat: "clear" },
    monsoon: { min: 26, max: 36, hum: 80, codes: [61,63,65,80,95], cat: "rain" },
    autumn:  { min: 18, max: 32, hum: 45, codes: [0,1,2,3,45],     cat: "clear" },
  };
  const s = month <= 1 || month === 11 ? seasons.winter
          : month <= 3  ? seasons.spring
          : month <= 5  ? seasons.summer
          : month <= 8  ? seasons.monsoon
          : seasons.autumn;

  const baseTemp = Math.round(s.min + Math.random() * (s.max - s.min));
  const jitter = Math.round((Math.random() - 0.5) * 6); // ±3° randomizer
  const temp = baseTemp + jitter;
  const code = s.codes[Math.floor(Math.random() * s.codes.length)];
  const decoded = decodeWeatherCode(code);
  return {
    temperature: temp,
    feelsLike:   temp + Math.round((Math.random() - 0.5) * 6),
    humidity:    Math.max(10, Math.min(100, s.hum + Math.round((Math.random() - 0.5) * 20))),
    windSpeed:   Math.round(5 + Math.random() * 20),
    weatherCode: code,
    description: decoded.desc,
    icon:        decoded.icon,
    category:    decoded.category,
    isLive:      false,
  };
}

// ─────────────────────────────────────────────────────────────────
// §3d  HERITAGE API — OpenTripMap (live POI discovery with fallback)
// ─────────────────────────────────────────────────────────────────

// (Per-city POI fallbacks are in DEST_POIS above)

/**
 * Fetch heritage sites near destination from OpenTripMap.
 * Falls back to curated DEST_POIS per city if key missing or call fails.
 */
async function fetchLocalHeritage(lat, lon, destIata) {
  const fallback = DEST_POIS[destIata] || DEST_POIS.DEL;
  const apiKey = import.meta.env?.VITE_OPENTRIPMAP_KEY || "";
  if (!apiKey) {
    console.log("[Anant Bhoomi] No OpenTripMap key — using Signature Stays for", destIata);
    return fallback;
  }
  try {
    const radius = 50000; // 50km
    const url =
      `https://api.opentripmap.com/0.1/en/places/radius?` +
      `radius=${radius}&lon=${lon}&lat=${lat}` +
      `&kinds=historic,palaces,forts&rate=3&limit=5&apikey=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`OpenTripMap ${res.status}`);
    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      console.log("[Anant Bhoomi] No heritage results, using Signature Stays");
      return fallback;
    }

    console.log(`[Anant Bhoomi] Found ${data.features.length} heritage sites`);
    return data.features.slice(0, 5).map((f) => ({
      name:   f.properties.name || "Historic Site",
      coords: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
      region: f.properties.kinds?.split(",")[0] || "Heritage",
      type:   categorizeHeritage(f.properties.kinds),
    }));
  } catch (err) {
    console.warn("[Anant Bhoomi] Heritage fetch failed:", err.message);
    return fallback;
  }
}

function categorizeHeritage(kinds = "") {
  if (kinds.includes("palaces")) return "Royal Palace";
  if (kinds.includes("forts") || kinds.includes("fortifications")) return "Historic Fort";
  if (kinds.includes("temples")) return "Sacred Temple";
  if (kinds.includes("museums")) return "Heritage Museum";
  return "Historic Landmark";
}

/** Rehesya's curated advice based on live conditions */
function getRehesyaNote(weather, destName) {
  if (!weather) return null;
  const { temperature, category } = weather;
  const city = destName || "the city";

  if (temperature > 40) return `The heat is extraordinary in ${city} today. We've reserved the air-conditioned vintage Rolls-Royce and moved all excursions indoors until the golden hour.`;
  if (temperature > 35) return `The afternoon sun over ${city} is intense; we've arranged a private indoor gallery tour until dusk.`;
  if (temperature < 8) return `A rare chill has settled over ${city}. Pashmina shawls have been placed in your suite — the rooftop dinner is warmed by firepits tonight.`;
  if (category === "rain" || category === "storm") return `Monsoon rains are expected in ${city}; the gardens will be incredibly lush today. Your itinerary has been adjusted to include covered heritage walks.`;
  if (category === "fog") return `A soft fog drapes ${city} this morning. The monuments will have an ethereal quality — the car departs at 5:45.`;
  if (category === "snow") return `An exceptional snowfall graces ${city}. The gardens will look otherworldly — we've arranged early access.`;
  if (temperature >= 20 && temperature <= 30 && category === "clear") return `Conditions in ${city} are immaculate. The rooftop terrace at sunset is not to be missed tonight — your table is reserved.`;
  return `The atmosphere in ${city} is agreeable for exploration. Your curated itinerary for the day awaits in the foyer.`;
}

// ─────────────────────────────────────────────────────────────────
// §4  TOPOJSON DECODER (zero-dependency)
// ─────────────────────────────────────────────────────────────────
function topoToGeo(topology) {
  const key = Object.keys(topology.objects)[0];
  const geom = topology.objects[key];
  if (geom.type !== "GeometryCollection") return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: geom.geometries.map((g) => ({
      type: "Feature",
      id: g.id,
      properties: g.properties || {},
      geometry: decodeGeom(topology, g),
    })),
  };
}

function decodeGeom(topo, obj) {
  const { arcs, transform } = topo;
  const { scale: [sx, sy], translate: [tx, ty] } = transform || { scale: [1, 1], translate: [0, 0] };
  const decodeArc = (idx) => {
    const raw = arcs[idx < 0 ? ~idx : idx];
    let x = 0, y = 0;
    const pts = raw.map((p) => { x += p[0]; y += p[1]; return [x * sx + tx, y * sy + ty]; });
    return idx < 0 ? pts.reverse() : pts;
  };
  const ring = (r) => r.reduce((a, i) => a.concat(decodeArc(i)), []);
  if (obj.type === "Polygon") return { type: "Polygon", coordinates: obj.arcs.map(ring) };
  if (obj.type === "MultiPolygon") return { type: "MultiPolygon", coordinates: obj.arcs.map((p) => p.map(ring)) };
  return { type: obj.type, coordinates: [] };
}

// ─────────────────────────────────────────────────────────────────
// §5  PROJECTION ENGINE — auto-frames any origin ↔ destination
// ─────────────────────────────────────────────────────────────────
function computeProjection(originCoords, destCoords, w, h, zoomed) {
  let midLon = (originCoords[0] + destCoords[0]) / 2;
  const midLat = (originCoords[1] + destCoords[1]) / 2;

  const lonSpan = Math.abs(originCoords[0] - destCoords[0]);
  const latSpan = Math.abs(originCoords[1] - destCoords[1]);

  // Handle anti-meridian wrapping
  if (lonSpan > 180) midLon = midLon > 0 ? midLon - 180 : midLon + 180;

  const span = Math.max(lonSpan > 180 ? 360 - lonSpan : lonSpan, latSpan * 1.8, 40);
  const baseScale = Math.min(w, h) * (160 / span);
  const clampedScale = Math.max(Math.min(baseScale, Math.min(w, h) * 1.2), Math.min(w, h) * 0.22);
  const finalScale = zoomed ? clampedScale * 1.12 : clampedScale;

  return d3.geoNaturalEarth1()
    .center([midLon, midLat])
    .scale(finalScale)
    .translate([w * 0.55, h * 0.5]);
}

// ─────────────────────────────────────────────────────────────────
// §6  FONTS (idempotent injection)
// ─────────────────────────────────────────────────────────────────
if (!document.getElementById("ab-fonts")) {
  const link = document.createElement("link");
  link.id = "ab-fonts";
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@200;300;400;500;600&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

// ─────────────────────────────────────────────────────────────────
// §7  SEARCH INPUT COMPONENT
// ─────────────────────────────────────────────────────────────────
function OriginSearch({ onSelect, disabled }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIdx(-1);
    setNotFound(false);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      setSuggestions(fetchCitySuggestions(val));
    }, 150);
  };

  const selectCity = async (city) => {
    setSearching(true);
    setNotFound(false);
    setQuery(city.name);
    setSuggestions([]);
    setFocused(false);
    inputRef.current?.blur();
    const result = await fetchCityCoords(city.name);
    if (result.found) onSelect(result);
    else setNotFound(true);
    setSearching(false);
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    setSuggestions([]);
    const result = await fetchCityCoords(query);
    if (result.found) { setQuery(result.name); onSelect(result); }
    else setNotFound(true);
    setSearching(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIdx >= 0 && suggestions[selectedIdx]) selectCity(suggestions[selectedIdx]);
      else handleSubmit();
    }
    else if (e.key === "Escape") { setSuggestions([]); setFocused(false); inputRef.current?.blur(); }
  };

  const showDropdown = focused && suggestions.length > 0;

  return (
    <div style={{ padding: "0 28px 20px", position: "relative" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.muted, textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>
        Departure City
      </div>

      {/* Input wrapper */}
      <div style={{
        position: "relative",
        background: `linear-gradient(135deg, rgba(184,150,90,0.06) 0%, rgba(184,150,90,0.02) 100%)`,
        border: `1px solid ${notFound ? "rgba(239,68,68,0.4)" : focused ? "rgba(184,150,90,0.35)" : "rgba(184,150,90,0.12)"}`,
        borderRadius: 4,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
        boxShadow: focused ? `0 0 20px rgba(184,150,90,0.08), inset 0 0 12px rgba(184,150,90,0.03)` : "none",
      }}>
        {/* Diamond icon */}
        <div style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%) rotate(45deg)",
          width: 6, height: 6, border: `1px solid ${C.goldDim}`,
          background: searching ? C.gold : "transparent",
          transition: "background 0.3s ease",
          animation: searching ? "pulseDot 0.8s ease infinite" : "none",
        }} />

        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => { setFocused(true); setNotFound(false); }}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Search any city…"
          spellCheck={false}
          autoComplete="off"
          style={{
            width: "100%",
            padding: "13px 40px 13px 32px",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "'Playfair Display', serif",
            fontSize: 15,
            color: C.goldLight,
            letterSpacing: "0.01em",
            caretColor: C.gold,
            boxSizing: "border-box",
          }}
        />

        {/* Submit arrow */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !query.trim()}
          style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
            background: "transparent", border: "none", cursor: "pointer", padding: 8,
            opacity: query.trim() ? 1 : 0.3, transition: "opacity 0.3s ease",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h10M8 3.5L11.5 7 8 10.5" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div style={{
          position: "absolute",
          left: 28, right: 28, top: "100%", marginTop: 4,
          background: "rgba(26,23,20,0.98)",
          border: `1px solid rgba(184,150,90,0.2)`,
          borderRadius: 4, zIndex: 50,
          backdropFilter: "blur(12px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}>
          {suggestions.map((city, i) => (
            <div
              key={city.iata + city.name}
              onMouseDown={() => selectCity(city)}
              onMouseEnter={() => setSelectedIdx(i)}
              style={{
                padding: "11px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer",
                background: i === selectedIdx ? "rgba(184,150,90,0.08)" : "transparent",
                borderBottom: i < suggestions.length - 1 ? `1px solid rgba(184,150,90,0.06)` : "none",
                transition: "background 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 5, height: 5, background: C.gold, transform: "rotate(45deg)", opacity: i === selectedIdx ? 1 : 0.4, transition: "opacity 0.15s" }} />
                <div>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: C.goldLight }}>{city.name}</span>
                  <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{city.country}</span>
                </div>
              </div>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.goldDim, letterSpacing: "0.1em", fontWeight: 500 }}>{city.iata}</span>
            </div>
          ))}
        </div>
      )}

      {/* Helper / error */}
      {notFound ? (
        <div style={{ fontSize: 9, color: "rgba(239,68,68,0.6)", marginTop: 8, letterSpacing: "0.05em" }}>
          City not found — try London, Tokyo, New York, Sydney…
        </div>
      ) : (
        <div style={{ fontSize: 9, color: "rgba(184,150,90,0.3)", marginTop: 8, letterSpacing: "0.05em" }}>
          London · Tokyo · New York · Dubai · Sydney · 25+ cities
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// §7b  DESTINATION HUB SELECTOR
// ─────────────────────────────────────────────────────────────────
function DestinationSelector({ selected, onSelect, disabled }) {
  return (
    <div style={{ padding: "0 28px 16px" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.muted, textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>
        Destination Hub
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {Object.values(DEST_HUB).map((hub) => {
          const active = selected.iata === hub.iata;
          return (
            <button key={hub.iata} onClick={() => !disabled && onSelect(hub)} disabled={disabled} style={{
              padding: "8px 4px",
              background: active ? "linear-gradient(135deg, rgba(184,150,90,0.15), rgba(184,150,90,0.06))" : "linear-gradient(135deg, rgba(184,150,90,0.04), rgba(184,150,90,0.01))",
              border: `1px solid ${active ? "rgba(184,150,90,0.35)" : "rgba(184,150,90,0.08)"}`,
              borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.3s ease", textAlign: "center", opacity: disabled ? 0.5 : 1,
            }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: active ? 500 : 400, color: active ? C.goldLight : C.body, letterSpacing: "0.05em" }}>{hub.iata}</div>
              <div style={{ fontSize: 8, color: active ? C.muted : "rgba(184,150,90,0.3)", marginTop: 2, letterSpacing: "0.05em" }}>{hub.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// §8  DOSSIER PANEL
// ─────────────────────────────────────────────────────────────────
function DossierPanel({ visible, flightData, progress, phase, onOriginSelect, onDestSelect, selectedDest, weather }) {
  const fd = flightData;
  const rehesyaNote = getRehesyaNote(weather, selectedDest?.name);

  return (
    <div style={{
      position: "absolute", left: 0, top: 0, bottom: 0,
      width: "clamp(320px, 22vw, 400px)",
      background: `linear-gradient(135deg, rgba(26,23,20,0.97) 0%, rgba(11,9,7,0.99) 100%)`,
      borderRight: `1px solid ${C.border}`,
      zIndex: 10, display: "flex", flexDirection: "column",
      transform: visible ? "translateX(0)" : "translateX(-100%)",
      opacity: visible ? 1 : 0,
      transition: "transform 1.2s cubic-bezier(0.22,1,0.36,1), opacity 0.8s ease",
      overflow: "hidden",
    }}>
      {/* Gold edge */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.4, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: "28px 28px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, background: C.gold, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: "'Outfit'", fontSize: 10, letterSpacing: "0.35em", color: C.muted, textTransform: "uppercase", fontWeight: 500 }}>Anant Bhoomi</span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px, 2vw, 28px)", color: C.goldLight, fontWeight: 500, margin: 0, lineHeight: 1.2 }}>
          Flight Dossier
        </h1>
        <div style={{ width: 40, height: 1, background: C.gold, marginTop: 14, opacity: 0.5 }} />
      </div>

      {/* ★ SEARCH */}
      <OriginSearch onSelect={onOriginSelect} disabled={phase === 2} />

      {/* ★ DESTINATION HUB */}
      <DestinationSelector selected={selectedDest} onSelect={onDestSelect} disabled={phase === 2} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 28px", minHeight: 0 }}>
        {fd ? (
          <>
            {/* Route badge */}
            <div style={{
              background: `linear-gradient(135deg, rgba(184,150,90,0.08), rgba(184,150,90,0.02))`,
              border: `1px solid rgba(184,150,90,0.15)`, borderRadius: 4,
              padding: "14px 18px", marginBottom: 20,
            }}>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.muted, textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>Route Classification</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.goldLight, fontWeight: 500, fontStyle: "italic" }}>{fd.route}</div>
            </div>

            {/* Origin → Dest visual */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ textAlign: "center", minWidth: 54 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: C.white, fontWeight: 600, letterSpacing: "0.04em" }}>{fd.origin}</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{fd.originFull}</div>
              </div>
              <div style={{ flex: 1, position: "relative", height: 20, display: "flex", alignItems: "center" }}>
                <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.gold}, ${C.goldDim})`, opacity: 0.3 }} />
                <div style={{
                  position: "absolute",
                  left: `${Math.min(progress * 100, 100)}%`,
                  transform: "translate(-50%,-50%)", top: "50%",
                  width: 8, height: 8,
                  background: C.gold, borderRadius: "50%",
                  boxShadow: `0 0 12px ${C.goldGlow}`,
                  transition: "left 0.3s ease",
                }} />
                <svg style={{ position: "absolute", right: -2, top: "50%", transform: "translateY(-50%)" }} width="8" height="8" viewBox="0 0 8 8">
                  <path d="M0 0L8 4L0 8Z" fill={C.goldDim} />
                </svg>
              </div>
              <div style={{ textAlign: "center", minWidth: 54 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: C.white, fontWeight: 600, letterSpacing: "0.04em" }}>{fd.destination}</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{fd.destFull}</div>
              </div>
            </div>

            {/* Data rows */}
            {[
              { label: "Flight",       value: `${fd.carrier} · ${fd.flightNo}` },
              { label: "Aircraft",     value: fd.aircraft },
              { label: "Distance",     value: fd.distance },
              { label: "Duration",     value: fd.duration },
              { label: "Altitude",     value: fd.altitude },
              { label: "Ground Speed", value: fd.speed },
              ...(fd.price ? [{ label: "Business Class", value: fd.price, hl: true }] : []),
              ...(fd.stops != null ? [{ label: "Stops", value: fd.stops === 0 ? "Non-stop" : `${fd.stops} stop${fd.stops > 1 ? "s" : ""}` }] : []),
            ].map((item, i) => (
              <div key={item.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                padding: "9px 0",
                borderBottom: `1px solid rgba(184,150,90,0.06)`,
                animation: `fadeRow 0.5s ease ${0.1 + i * 0.07}s both`,
              }}>
                <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 400 }}>{item.label}</span>
                <span style={{ fontSize: item.hl ? 15 : 13, color: item.hl ? C.goldLight : C.body, fontWeight: item.hl ? 500 : 400, fontFamily: item.hl ? "'Playfair Display', serif" : "inherit", textAlign: "right" }}>{item.value}</span>
              </div>
            ))}

            {/* Status */}
            <div style={{ marginTop: 16, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: phase >= 3 ? C.green : C.gold,
                boxShadow: `0 0 8px ${phase >= 3 ? C.greenGlow : C.goldGlow}`,
                animation: "pulseDot 2s ease infinite",
              }} />
              <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: phase >= 3 ? C.green : C.gold, fontWeight: 500 }}>
                {phase >= 3 ? "Arrived · Exploring" : fd.status}
              </span>
            </div>

            {/* Amadeus mode indicator */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 10px", marginBottom: 16, borderRadius: 3,
              background: AMADEUS_KEY
                ? "linear-gradient(135deg, rgba(74,222,128,0.06), rgba(74,222,128,0.02))"
                : "linear-gradient(135deg, rgba(184,150,90,0.06), rgba(184,150,90,0.02))",
              border: `1px solid ${AMADEUS_KEY ? "rgba(74,222,128,0.15)" : "rgba(184,150,90,0.1)"}`,
            }}>
              <div style={{
                width: 4, height: 4, borderRadius: "50%",
                background: AMADEUS_KEY ? C.green : C.goldDim,
              }} />
              <span style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 8,
                letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 500,
                color: AMADEUS_KEY ? "rgba(74,222,128,0.6)" : "rgba(184,150,90,0.4)",
              }}>
                {AMADEUS_KEY ? "Mode: Live Market" : "Mode: Simulation"}
              </span>
            </div>

            {/* ── §11 DESTINATION ATMOSPHERE (live weather) ── */}
            {phase >= 3 && weather && (
              <div style={{ animation: "fadeRow 0.6s ease 0.2s both" }}>
                {/* Divider */}
                <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.15, margin: "4px 0 18px" }} />

                <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.muted, textTransform: "uppercase", marginBottom: 14, fontWeight: 500 }}>
                  Destination Atmosphere
                </div>

                {/* Temperature hero */}
                <div style={{
                  background: `linear-gradient(135deg, rgba(184,150,90,0.05), rgba(184,150,90,0.015))`,
                  border: `1px solid rgba(184,150,90,0.10)`,
                  borderRadius: 4,
                  padding: "16px 18px",
                  marginBottom: 14,
                  backdropFilter: "blur(4px)",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 38,
                          fontWeight: 300,
                          color: C.white,
                          lineHeight: 1,
                          letterSpacing: "-0.02em",
                        }}>
                          {weather.temperature}
                        </span>
                        <span style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 16,
                          fontWeight: 300,
                          color: C.muted,
                        }}>
                          °C
                        </span>
                      </div>
                      <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 14,
                        color: C.goldLight,
                        fontStyle: "italic",
                        marginTop: 6,
                      }}>
                        {weather.description}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      {/* Weather icon */}
                      <div style={{
                        fontSize: 28,
                        lineHeight: 1,
                        opacity: 0.7,
                        filter: "grayscale(30%)",
                      }}>
                        {weather.icon}
                      </div>
                      {/* Live/Mock indicator */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: weather.isLive ? C.green : C.goldDim,
                          boxShadow: weather.isLive ? `0 0 6px ${C.greenGlow}` : "none",
                        }} />
                        <span style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 8,
                          letterSpacing: "0.2em",
                          color: weather.isLive ? "rgba(74,222,128,0.7)" : "rgba(184,150,90,0.35)",
                          textTransform: "uppercase",
                        }}>
                          {weather.isLive ? "Live" : "Seasonal"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weather detail rows */}
                {[
                  { label: "Feels Like",  value: `${weather.feelsLike}°C` },
                  { label: "Humidity",     value: `${weather.humidity}%` },
                  { label: "Wind",         value: `${weather.windSpeed} km/h` },
                ].map((item, i) => (
                  <div key={item.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    padding: "7px 0",
                    borderBottom: `1px solid rgba(184,150,90,0.06)`,
                  }}>
                    <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 400 }}>{item.label}</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.body, fontWeight: 400 }}>{item.value}</span>
                  </div>
                ))}

                {/* Rehesya's Note */}
                {rehesyaNote && (
                  <div style={{
                    marginTop: 16,
                    background: `linear-gradient(135deg, rgba(184,150,90,0.05), rgba(184,150,90,0.01))`,
                    border: `1px solid rgba(184,150,90,0.1)`,
                    borderLeft: `2px solid ${C.goldDim}`,
                    borderRadius: "0 4px 4px 0",
                    padding: "14px 16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 4, height: 4, background: C.gold, borderRadius: "50%" }} />
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 9,
                        letterSpacing: "0.3em",
                        color: C.gold,
                        textTransform: "uppercase",
                        fontWeight: 500,
                      }}>
                        Rehesya's Note
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 12,
                      color: C.body,
                      lineHeight: 1.65,
                      fontStyle: "italic",
                    }}>
                      {rehesyaNote}
                    </div>
                  </div>
                )}

                <div style={{ height: 16 }} />
              </div>
            )}

            {/* Weather loading shimmer during phase 3 if not yet loaded */}
            {phase >= 3 && !weather && (
              <div style={{ animation: "fadeRow 0.5s ease 0.2s both" }}>
                <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.15, margin: "4px 0 18px" }} />
                <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.muted, textTransform: "uppercase", marginBottom: 14, fontWeight: 500 }}>
                  Destination Atmosphere
                </div>
                {/* Shimmer skeleton */}
                {[80, 120, 60].map((w, i) => (
                  <div key={i} style={{
                    height: i === 0 ? 48 : 14,
                    width: w,
                    borderRadius: 3,
                    marginBottom: i === 0 ? 12 : 10,
                    background: `linear-gradient(90deg, rgba(184,150,90,0.04) 25%, rgba(184,150,90,0.1) 50%, rgba(184,150,90,0.04) 75%)`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s ease infinite",
                  }} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Empty state — no origin selected yet */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", opacity: 0.6 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 16, opacity: 0.4 }}>
              <circle cx="24" cy="24" r="20" stroke={C.goldDim} strokeWidth="0.8" strokeDasharray="3 5" />
              <path d="M16 28 L24 16 L32 28" stroke={C.goldDim} strokeWidth="1" fill="none" />
              <circle cx="24" cy="24" r="2" fill={C.goldDim} />
            </svg>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: C.goldDim, fontStyle: "italic", textAlign: "center", lineHeight: 1.5 }}>
              Select a departure city<br />to chart your passage
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 28px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", color: C.muted, textTransform: "uppercase", textAlign: "center" }}>
          Curated by Anant Bhoomi · Est. MMXXVI
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// §9  POI TOOLTIP
// ─────────────────────────────────────────────────────────────────
function POITooltip({ poi, position, destName }) {
  if (!poi) return null;
  return (
    <div style={{
      position: "absolute", left: position[0] + 16, top: position[1] - 10,
      background: "rgba(26,23,20,0.96)", border: `1px solid rgba(184,150,90,0.25)`, borderRadius: 4,
      padding: "12px 16px", zIndex: 20, pointerEvents: "none",
      backdropFilter: "blur(8px)", minWidth: 180,
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(184,150,90,0.05)`,
    }}>
      <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.goldDim, textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>{poi.type}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: C.goldLight, fontWeight: 500, marginBottom: 4 }}>{poi.name}</div>
      <div style={{ fontSize: 11, color: C.muted }}>{poi.region}, {destName || "India"}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// §10  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Environment verification (check F12 console) ──
  console.log("[Anant Bhoomi] Key Check — OpenTripMap:", import.meta.env?.VITE_OPENTRIPMAP_KEY ? "✓ Present" : "✗ Missing");
  console.log("[Anant Bhoomi] Key Check — Amadeus:", AMADEUS_KEY ? "✓ Present" : "✗ Missing (Simulation Mode)");

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const geoRef = useRef(null);

  const [dims, setDims] = useState({ w: 960, h: 600 });
  const [geoLoaded, setGeoLoaded] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [selectedDest, setSelectedDest] = useState(DEFAULT_DEST);
  const [flightData, setFlightData] = useState(null);
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hoveredPOI, setHoveredPOI] = useState(null);
  const [poiPos, setPOIPos] = useState([0, 0]);
  const [weather, setWeather] = useState(null);
  const [pois, setPois] = useState(DEST_POIS.DEL);
  const [arrivalId, setArrivalId] = useState(0);
  const [radarPulse, setRadarPulse] = useState(false);

  // Resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => {
      const { width, height } = e[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load topology
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => { geoRef.current = topoToGeo(topo); setGeoLoaded(true); setPhase(1); })
      .catch(() => { geoRef.current = { type: "FeatureCollection", features: [] }; setGeoLoaded(true); setPhase(1); });
  }, []);

  // Origin selection handler
  const handleOriginSelect = useCallback((city) => {
    cancelAnimationFrame(animRef.current);
    setOrigin(city);
    setFlightData(computeFlightData(city, selectedDest));
    setProgress(0);
    setHoveredPOI(null);
    setWeather(null);
    setPois(DEST_POIS[selectedDest.iata] || DEST_POIS.DEL);
    setRadarPulse(true);
    setPhase(1);
    setTimeout(() => { setRadarPulse(false); setPhase(2); }, 800);
  }, [selectedDest]);

  // Destination change handler
  const handleDestSelect = useCallback((dest) => {
    setSelectedDest(dest);
    setWeather(null);
    setPois(DEST_POIS[dest.iata] || DEST_POIS.DEL);
    setArrivalId(0); // reset — data only fetches after flight lands
    if (origin) {
      cancelAnimationFrame(animRef.current);
      setFlightData(computeFlightData(origin, dest));
      setProgress(0);
      setHoveredPOI(null);
      setRadarPulse(true);
      setPhase(1);
      setTimeout(() => { setRadarPulse(false); setPhase(2); }, 800);
    }
  }, [origin]);

  // Flight animation
  useEffect(() => {
    if (phase !== 2) return;
    const dur = 4200;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min((now - t0) / dur, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setProgress(ease);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
      else {
        setPhase(3);
        setArrivalId((id) => id + 1); // bump counter → triggers data fetch
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  // ── §11b DATA FETCH — weather + heritage + Amadeus on every arrival ──
  useEffect(() => {
    if (arrivalId === 0) return;
    let cancelled = false;
    const dest = selectedDest;

    // Weather (always resolves — mock fallback built in)
    fetchDestinationWeather(dest.coords[1], dest.coords[0]).then((data) => {
      if (!cancelled) {
        console.log("[Anant Bhoomi] Weather:", data.isLive ? "LIVE" : "MOCK", data.temperature + "°C", data.description, "for", dest.name);
        setWeather(data);
      }
    });

    // Heritage (always resolves — per-dest fallback built in)
    fetchLocalHeritage(dest.coords[1], dest.coords[0], dest.iata).then((sites) => {
      if (!cancelled) setPois(sites);
    });

    // Amadeus price overlay (non-blocking enrichment)
    if (origin) {
      fetchAmadeusOffers(origin.iata, dest.iata).then((offer) => {
        if (!cancelled && offer) setFlightData((prev) => prev ? { ...prev, ...offer } : prev);
      });
    }

    return () => { cancelled = true; };
  }, [arrivalId, selectedDest, origin]);

  // ── D3 RENDER ──
  const drawMap = useCallback(() => {
    if (!svgRef.current || !geoRef.current) return;
    const { w, h } = dims;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Projection
    const originCoords = origin ? origin.coords : null;
    const destCoords = selectedDest.coords;
    const projection = originCoords
      ? computeProjection(originCoords, destCoords, w, h, phase >= 3)
      : d3.geoNaturalEarth1().center([45, 30]).scale(Math.min(w, h) * 0.35).translate([w * 0.55, h * 0.5]);

    const path = d3.geoPath().projection(projection);

    // ── Defs ──
    const defs = svg.append("defs");

    const poiGrad = defs.append("radialGradient").attr("id", "poiGlow");
    poiGrad.append("stop").attr("offset", "0%").attr("stop-color", C.gold).attr("stop-opacity", 0.8);
    poiGrad.append("stop").attr("offset", "50%").attr("stop-color", C.gold).attr("stop-opacity", 0.2);
    poiGrad.append("stop").attr("offset", "100%").attr("stop-color", C.gold).attr("stop-opacity", 0);

    const arcGrad = defs.append("linearGradient").attr("id", "arcGrad").attr("gradientUnits", "userSpaceOnUse");
    if (originCoords) {
      const p1 = projection(originCoords);
      const p2 = projection(destCoords);
      if (p1 && p2) arcGrad.attr("x1", p1[0]).attr("y1", p1[1]).attr("x2", p2[0]).attr("y2", p2[1]);
    }
    arcGrad.append("stop").attr("offset", "0%").attr("stop-color", C.goldDim);
    arcGrad.append("stop").attr("offset", "50%").attr("stop-color", C.goldLight);
    arcGrad.append("stop").attr("offset", "100%").attr("stop-color", C.gold);

    const mkGlow = (id, std) => {
      const f = defs.append("filter").attr("id", id).attr("x", "-100%").attr("y", "-100%").attr("width", "300%").attr("height", "300%");
      f.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", std).attr("result", "b");
      f.append("feMerge").selectAll("feMergeNode").data(["b", "SourceGraphic"]).enter().append("feMergeNode").attr("in", (d) => d);
    };
    mkGlow("glow", 3);
    mkGlow("glowStrong", 6);

    // ── Graticule ──
    svg.append("path")
      .datum(d3.geoGraticule().step([15, 15])())
      .attr("d", path).attr("fill", "none")
      .attr("stroke", C.border).attr("stroke-width", 0.3).attr("opacity", 0.5);

    // ── Countries ──
    svg.append("g").selectAll("path")
      .data(geoRef.current.features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", (d) => +d.id === 356 ? "rgba(184,150,90,0.12)" : C.land)
      .attr("stroke", C.landStroke)
      .attr("stroke-width", 0.4);

    // ── Destination label ──
    const delPt = projection(destCoords);
    if (delPt) {
      svg.append("text").attr("x", delPt[0]).attr("y", delPt[1] + 24)
        .attr("text-anchor", "middle").attr("fill", C.muted)
        .attr("font-family", "'Outfit', sans-serif").attr("font-size", 9)
        .attr("letter-spacing", "0.35em").attr("font-weight", 400).text(selectedDest.name.toUpperCase());

      // Radar pulse on destination change
      if (radarPulse) {
        for (let r = 0; r < 3; r++) {
          svg.append("circle")
            .attr("cx", delPt[0]).attr("cy", delPt[1])
            .attr("r", 6)
            .attr("fill", "none").attr("stroke", C.gold).attr("stroke-width", 1.2).attr("opacity", 0.7)
            .style("animation", `radarRing 1.2s ease ${r * 0.25}s forwards`);
        }
      }
    }

    // ── Origin label ──
    if (originCoords) {
      const oPt = projection(originCoords);
      if (oPt) {
        svg.append("text").attr("x", oPt[0]).attr("y", oPt[1] - 20)
          .attr("text-anchor", "middle").attr("fill", C.muted)
          .attr("font-family", "'Outfit', sans-serif").attr("font-size", 9)
          .attr("letter-spacing", "0.35em").text(origin.country.toUpperCase());
      }
    }

    // ── Endpoint markers ──
    const markers = originCoords ? [originCoords, destCoords] : [destCoords];
    markers.forEach((c) => {
      const pt = projection(c);
      if (!pt) return;
      const g = svg.append("g").attr("transform", `translate(${pt[0]},${pt[1]})`);
      g.append("circle").attr("r", 12).attr("fill", "none").attr("stroke", C.gold).attr("stroke-width", 0.5).attr("opacity", 0.3);
      g.append("circle").attr("r", 4).attr("fill", C.gold).attr("filter", "url(#glow)");
      g.append("circle").attr("r", 2).attr("fill", C.goldLight);
    });

    // ── Flight arc ──
    if (originCoords && phase >= 2) {
      const interp = d3.geoInterpolate(originCoords, destCoords);
      const N = 120;
      const arcPts = [];
      for (let i = 0; i <= N; i++) {
        const pt = projection(interp(i / N));
        if (pt) arcPts.push(pt);
      }

      const visIdx = Math.floor(progress * (arcPts.length - 1));
      if (visIdx > 0 && arcPts.length > 1) {
        const vis = arcPts.slice(0, visIdx + 1);
        const ln = d3.line().x((d) => d[0]).y((d) => d[1]).curve(d3.curveBasis);

        svg.append("path").attr("d", ln(vis)).attr("fill", "none")
          .attr("stroke", C.goldGlow).attr("stroke-width", 5).attr("stroke-linecap", "round").attr("filter", "url(#glowStrong)");
        svg.append("path").attr("d", ln(vis)).attr("fill", "none")
          .attr("stroke", "url(#arcGrad)").attr("stroke-width", 2).attr("stroke-linecap", "round").attr("filter", "url(#glow)");

        if (progress < 1) {
          svg.append("path").attr("d", ln(arcPts.slice(visIdx))).attr("fill", "none")
            .attr("stroke", C.goldDim).attr("stroke-width", 0.8).attr("stroke-dasharray", "4 6").attr("opacity", 0.3);
        }

        const cur = arcPts[visIdx];
        const nxt = arcPts[Math.min(visIdx + 1, arcPts.length - 1)];
        const ang = Math.atan2(nxt[1] - cur[1], nxt[0] - cur[0]) * (180 / Math.PI);
        const ac = svg.append("g").attr("transform", `translate(${cur[0]},${cur[1]}) rotate(${ang})`);
        ac.append("circle").attr("r", 16).attr("fill", C.goldGlow).attr("filter", "url(#glowStrong)");
        ac.append("path").attr("d", "M-8 0 L-3 -2.5 L6 -1 L8 0 L6 1 L-3 2.5 Z").attr("fill", C.goldLight).attr("filter", "url(#glow)");
      }
    }

    // ── Luxury POIs ──
    if (phase >= 3) {
      pois.forEach((poi, i) => {
        const pt = projection(poi.coords);
        if (!pt) return;
        const g = svg.append("g")
          .attr("transform", `translate(${pt[0]},${pt[1]})`)
          .style("cursor", "pointer")
          .style("opacity", 0)
          .style("animation", `poiFadeIn 0.6s ease ${i * 0.15}s forwards`);

        g.append("circle").attr("r", 18).attr("fill", "url(#poiGlow)").style("animation", `poiPulse 3s ease ${i * 0.3}s infinite`);
        g.append("rect").attr("x", -5).attr("y", -5).attr("width", 10).attr("height", 10)
          .attr("transform", "rotate(45)").attr("fill", C.gold).attr("stroke", C.goldLight).attr("stroke-width", 1).attr("filter", "url(#glow)");
        g.append("circle").attr("r", 2).attr("fill", C.obsidian);
        g.append("text").attr("y", 22).attr("text-anchor", "middle").attr("fill", C.goldLight)
          .attr("font-family", "'Playfair Display', serif").attr("font-size", 10).attr("font-weight", 500).text(poi.name);
        g.append("circle").attr("r", 22).attr("fill", "transparent")
          .on("mouseenter", () => { setHoveredPOI(poi); setPOIPos([pt[0], pt[1]]); })
          .on("mouseleave", () => setHoveredPOI(null));
      });
    }
  }, [dims, origin, selectedDest, phase, progress, pois, radarPulse]);

  useEffect(() => { drawMap(); }, [drawMap]);

  // ── RENDER ──
  return (
    <div ref={containerRef} style={{
      width: "100%", height: "100vh", background: C.obsidian,
      position: "relative", overflow: "hidden", fontFamily: "'Outfit', sans-serif", display: "flex",
    }}>
      <style>{`
        @keyframes poiFadeIn { from { opacity:0; transform: scale(0.5); } to { opacity:1; transform: scale(1); } }
        @keyframes poiPulse { 0%,100% { transform: scale(1); opacity:0.7; } 50% { transform: scale(1.4); opacity:0.2; } }
        @keyframes fadeInUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
        @keyframes pulseDot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeRow { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes radarRing { from { r: 6; opacity: 0.7; stroke-width: 1.2; } to { r: 40; opacity: 0; stroke-width: 0.3; } }
        input::placeholder { color: rgba(184,150,90,0.3); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(184,150,90,0.15); border-radius: 2px; }
      `}</style>

      {/* Noise */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none", zIndex: 5,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }} />
      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 4,
        background: `radial-gradient(ellipse at 60% 50%, transparent 30%, ${C.obsidian} 85%)`,
      }} />

      <DossierPanel visible={phase >= 1} flightData={flightData} progress={progress} phase={phase} onOriginSelect={handleOriginSelect} onDestSelect={handleDestSelect} selectedDest={selectedDest} weather={weather} />

      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }} />
        <POITooltip poi={hoveredPOI} position={poiPos} destName={selectedDest.name} />

        {phase >= 3 && (
          <div style={{
            position: "absolute", bottom: 32, right: 32,
            background: "rgba(26,23,20,0.92)", border: `1px solid rgba(184,150,90,0.15)`,
            borderRadius: 4, padding: "16px 20px", backdropFilter: "blur(8px)",
            animation: "fadeInUp 0.8s ease 0.5s both",
          }}>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.muted, textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>Curated Destinations</div>
            {pois.map((poi, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                <div style={{ width: 7, height: 7, background: C.gold, transform: "rotate(45deg)", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, color: C.body }}>{poi.name}</span>
                <span style={{ fontSize: 9, color: C.muted, marginLeft: "auto" }}>{poi.region}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {phase === 0 && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 30, background: C.obsidian,
        }}>
          <div style={{ width: 8, height: 8, background: C.gold, transform: "rotate(45deg)", marginBottom: 20, animation: "poiPulse 1.5s ease infinite" }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.goldLight, letterSpacing: "0.05em" }}>Anant Bhoomi</div>
          <div style={{ fontSize: 10, letterSpacing: "0.4em", color: C.muted, textTransform: "uppercase", marginTop: 8 }}>Charting your journey</div>
        </div>
      )}

      {phase >= 1 && (
        <div style={{
          position: "absolute", top: 24, right: 32, textAlign: "right", zIndex: 6,
          animation: "fadeInUp 1s ease 0.5s both",
        }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(14px,1.5vw,20px)", color: C.goldDim, fontWeight: 400, fontStyle: "italic" }}>Anant Bhoomi</div>
          <div style={{ fontSize: 8, letterSpacing: "0.5em", color: C.muted, textTransform: "uppercase", marginTop: 4 }}>Luxury Travel Concierge</div>
        </div>
      )}
    </div>
  );
}
