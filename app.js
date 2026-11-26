const data = loadData();
const $ = (id) => document.getElementById(id);

$("path").textContent = `C:\\${data.name}\\start`;
$("demo-badge").hidden = !data.demo;

initClock($("clock"));
initProgress($("progress"));
initDeadlines($("deadlines"));
initLinks($("links"));
initWeather($("weather"));

renderLinks($("links"), data); // links don't depend on time, render once

function tick() {
  const now = new Date();
  renderClock($("clock"), data, now);
  renderProgress($("progress"), data, now);
  renderDeadlines($("deadlines"), data, now);
}

tick();
setInterval(tick, 1000);

// weather is cached, so this only hits the API when the cache is stale
updateWeather($("weather"), data);
setInterval(() => updateWeather($("weather"), data), WEATHER_TTL);