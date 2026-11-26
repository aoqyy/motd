const data = loadData();
const $ = (id) => document.getElementById(id);

$("path").textContent = `C:\\${data.name}\\start`;
$("demo-badge").hidden = !data.demo;

initClock($("clock"));
initProgress($("progress"));
initDeadlines($("deadlines"));
initLinks($("links"));

renderLinks($("links"), data); // links don't depend on time, render once

function tick() {
  const now = new Date();
  renderClock($("clock"), data, now);
  renderProgress($("progress"), data, now);
  renderDeadlines($("deadlines"), data, now);
}

tick();
setInterval(tick, 1000);