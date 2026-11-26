const data = loadData();
const $ = (id) => document.getElementById(id);

$("path").textContent = `C:\\${data.name}\\motd`;
$("demo-badge").hidden = !data.demo;

initClock($("clock"));
initProgress($("progress"));
initDeadlines($("deadlines"));
initLinks($("links"));
initWeather($("weather"));
initActivity($("activity"));

renderLinks($("links"), data); // links don't depend on time, render once

function tick() {
  const now = new Date();
  renderClock($("clock"), data, now);
  renderSummary($("clock"), data, now);
  renderProgress($("progress"), data, now);
  renderDeadlines($("deadlines"), data, now);
}

tick();
setInterval(tick, 1000);

// weather and activity are cached, so these only hit the APIs when the cache is stale
updateWeather($("weather"), data);
setInterval(() => updateWeather($("weather"), data), WEATHER_TTL);

updateActivity($("activity"), data);
setInterval(() => updateActivity($("activity"), data), ACTIVITY_TTL);