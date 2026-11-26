const data = loadData();
const $ = (id) => document.getElementById(id);

$("path").textContent = `C:\\${data.name}\\start`;
$("demo-badge").hidden = !data.demo;

initClock($("clock"));
initProgress($("progress"));

function tick() {
  const now = new Date();
  renderClock($("clock"), data, now);
  renderProgress($("progress"), data, now);
}

tick();
setInterval(tick, 1000);