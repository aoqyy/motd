// "github.com" -> "https://github.com"; anything that isn't http(s) is dropped
function safeUrl(raw) {
  const url = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

function initLinks(el) {
  el.innerHTML = `<h2>links</h2><nav class="links"></nav>`;
}

function renderLinks(el, data) {
  const nav = el.querySelector(".links");
  const links = data.links
    .map((l) => ({ title: l.title, href: safeUrl(l.url) }))
    .filter((l) => l.href);

  if (!links.length) {
    nav.innerHTML = `<span class="muted">// empty, add some in [settings]</span>`;
    return;
  }

  nav.replaceChildren(...links.map(({ title, href }) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = `[${title}]`;
    return a;
  }));
}