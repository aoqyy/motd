const WEATHER_CACHE_KEY = "motd:weather";
const WEATHER_TTL = 30 * 60 * 1000; // refetch every 30 minutes

// WMO weather codes used by Open-Meteo
const WEATHER_CODES = {
  0: "clear", 1: "mostly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "rime fog",
  51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
  56: "freezing drizzle", 57: "freezing drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain",
  66: "freezing rain", 67: "freezing rain",
  71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains",
  80: "light showers", 81: "showers", 82: "heavy showers",
  85: "snow showers", 86: "heavy snow showers",
  95: "thunderstorm", 96: "thunderstorm, hail", 99: "thunderstorm, hail",
};

// "Kazan" -> { name, lat, lon } or null if nothing was found
async function geocode(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&format=json&name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocoding failed: ${res.status}`);
  const place = (await res.json()).results?.[0];
  return place ? { name: place.name, lat: place.latitude, lon: place.longitude } : null;
}

async function fetchWeather({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min",
    wind_speed_unit: "ms",
    timezone: "auto",
    forecast_days: 1,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`weather failed: ${res.status}`);
  const json = await res.json();
  return {
    temp: json.current.temperature_2m,
    feels: json.current.apparent_temperature,
    code: json.current.weather_code,
    wind: json.current.wind_speed_10m,
    max: json.daily.temperature_2m_max[0],
    min: json.daily.temperature_2m_min[0],
  };
}

function readWeatherCache(city) {
  try {
    const cache = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY));
    return cache && cache.lat === city.lat && cache.lon === city.lon ? cache : null;
  } catch {
    return null;
  }
}

function writeWeatherCache(city, weather) {
  const cache = { lat: city.lat, lon: city.lon, time: Date.now(), weather };
  localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
}

const deg = (t) => `${Math.round(t)}°`;

function initWeather(el) {
  el.innerHTML = `
    <h2>weather</h2>
    <div class="weather__temp"></div>
    <div class="weather__desc"></div>
    <div class="weather__meta muted"></div>
    <div class="weather__meta muted"></div>`;
}

function showWeather(el, city, weather, note) {
  const [meta1, meta2] = el.querySelectorAll(".weather__meta");
  el.querySelector(".weather__temp").textContent = deg(weather.temp);
  el.querySelector(".weather__desc").textContent = WEATHER_CODES[weather.code] ?? "unknown";
  meta1.textContent = `feels ${deg(weather.feels)} · wind ${Math.round(weather.wind)} m/s`;
  meta2.textContent = `${deg(weather.min)} / ${deg(weather.max)} · ${city.name}${note ? ` · ${note}` : ""}`;
}

function showWeatherMessage(el, text) {
  initWeather(el);
  el.querySelector(".weather__desc").textContent = `// ${text}`;
  el.querySelector(".weather__desc").className = "weather__desc muted";
}

async function updateWeather(el, data) {
  let city = data.city;

  // the city came from settings without coordinates: look them up once and remember
  if (city.lat == null || city.lon == null) {
    try {
      city = await geocode(city.name);
    } catch {
      showWeatherMessage(el, "offline");
      return;
    }
    if (!city) {
      showWeatherMessage(el, `city not found: ${data.city.name}`);
      return;
    }
    data.city = city;
    if (!data.demo) saveData(data);
  }

  const cache = readWeatherCache(city);
  if (cache && Date.now() - cache.time < WEATHER_TTL) {
    showWeather(el, city, cache.weather);
    return;
  }

  try {
    const weather = await fetchWeather(city);
    writeWeatherCache(city, weather);
    showWeather(el, city, weather);
  } catch {
    if (cache) showWeather(el, city, cache.weather, "offline");
    else showWeatherMessage(el, "offline");
  }
}