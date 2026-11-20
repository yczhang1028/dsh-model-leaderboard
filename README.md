# Model leaderboard

A DSH bundle that adds a **Model leaderboard** panel to the left sidebar. It answers
"which model should I use, and what will it cost" from live data instead of from
memory.

## Boards

The first tab groups models into ranked categories, one board at a time:

| Board | Ranks by | Source |
|---|---|---|
| **Most popular** | Tokens routed through OpenRouter over the last seven completed UTC days | `/api/v1/datasets/rankings-daily` |
| **Trending** | Excess token growth: the last seven days against the seven before them | same dataset, 14-day window |
| **Newest** | The release date OpenRouter records for the model | `/api/v1/models` |
| **Strongest** | Artificial Analysis intelligence index | `/api/v1/benchmarks?source=artificial-analysis` |
| **Best at coding** | Artificial Analysis coding index | same |
| **Best at agentic work** | Artificial Analysis agentic index | same |
| **Best value** | Intelligence index per blended dollar | benchmarks + catalog pricing |
| **Cheapest** | Lowest blended price per million tokens | `/api/v1/models` |
| **Largest context** | Largest advertised context window | `/api/v1/models` |

A model that just launched has no baseline, so its whole volume counts as growth
and it tops **Trending** — which is what a trending board should show.

## Other tabs

- **Value** — intelligence index against blended price as a scatter chart, plus a
  ranked table with a capability-per-dollar score.
- **Quality** — the three Artificial Analysis indices as bar charts and a table,
  and Design Arena head-to-head Elo with a **category selector**. Elo is only
  comparable inside one category, so the selector drives the table's Elo and win
  rate columns as well as the chart.
- **Usage** — the seven-day token ranking with a per-day sparkline and growth
  column, plus the traffic split by task classification.
- **All models** — every advertised model with list prices per million tokens,
  context length, release date and intelligence index, filterable by free text
  and by **vendor**, with an expandable per-provider price, uptime, latency and
  throughput breakdown.

Every row carries an **In DSH** badge with three states:

- `available` — this profile's `llm` adapter advertises that exact route.
- `variant differs` — a `:free` or `:batch` row whose variant this catalog does
  not carry, so the plain route would be used. That is a different model at a
  different price, so the badge warns instead of claiming availability, and
  **Set default** says which route it actually wrote.
- `not in catalog` — DSH cannot route it. The row is still shown for comparison.

Ranking permaslugs carry a `-YYYYMMDD` date the catalog omits, so matching strips
the date but never the variant: `vendor/model:free` and `vendor/model` are
different routes and must not collide on one lookup key.

OpenRouter sends `pricing.prompt = -1` as its "variable pricing" sentinel for
router endpoints. The Host maps any negative price to "not reported", so those
rows show a dash and sort last instead of topping every cheapest-first list.

## Sorting and filtering

Every table sorts by clicking a column header, and clicking it again reverses the
order. Rows missing the sorted value always sink to the bottom rather than
sorting as zero.

Every tab carries the same filter bar:

- **Free text** matches the model name or its id, case-insensitively and ignoring
  surrounding spaces.
- **Vendor** narrows to one author, listing the row count per vendor.
- **DSH route** selects `available`, `variant differs` or `not in catalog`, so
  "what can I actually run right now" is one click. The three states partition
  the rows exactly.
- The chip reports how many rows are on screen out of how many matched, and
  **Clear filters** resets all three.

The filter is shared across tabs, so one set on a tab is still in force on the
next; each tab keeps its own sort. On the **Boards** tab the board picks the
population and the starting order and the headers still sort, so **Cheapest** can
be flipped to most expensive. On **Value** the filter also narrows the scatter
chart, not just the table.

## Reading the scatter

The **Value** chart is interactive:

- **Scroll** zooms about the pointer, **drag** pans, **Shift+drag** draws a box
  and zooms into it, and **double-click** resets. The toolbar's `−`, `+` and
  **Reset view** do the same without a pointer.
- Zooming remaps the axis domains rather than scaling the SVG, so dots, strokes
  and text keep their size and the axes re-tick for the new window. The window is
  clamped to the data domain plus a 5% margin and never collapses below 2% of it.
- **A−** / **A+** change the model-name label size. The collision avoidance uses
  the same metric, so larger labels simply fit fewer automatic names.
- The number of automatic names rises with the zoom — 9 at full zoom-out, up to
  twice that further in — and the collision checks decide what actually fits.
  Two constants at the top of the chart code are the knobs: `LABEL_BUDGET` (9)
  and `LABEL_SLACK` (0.7, the packing buffer scale; lower packs more names in).
- **Click a point to pin its name.** A pinned name is always drawn — with a
  leader line back to its dot — even when it would otherwise lose the label
  budget, and it survives zooming, filtering and switching tabs. Pinned names
  appear as chips under the chart; click a chip or **Clear pins** to drop them.
- The toolbar chip reports how many points are inside the current view.
- The chart is a drag surface, so its labels are not text-selectable and a press
  anywhere on it never paints a native selection. Table cells, the search box and
  the model ids stay selectable, because those are what a user copies.

## Using a model

- **Set default** writes the model into the profile's `agent-default-model` row,
  so new sessions start on it. The panel sends the route DSH's catalog actually
  carries rather than the dated ranking slug, and carries the current reasoning
  effort across so a switch does not silently drop it. An effort the target model
  does not advertise is dropped rather than written, because the adapter rejects
  an unsupported effort before any provider I/O.
- **Copy id** puts the exact `vendor/model` slug on the clipboard, for the
  `/model` command or a hand-written route.

## Data and credentials

Quality, usage and trending data come from the OpenRouter Data API, which is
gated by any valid OpenRouter API key. The Host half resolves the key through
DSH's credential service under `OPENROUTER_API_KEY`, falling back to the same
environment variable; it is never sent to the browser. The public model catalog
needs no key.

Without a key the panel still renders prices, context lengths and release dates,
and explains why the ranking boards are empty.

The browser never calls `openrouter.ai` directly. The Host half fetches, caches
(30 minutes for the catalog, 10 minutes for the key-gated datasets) and serves
one assembled snapshot over the same-origin route `/model-leaderboard/api/*`. A failed
refresh keeps the previous value and reports the failure in the panel instead of
emptying it.

Rankings data is licensed CC BY 4.0 by OpenRouter; the panel carries the
attribution line.

## Appearance

The panel inherits the host theme and references only `--dsw-alias-*` tokens, so
it follows the light/dark switch and the font-size preference. Every token the
bundle references is declared by the shipped theme.

Chart marks — bars, sparklines, scatter dots, the pinned leader line and the
box-zoom marquee — use the brand-blue accent
`--dsw-alias-state-business-primary` at a soft alpha ramp. UI chrome — tabs,
buttons, board pills — stays on `--dsw-alias-brand-primary`, which is the host's
own monochrome accent, so the panel does not turn all blue.

## Turning it off

Disabling the bundle removes the sidebar entry, the panel, and the HTTP routes.
The `agent-default-model` value it wrote is ordinary profile configuration and
stays until you change it.
