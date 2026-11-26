// date n days from today as "2026-12-25", so the demo never goes stale
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// base values for everyone; saved data is applied on top
const DEFAULTS = {
  name: "guest",
  city: { name: "Saint Petersburg", lat: 59.94, lon: 30.31 },
  deadlines: [],
  links: [],
  prefixes: [],    // custom search prefixes: { key, url } where url contains %s
  github: "",      // username for the activity grid
  linkStyle: "[]", // brackets around links: "[]" or "{}"
};

// what visitors see until they add their own data
const DEMO_DATA = {
  deadlines: [
    { date: daysFromNow(0), title: "submit report" },
    { date: daysFromNow(3), title: "project deadline" },
    { date: daysFromNow(12), title: "exam" },
    { date: daysFromNow(40), title: "vacation" },
  ],
  links: [
    { title: "github", url: "https://github.com" },
    { title: "youtube", url: "https://youtube.com" },
    { title: "mail", url: "https://mail.google.com" },
    { title: "translate", url: "https://translate.google.com" },
  ],
  github: "torvalds",
};