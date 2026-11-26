const HISTORY_KEY = "motd:history";
const HISTORY_MAX = 50;
const DEFAULT_ENGINE = "g";

// %s is replaced with the encoded query
const BUILTIN_ENGINES = {
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
undo                                   bring back the last removed deadline
prefix    list | add <key> <url> | rm <key>
                                       e.g. prefix add so https://stackoverflow.com/search?q=%s
activity  <github username>            show your contribution grid
weather   <city>                       change city
name      <name>                       change your name
settings                               open settings
clear                                  clear this output
anything else searches google · ↑↓ history · tab or → accepts hint · ctrl+enter opens in a new tab`;

const cmdInput = document.getElementById("cmd");
const ghost = document.getElementById("cmd-ghost");
const output = document.getElementById("output");

let history = loadHistory();
let historyPos = history.length;

// deadlines removed with done, newest last; lives until the page reloads
const undoStack = [];

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(saved) ? saved.filter((s) => typeof s === "string") : [];
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

// last line of defense: never navigate to anything but http(s)
function go(url, newTab) {
  const safe = safeUrl(url);
  if (!safe) {
    print("✗ blocked: only http(s) links can be opened");
    return;
  }
  if (newTab) {
    window.open(safe, "_blank", "noopener");
    print("→ opened in a new tab");
  } else {
    location.href = safe;
  }
}

// built-in engines with the user's prefixes on top, so a custom one can override "g"
function engines() {
  const custom = data.prefixes.map((p) => [p.key.toLowerCase(), p.url]);
  return { ...BUILTIN_ENGINES, ...Object.fromEntries(custom) };
}

function isCustomPrefix(key) {
  return data.prefixes.some((p) => p.key.toLowerCase() === key);
}

function searchUrl(engine, query) {
  return engines()[engine].replace("%s", encodeURIComponent(query));
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
  data.github = "";
  data.demo = false;
  $("demo-badge").hidden = true;
  renderLinks($("links"), data);
  updateActivity($("activity"), data);
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

    const removed = matches[0];
    data.deadlines = data.deadlines.filter((d) => d !== removed);
    undoStack.push(removed);
    save();
    return `✓ done: ${removed.title} · undo to bring it back`;
  },

  undo() {
    const restored = undoStack.pop();
    if (!restored) return "✗ nothing to undo";

    data.deadlines.push(restored);
    save();
    const more = undoStack.length ? ` · ${undoStack.length} more to undo` : "";
    return `✓ restored "${restored.title}" · ${whenText(daysLeft(restored.date, new Date()))}${more}`;
  },

  prefix(args) {
    const [action = "list", rawKey, url] = args;
    const key = rawKey?.toLowerCase();

    if (action === "list") {
      return Object.entries(engines())
        .map(([k, u]) => `${k.padEnd(6)} ${u}${isCustomPrefix(k) ? "   *custom" : ""}`)
        .join("\n");
    }

    if (action === "add") {
      if (!key || !url) return "✗ usage: prefix add <key> <url with %s>";
      if (!/^[a-z0-9-]+$/.test(key)) return "✗ key can only have letters, digits and -";
      if (Object.hasOwn(COMMANDS, key)) return `✗ "${key}" is a command`;
      if (!url.includes("%s") || !safeUrl(url)) return "✗ url must be http(s) and contain %s";

      const note = ensureOwnData();
      data.prefixes = data.prefixes.filter((p) => p.key.toLowerCase() !== key);
      data.prefixes.push({ key, url: safeUrl(url) });
      save();
      const overrides = Object.hasOwn(BUILTIN_ENGINES, key) ? " (overrides built-in)" : "";
      return `✓ ${key} → ${url}${overrides}${note}`;
    }

    if (action === "rm") {
      if (!key) return "✗ usage: prefix rm <key>";
      if (!isCustomPrefix(key)) {
        return Object.hasOwn(BUILTIN_ENGINES, key) ? `✗ "${key}" is built in` : `✗ no prefix "${key}"`;
      }
      data.prefixes = data.prefixes.filter((p) => p.key.toLowerCase() !== key);
      save();
      const restored = Object.hasOwn(BUILTIN_ENGINES, key) ? ", built-in restored" : "";
      return `✓ removed ${key}${restored}`;
    }

    return "✗ usage: prefix [list | add <key> <url> | rm <key>]";
  },

  activity(args) {
    if (!args.length) {
      return data.github ? `→ @${data.github}` : "✗ usage: activity <github username>";
    }
    const user = cleanGithubUser(args[0]);
    if (!user) return `✗ not a github username: ${args[0]}`;

    const note = ensureOwnData();
    data.github = user;
    save();
    updateActivity($("activity"), data);
    return `→ loading activity for @${user}${note}`;
  },

  weather(args) {
    const city = args.join(" ").slice(0, 100);
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

  if (Object.hasOwn(engines(), key) && args.length) {
    go(searchUrl(key, args.join(" ")), newTab);
    return;
  }

  const link = data.links.find((l) => l.title.toLowerCase() === input.toLowerCase());
  if (link) {
    go(link.url, newTab);
    return;
  }

  if (looksLikeUrl(input)) {
    go(input, newTab);
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

  if (lower.startsWith("prefix ")) {
    const options = [
      "prefix list",
      "prefix add ",
      ...data.prefixes.map((p) => `prefix rm ${p.key}`),
    ];
    return options.filter((s) => s.startsWith(lower));
  }

  if (/\s/.test(value)) return [];

  const words = [
    ...Object.keys(COMMANDS).filter((c) => c !== "cls"),
    ...Object.keys(engines()),
    ...data.links.map((l) => l.title),
  ];
  return words.filter((w) => w.toLowerCase().startsWith(lower));
}

// best single guess: latest matching history entry first, then completions
function suggestion(value) {
  if (!value) return "";
  const lower = value.toLowerCase();
  const longer = (s) => s.length > value.length && s.toLowerCase().startsWith(lower);

  for (let i = history.length - 1; i >= 0; i--) {
    if (longer(history[i])) return history[i];
  }
  return completions(value).find(longer) ?? "";
}

function updateGhost() {
  const value = cmdInput.value;
  const hint = suggestion(value);

  // hide when the caret isn't at the end or the text is scrolled
  const atEnd = cmdInput.selectionStart === value.length;
  if (!hint || !atEnd || cmdInput.scrollLeft > 0) {
    ghost.replaceChildren();
    return;
  }

  const typed = document.createElement("span");
  typed.className = "cmd-ghost__typed";
  typed.textContent = value;
  ghost.replaceChildren(typed, hint.slice(value.length));
}

function acceptHint() {
  const hint = suggestion(cmdInput.value);
  if (!hint) return false;
  cmdInput.value = hint;
  updateGhost();
  return true;
}

function complete() {
  const options = [...new Set(completions(cmdInput.value))];
  acceptHint();
  print(options.length > 1 ? options.join("   ") : "");
}

cmdInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const line = cmdInput.value;
    cmdInput.value = "";
    updateGhost();
    run(line, e.ctrlKey || e.metaKey);
  } else if (e.key === "Tab" && cmdInput.value) {
    // empty input: let Tab move focus as usual
    e.preventDefault();
    complete();
  } else if (e.key === "ArrowRight" && cmdInput.selectionStart === cmdInput.value.length) {
    if (acceptHint()) e.preventDefault();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (historyPos > 0) cmdInput.value = history[--historyPos];
    updateGhost();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    historyPos = Math.min(history.length, historyPos + 1);
    cmdInput.value = history[historyPos] ?? "";
    updateGhost();
  } else if (e.key === "Escape") {
    cmdInput.value = "";
    updateGhost();
    print("");
  }
});

cmdInput.addEventListener("input", updateGhost);
cmdInput.addEventListener("click", updateGhost);
cmdInput.addEventListener("blur", () => ghost.replaceChildren());
cmdInput.addEventListener("focus", updateGhost);

// typing anywhere on the page goes to the terminal
document.addEventListener("keydown", (e) => {
  if (document.querySelector("dialog[open]")) return;
  if (e.target === cmdInput || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === " " && e.target !== document.body) return; // keep space for buttons and links
  if (e.key.length === 1) cmdInput.focus();
});