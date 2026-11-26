const HISTORY_KEY = "motd:history";
const HISTORY_MAX = 50;
const DEFAULT_ENGINE = "g";

// %s is replaced with the encoded query
const SEARCH_ENGINES = {
  g:   "https://www.google.com/search?q=%s",
  gh:  "https://github.com/search?q=%s",
  yt:  "https://www.youtube.com/results?search_query=%s",
  w:   "https://en.wikipedia.org/w/index.php?search=%s",
  r:   "https://www.reddit.com/search/?q=%s",
  ani: "https://anilist.co/search/anime?search=%s",
};

const HELP = `search    g gh yt w r ani <query>      e.g. yt lofi
open      <link name> | <url>          e.g. github, vk.com
add       <YYYY-MM-DD | +days> <title> e.g. add +3 report
done      <title>                      remove a deadline
weather   <city>                       change city
name      <name>                       change your name
settings                               open settings
clear                                  clear this output
anything else searches google · ↑↓ history · tab completes · ctrl+enter opens in a new tab`;

const cmdInput = document.getElementById("cmd");
const output = document.getElementById("output");

let history = loadHistory();
let historyPos = history.length;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? [];
  } catch {
    return [];
  }
}

function pushHistory(line) {
  if (history[history.length - 1] !== line) history.push(line);
  history = history.slice(-HISTORY_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  historyPos = history.length;
}

function print(text) {
  output.textContent = text;
}

function go(url, newTab) {
  if (newTab) {
    window.open(url, "_blank", "noopener");
    print("→ opened in a new tab");
  } else {
    location.href = url;
  }
}

function searchUrl(engine, query) {
  return SEARCH_ENGINES[engine].replace("%s", encodeURIComponent(query));
}

// "vk.com", "github.com/aoqyy", "https://..." but not "hello world"
function looksLikeUrl(text) {
  return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i.test(text);
}

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d;
}

// first change from the terminal turns the demo into the user's own page
function ensureOwnData() {
  if (!data.demo) return "";
  data.deadlines = [];
  data.links = [];
  data.demo = false;
  $("demo-badge").hidden = true;
  return "\n→ demo cleared, this page is yours now";
}

function save() {
  saveData(data);
  tick();
}

const COMMANDS = {
  help: () => HELP,
  clear: () => "",
  cls: () => "",

  settings() {
    openSettings();
    return "";
  },

  add(args) {
    const [when, ...rest] = args;
    const title = rest.join(" ");
    if (!when || !title) return "✗ usage: add <YYYY-MM-DD | +days> <title>";

    const date = /^\+\d+$/.test(when) ? daysFromNow(Number(when.slice(1))) : when;
    if (!isValidDate(date)) return `✗ bad date: ${when}`;

    const note = ensureOwnData();
    data.deadlines.push({ date, title });
    save();
    return `✓ added "${title}" · ${whenText(daysLeft(date, new Date()))}${note}`;
  },

  done(args) {
    const query = args.join(" ").toLowerCase();
    if (!query) return "✗ usage: done <title>";
    if (data.demo) return "✗ these are demo deadlines, add your own with add";

    const exact = data.deadlines.filter((d) => d.title.toLowerCase() === query);
    const matches = exact.length
      ? exact
      : data.deadlines.filter((d) => d.title.toLowerCase().includes(query));

    if (!matches.length) return `✗ no deadline matching "${query}"`;
    if (matches.length > 1) return `✗ which one? ${matches.map((d) => d.title).join(", ")}`;

    data.deadlines = data.deadlines.filter((d) => d !== matches[0]);
    save();
    return `✓ done: ${matches[0].title}`;
  },

  weather(args) {
    const city = args.join(" ");
    if (!city) return `→ ${data.city.name}`;

    const note = ensureOwnData();
    data.city = { name: city }; // coordinates are looked up by the weather widget
    save();
    updateWeather($("weather"), data);
    return `→ loading weather for ${city}${note}`;
  },

  name(args) {
    const name = args.join(" ").slice(0, 20);
    if (!name) return "✗ usage: name <name>";

    const note = ensureOwnData();
    data.name = name;
    save();
    $("path").textContent = `C:\\${data.name}\\motd`;
    return `✓ hi, ${name}.${note}`;
  },
};

function run(line, newTab) {
  const input = line.trim();
  if (!input) return;
  pushHistory(input);

  const [head, ...args] = input.split(/\s+/);
  const key = head.toLowerCase();

  if (Object.hasOwn(COMMANDS, key)) {
    print(COMMANDS[key](args));
    return;
  }

  if (Object.hasOwn(SEARCH_ENGINES, key) && args.length) {
    go(searchUrl(key, args.join(" ")), newTab);
    return;
  }

  const link = data.links.find((l) => l.title.toLowerCase() === input.toLowerCase());
  const linkUrl = link && safeUrl(link.url);
  if (linkUrl) {
    go(linkUrl, newTab);
    return;
  }

  const directUrl = looksLikeUrl(input) && safeUrl(input);
  if (directUrl) {
    go(directUrl, newTab);
    return;
  }

  go(searchUrl(DEFAULT_ENGINE, input), newTab);
}

// full-line suggestions for what is typed so far
function completions(value) {
  const lower = value.toLowerCase();

  if (lower.startsWith("done ")) {
    return data.deadlines
      .map((d) => `done ${d.title}`)
      .filter((s) => s.toLowerCase().startsWith(lower));
  }

  if (/\s/.test(value)) return [];

  const words = [
    ...Object.keys(COMMANDS).filter((c) => c !== "cls"),
    ...Object.keys(SEARCH_ENGINES),
    ...data.links.map((l) => l.title),
  ];
  return words.filter((w) => w.toLowerCase().startsWith(lower));
}

function commonPrefix(list) {
  let prefix = list[0];
  for (const s of list) {
    while (!s.toLowerCase().startsWith(prefix.toLowerCase())) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

function complete() {
  const options = [...new Set(completions(cmdInput.value))];
  if (!options.length) return;

  if (options.length === 1) {
    cmdInput.value = `${options[0]} `;
    print("");
    return;
  }

  const prefix = commonPrefix(options);
  if (prefix.length > cmdInput.value.length) cmdInput.value = prefix;
  print(options.join("   "));
}

cmdInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const line = cmdInput.value;
    cmdInput.value = "";
    run(line, e.ctrlKey || e.metaKey);
  } else if (e.key === "Tab" && cmdInput.value) {
    // empty input: let Tab move focus as usual
    e.preventDefault();
    complete();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (historyPos > 0) cmdInput.value = history[--historyPos];
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    historyPos = Math.min(history.length, historyPos + 1);
    cmdInput.value = history[historyPos] ?? "";
  } else if (e.key === "Escape") {
    cmdInput.value = "";
    print("");
  }
});

// typing anywhere on the page goes to the terminal
document.addEventListener("keydown", (e) => {
  if (document.querySelector("dialog[open]")) return;
  if (e.target === cmdInput || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === " " && e.target !== document.body) return; // keep space for buttons and links
  if (e.key.length === 1) cmdInput.focus();
});