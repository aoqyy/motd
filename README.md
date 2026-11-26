# motd

**m**essage **o**f **t**he **d**ay: a minimal terminal-style start page for your browser.
Type commands, search anything, keep your deadlines, weather and links in one place.
No accounts, no server, your data never leaves your browser.

**[→ live demo](https://aoqyy.github.io/motd/)**

![motd screenshot](docs/screenshot.png)

## Terminal

The header is a real command line. Just start typing, the page is focused on it from the start.

```
C:\aoki\motd> yt lofi hip hop
```

| command                                                   | what it does                                               |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| `g` `gh` `yt` `w` `r` `ani` + query                       | search Google, GitHub, YouTube, Wikipedia, Reddit, AniList |
| `github`                                                  | open a saved link by its name                              |
| `example.com`                                             | open a url                                                 |
| anything else                                             | search Google                                              |
| `add 2026-12-25 exam` / `add +3 report`                   | add a deadline by date or in N days                        |
| `done exam`                                               | remove a deadline, part of the title is enough             |
| `weather tokyo`                                           | change the city                                            |
| `name aoki`                                               | change your name                                           |
| `settings` · `help` · `clear`                             | open settings · show help · clear output                   |
| `prefix` · `prefix add so <url with %s>` · `prefix rm so` | list, add or remove your own search prefixes               |

- dim inline suggestions from your history and commands, accept with `Tab` or `→`
- `↑` `↓` to walk through history
- `Ctrl+Enter` opens the result in a new tab, `Esc` clears the line
- press any key anywhere on the page to jump back to the terminal

## Widgets

- **clock**: time, date, a greeting for the time of day and a short summary: weather, what's due today, next deadline
- **progress**: how much of the day, week, month and year has passed
- **deadlines**: sorted by date with a countdown, urgent ones highlighted, overdue struck through
- **weather**: any city via [Open-Meteo](https://open-meteo.com), cached for 30 minutes, works offline with the last known data
- **links**: your quick links in one row

Plus a **settings** dialog to edit everything at once, with export / import of a JSON backup.
Dark and light theme follow your system.

## Privacy

Everything you enter is stored in your browser's `localStorage`.
The repository only contains code and demo data, so anyone opening the page sees the demo until they add their own data.
Use `[export]` in settings to back up your data or move it to another browser.

## Usage

1. Open the [live demo](https://aoqyy.github.io/motd/)
2. Type `name <your name>`, `weather <your city>` and `add +3 something`, or click `[settings]` to fill everything at once
3. Set the page as your browser's home / startup page

Or run it locally: clone the repo and open `index.html`. No build step, no dependencies.

## Structure

```
index.html        page layout, terminal and settings dialog
style.css         all styles
data.example.js   demo data
storage.js        load / save to localStorage
settings.js       settings dialog, export / import
terminal.js       command line: commands, search, history, suggestions
app.js            starts widgets and the update loop
widgets/          one file per widget
```

## Roadmap

- [x] terminal with search prefixes, history and suggestions
- [x] custom search prefixes in settings
- [ ] scratch note
- [ ] GitHub contributions
- [ ] toggle and reorder widgets
- [ ] browser extension for the new tab page

## Credits

Weather by [Open-Meteo](https://open-meteo.com) · font [JetBrains Mono](https://www.jetbrains.com/lp/mono/)

## License

[MIT](LICENSE)
