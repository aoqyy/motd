// short overview next to the clock: weather, today, next deadline
function summaryLines(data, now) {
  const lines = [];

  if (lastWeather) {
    lines.push(`${deg(lastWeather.temp)} ${WEATHER_CODES[lastWeather.code] ?? ""}`.trim());
  }

  const upcoming = data.deadlines
    .map((d) => ({ ...d, days: daysLeft(d.date, now) }))
    .filter((d) => d.days >= 0) // also drops NaN from broken dates
    .sort((a, b) => a.days - b.days);

  const dueToday = upcoming.filter((d) => d.days === 0).length;
  lines.push(dueToday ? `${dueToday} due today` : "nothing due today");

  const next = upcoming.find((d) => d.days > 0);
  if (next) lines.push(`next: ${next.title} · ${whenText(next.days)}`);

  return lines;
}

function renderSummary(el, data, now) {
  el.querySelector(".clock__summary").textContent = summaryLines(data, now).join("\n");
}