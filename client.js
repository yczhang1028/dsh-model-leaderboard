/**
 * Client half of the Model leaderboard bundle.
 *
 * Registers one global panel icon in `sidebar.panellist` and the matching
 * central panel in `main`, both under the id `model-leaderboard`. The panel reads
 * the assembled snapshot from its own Host half over a same-origin route and
 * renders category boards, comparison tables and SVG charts drawn from theme
 * tokens.
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-model-leaderboard',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Set by `apply`; the panel reads locale through it. */
    let pluginCtx = null

    /** Keeps the scatter's SVG gradient id unique per mounted chart. */
    let chartSeq = 0

    const EN = {
      'panel.title': 'Model leaderboard',
      'panel.subtitle': 'Live OpenRouter rankings, quality and price',
      'panel.loading': 'Loading rankings…',
      'panel.refresh': 'Refresh',
      'panel.refreshing': 'Refreshing…',
      'panel.retry': 'Retry',
      'panel.generated': 'Updated',
      'panel.current': 'Default model',
      'panel.none': 'not set',
      'stat.models': 'Models tracked',
      'stat.categories': 'Design Arena categories',
      'stat.effort': 'effort',
      'stat.tokens': 'tokens',
      'stat.showing': 'showing',
      'stat.of': 'of',
      'source.models': 'Model catalog',
      'source.artificialAnalysis': 'Artificial Analysis',
      'source.designArena': 'Design Arena',
      'source.usage': 'Usage rankings',
      'source.classifications': 'Task classifications',
      'panel.noKey': 'No OpenRouter API key found, so quality, usage and trending boards are unavailable. Add one under Settings → Models, then refresh.',
      'panel.empty': 'No data for this view yet.',
      'panel.error': 'Could not load rankings',
      'tab.boards': 'Boards',
      'tab.value': 'Value',
      'tab.quality': 'Quality',
      'tab.usage': 'Usage',
      'tab.price': 'All models',
      'col.rank': '#',
      'col.model': 'Model',
      'col.metric': 'Metric',
      'col.score': 'Score',
      'col.intelligence': 'Intelligence',
      'col.coding': 'Coding',
      'col.agentic': 'Agentic',
      'col.elo': 'Elo',
      'col.winRate': 'Win rate',
      'col.priceIn': 'In $/M',
      'col.priceOut': 'Out $/M',
      'col.blended': 'Blended $/M',
      'col.context': 'Context',
      'col.tokens': 'Tokens 7d',
      'col.trend': '7d',
      'col.status': 'In DSH',
      'col.actions': 'Use',
      'board.popular': 'Most popular',
      'board.popularHint': 'Total tokens routed through OpenRouter over the last seven completed UTC days.',
      'board.trending': 'Trending',
      'board.trendingHint': 'Excess token growth: the last seven days against the seven before them. A model with no baseline counts its whole volume, so a fresh launch tops this board.',
      'board.newest': 'Newest',
      'board.newestHint': 'By the release date OpenRouter records for the model.',
      'board.strongest': 'Strongest',
      'board.strongestHint': 'Artificial Analysis intelligence index.',
      'board.coding': 'Best at coding',
      'board.codingHint': 'Artificial Analysis coding index.',
      'board.agentic': 'Best at agentic work',
      'board.agenticHint': 'Artificial Analysis agentic index.',
      'board.value': 'Best value',
      'board.valueHint': 'Intelligence index per blended dollar.',
      'board.cheapest': 'Cheapest',
      'board.cheapestHint': 'Lowest blended price per million tokens.',
      'board.context': 'Largest context',
      'board.contextHint': 'Largest advertised context window.',
      'board.elo': 'Design Arena Elo',
      'board.eloHint': 'Head-to-head Elo within one Design Arena category.',
      'value.explainer': 'Score is the intelligence index per blended dollar: higher means more capability per dollar. Blended price weights input tokens 3:1 against output.',
      'chart.zoomIn': 'Zoom in',
      'chart.zoomOut': 'Zoom out',
      'chart.reset': 'Reset view',
      'chart.labelSize': 'Label size',
      'chart.hint': 'Scroll to zoom · drag to pan · Shift+drag to box-zoom · double-click to reset · click a point to pin its name',
      'chart.pinned': 'Pinned',
      'chart.unpin': 'Unpin',
      'chart.clearPins': 'Clear pins',
      'chart.visible': 'In view',
      'quality.explainer': 'Artificial Analysis composite indices, plus Design Arena head-to-head Elo, which is only comparable inside one category.',
      'usage.explainer': 'Total tokens routed through OpenRouter over the last seven completed UTC days.',
      'price.explainer': 'The OpenRouter catalog merged with the ranking rows, priced per million tokens. Entries carrying a date or a variant suffix are separate routes OpenRouter ranks on their own.',
      'metric.intelligence': 'Intelligence',
      'metric.coding': 'Coding',
      'metric.agentic': 'Agentic',
      'metric.elo': 'Design Arena Elo',
      'action.setDefault': 'Set default',
      'action.copyId': 'Copy id',
      'action.copied': 'Copied',
      'action.expand': 'Providers',
      'action.collapse': 'Hide providers',
      'badge.available': 'available',
      'badge.unavailable': 'not in catalog',
      'badge.variant': 'variant differs',
      'msg.setOk': 'Default model set to',
      'msg.setUnrouted': 'Set, but this DSH catalog does not advertise that model, so a request may fail. Check Settings → Models.',
      'msg.setVariant': 'That row is a variant this DSH catalog does not carry, so the plain route was set instead of',
      'msg.setFailed': 'Could not set the default model',
      'msg.copyFailed': 'Could not copy to the clipboard',
      'search.placeholder': 'Filter by name or id',
      'filter.vendor': 'Vendor',
      'filter.all': 'All vendors',
      'filter.route': 'DSH route',
      'filter.routeAll': 'Any route',
      'filter.reset': 'Clear filters',
      'filter.category': 'Category',
      'providers.title': 'Providers serving this model',
      'providers.provider': 'Provider',
      'providers.quant': 'Quant',
      'providers.uptime': 'Uptime 1d',
      'providers.latency': 'Latency',
      'providers.throughput': 'Throughput',
      'providers.none': 'No provider detail available.',
      'providers.loading': 'Loading providers…',
      'tasks.title': 'Traffic by task',
      'tasks.share': 'share of requests',
      'source.failed': 'source failed',
      'attribution': 'Rankings data: OpenRouter (openrouter.ai/rankings).',
    }

    const ZH = {
      'panel.title': '模型排行榜',
      'panel.subtitle': 'OpenRouter 实时排名、质量与价格',
      'panel.loading': '正在加载排名…',
      'panel.refresh': '刷新',
      'panel.refreshing': '刷新中…',
      'panel.retry': '重试',
      'panel.generated': '更新于',
      'panel.current': '默认模型',
      'panel.none': '未设置',
      'stat.models': '收录模型',
      'stat.categories': 'Design Arena 类别',
      'stat.effort': '推理档位',
      'stat.tokens': 'token',
      'stat.showing': '显示',
      'stat.of': '共',
      'source.models': '模型目录',
      'source.artificialAnalysis': 'Artificial Analysis',
      'source.designArena': 'Design Arena',
      'source.usage': '用量排行',
      'source.classifications': '任务分类',
      'panel.noKey': '没有找到 OpenRouter API key，质量榜、用量榜和趋势榜都不可用。请在 设置 → 模型 里添加，然后刷新。',
      'panel.empty': '这个视图暂时没有数据。',
      'panel.error': '排名加载失败',
      'tab.boards': '分类榜单',
      'tab.value': '性价比',
      'tab.quality': '质量天梯',
      'tab.usage': '用量排行',
      'tab.price': '全部模型',
      'col.rank': '#',
      'col.model': '模型',
      'col.metric': '指标',
      'col.score': '得分',
      'col.intelligence': '智能指数',
      'col.coding': '编码指数',
      'col.agentic': 'Agent 指数',
      'col.elo': 'Elo',
      'col.winRate': '胜率',
      'col.priceIn': '输入 $/M',
      'col.priceOut': '输出 $/M',
      'col.blended': '混合 $/M',
      'col.context': '上下文',
      'col.tokens': '7 天 token',
      'col.trend': '7 天',
      'col.status': 'DSH 可用',
      'col.actions': '使用',
      'board.popular': '最流行',
      'board.popularHint': '最近 7 个完整 UTC 日经 OpenRouter 路由的总 token 量。',
      'board.trending': '趋势上升',
      'board.trendingHint': '增量：最近 7 天相对前 7 天的 token 增长量。没有基线的模型会把全部用量算作增长，所以新发布的模型会排在前面。',
      'board.newest': '最新发布',
      'board.newestHint': '按 OpenRouter 记录的模型发布时间排序。',
      'board.strongest': '最强',
      'board.strongestHint': 'Artificial Analysis 智能指数。',
      'board.coding': '编码最强',
      'board.codingHint': 'Artificial Analysis 编码指数。',
      'board.agentic': 'Agent 最强',
      'board.agenticHint': 'Artificial Analysis Agent 指数。',
      'board.value': '最划算',
      'board.valueHint': '每美元混合价格买到的智能指数。',
      'board.cheapest': '最便宜',
      'board.cheapestHint': '每百万 token 混合价格最低。',
      'board.context': '上下文最大',
      'board.contextHint': '标称上下文窗口最大。',
      'board.elo': 'Design Arena Elo',
      'board.eloHint': '同一 Design Arena 类别内的对战 Elo。',
      'value.explainer': '得分 = 智能指数 ÷ 混合美元价，越高代表每美元买到的能力越多。混合价按输入:输出 = 3:1 加权。',
      'chart.zoomIn': '放大',
      'chart.zoomOut': '缩小',
      'chart.reset': '重置视图',
      'chart.labelSize': '标签字号',
      'chart.hint': '滚轮缩放 · 拖动平移 · Shift+拖动框选放大 · 双击重置 · 点击圆点固定名称',
      'chart.pinned': '已固定',
      'chart.unpin': '取消固定',
      'chart.clearPins': '清除固定',
      'chart.visible': '视野内',
      'quality.explainer': 'Artificial Analysis 综合指数，以及 Design Arena 对战 Elo —— Elo 只在同一类别内可比。',
      'usage.explainer': '最近 7 个完整 UTC 日经 OpenRouter 路由的总 token 量。',
      'price.explainer': 'OpenRouter 模型目录与各榜单行合并后的结果，价格为每百万 token。带日期或变体后缀的行是 OpenRouter 单独排名的路由。',
      'metric.intelligence': '智能指数',
      'metric.coding': '编码指数',
      'metric.agentic': 'Agent 指数',
      'metric.elo': 'Design Arena Elo',
      'action.setDefault': '设为默认',
      'action.copyId': '复制 ID',
      'action.copied': '已复制',
      'action.expand': '供应商',
      'action.collapse': '收起供应商',
      'badge.available': '可用',
      'badge.unavailable': '不在 catalog',
      'badge.variant': '变体不同',
      'msg.setOk': '默认模型已设为',
      'msg.setUnrouted': '已设置，但当前 DSH catalog 没有收录该模型，请求可能失败。请检查 设置 → 模型。',
      'msg.setVariant': '该行是当前 DSH catalog 没有收录的变体，因此改为设置普通路由：',
      'msg.setFailed': '设置默认模型失败',
      'msg.copyFailed': '复制到剪贴板失败',
      'search.placeholder': '按名称或 ID 过滤',
      'filter.vendor': '厂商',
      'filter.all': '全部厂商',
      'filter.route': 'DSH 路由',
      'filter.routeAll': '全部路由',
      'filter.reset': '清除筛选',
      'filter.category': '类别',
      'providers.title': '提供该模型的供应商',
      'providers.provider': '供应商',
      'providers.quant': '量化',
      'providers.uptime': '1 天可用率',
      'providers.latency': '延迟',
      'providers.throughput': '吞吐',
      'providers.none': '没有供应商明细。',
      'providers.loading': '正在加载供应商…',
      'tasks.title': '按任务的流量份额',
      'tasks.share': '请求占比',
      'source.failed': '数据源失败',
      'attribution': '排名数据来源：OpenRouter (openrouter.ai/rankings)。',
    }

    const CSS = `
.ml-root {
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  background:
    radial-gradient(1100px 380px at 12% -8%, color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent), transparent 68%),
    radial-gradient(900px 320px at 92% 4%, color-mix(in srgb, var(--dsw-alias-brand-primary) 4%, transparent), transparent 70%),
    var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.ml-shell { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 28px; box-sizing: border-box; }

/* Chrome text is not content: dragging across a control must not paint a native
   selection over it. Table cells, search inputs and the model ids stay
   selectable, because those are the things a user copies. */
.ml-btn, .ml-tab, .ml-board, .ml-pin, .ml-chip, .ml-badge,
.ml-stat-label, .ml-stat-sub, .ml-legend, .ml-hint, .ml-pins-label {
  user-select: none;
  -webkit-user-select: none;
}

.ml-topbar {
  position: sticky; top: 0; z-index: 5;
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 80%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  border-bottom: 1px solid var(--dsw-alias-border-l2);
}
.ml-topbar .ml-shell { display: flex; align-items: center; gap: 14px; padding-top: 13px; padding-bottom: 13px; }
[data-platform='darwin'] .ml-topbar .ml-shell { padding-top: calc(13px + var(--dsh-frame-top-clearance, 0px)); }
.ml-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ml-mark {
  width: 34px; height: 34px; flex: none; border-radius: 10px;
  display: grid; place-items: center;
  color: var(--dsw-alias-label-primary-foreground);
  background: var(--dsw-alias-button-primary-fill);
  box-shadow: 0 8px 20px -12px color-mix(in srgb, var(--dsw-alias-brand-primary) 90%, transparent);
}
.ml-title { font-size: 16px; font-weight: 650; margin: 0; letter-spacing: -0.011em; }
.ml-sub { color: var(--dsw-alias-label-secondary); margin: 1px 0 0; font-size: 12px; }
.ml-head-actions { margin-left: auto; display: flex; align-items: center; gap: 10px; }

.ml-btn {
  font: inherit; font-size: 12.5px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-card-fill);
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 8px; padding: 5px 12px; cursor: pointer;
  transition: background .16s ease, border-color .16s ease, color .16s ease, transform .12s ease;
}
.ml-btn:active { transform: scale(.97); }
.ml-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.ml-btn:disabled { opacity: .45; cursor: default; transform: none; }
.ml-btn-primary {
  color: var(--dsw-alias-label-primary-foreground);
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill);
}
.ml-btn-primary:hover { background: var(--dsw-alias-button-primary-hover); border-color: transparent; }
@media (hover: hover) {
  .ml-btn:hover { background: var(--dsw-alias-card-fill-hover); border-color: var(--dsw-alias-border-l4); }
  .ml-btn-primary:hover { background: var(--dsw-alias-button-primary-hover); }
}

.ml-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin: 20px 0 2px; }
.ml-stat {
  min-width: 0;
  background: var(--dsw-alias-card-fill);
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 12px; padding: 10px 14px;
  transition: background .18s ease, border-color .18s ease, transform .18s ease;
}
.ml-stat-label { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; letter-spacing: .07em; text-transform: uppercase; }
.ml-stat-value { font-size: 15px; font-weight: 600; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ml-stat-sub { color: var(--dsw-alias-label-secondary); font-size: 11px; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (hover: hover) {
  .ml-stat:hover {
    background: var(--dsw-alias-card-fill-hover);
    border-color: var(--dsw-alias-border-l4);
    transform: translateY(-1px);
  }
}

.ml-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--dsw-alias-card-fill);
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 999px; padding: 3px 11px;
  color: var(--dsw-alias-label-secondary); font-size: 12px;
}
.ml-chip strong { color: var(--dsw-alias-label-primary); font-weight: 600; font-variant-numeric: tabular-nums; }

.ml-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin: 22px 0 0; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.ml-tab {
  position: relative;
  font: inherit; font-size: 13px; background: none; border: none; cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  padding: 9px 14px 11px; border-radius: 8px 8px 0 0;
  transition: color .16s ease, background .16s ease;
}
.ml-tab::after {
  content: ''; position: absolute; left: 12px; right: 12px; bottom: -1px; height: 2px;
  background: var(--dsw-alias-brand-primary); border-radius: 2px;
  transform: scaleX(0); transform-origin: center;
  transition: transform .24s cubic-bezier(.22, 1, .36, 1);
}
.ml-tab:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.ml-tab[aria-selected="true"] { color: var(--dsw-alias-label-primary); font-weight: 600; }
.ml-tab[aria-selected="true"]::after { transform: scaleX(1); }
@media (hover: hover) {
  .ml-tab:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-hover); }
}

.ml-boards { display: flex; gap: 8px; flex-wrap: wrap; margin: 18px 0 4px; }
.ml-board {
  font: inherit; font-size: 12.5px; cursor: pointer;
  background: var(--dsw-alias-card-fill);
  color: var(--dsw-alias-label-secondary);
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 999px; padding: 5px 14px;
  transition: background .18s ease, color .18s ease, border-color .18s ease, transform .12s ease, box-shadow .18s ease;
}
.ml-board:active { transform: scale(.97); }
.ml-board:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.ml-board[aria-pressed="true"] {
  color: var(--dsw-alias-label-primary-foreground); font-weight: 600; border-color: transparent;
  background: var(--dsw-alias-button-primary-fill);
  box-shadow: 0 8px 20px -12px color-mix(in srgb, var(--dsw-alias-brand-primary) 90%, transparent);
}
@media (hover: hover) {
  .ml-board:hover {
    color: var(--dsw-alias-label-primary);
    background: var(--dsw-alias-card-fill-hover);
    border-color: var(--dsw-alias-border-l4);
    transform: translateY(-1px);
  }
  .ml-board[aria-pressed="true"]:hover { background: var(--dsw-alias-button-primary-hover); }
}

.ml-note { color: var(--dsw-alias-label-secondary); margin: 10px 0 0; }
.ml-notice {
  border-radius: 10px; padding: 10px 14px; margin: 12px 0;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-card-fill);
  border: 1px solid var(--dsw-alias-border-l3);
  animation: ml-rise .28s cubic-bezier(.22, 1, .36, 1) both;
}
.ml-notice-error { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 50%, transparent); }
.ml-notice-warn { color: var(--dsw-alias-state-warn-label); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 50%, transparent); }
.ml-notice-ok { border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 50%, transparent); }

.ml-card {
  background: var(--dsw-alias-card-fill);
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 14px; padding: 16px 18px; margin: 14px 0;
  animation: ml-rise .34s cubic-bezier(.22, 1, .36, 1) both;
}
.ml-card h3 { margin: 0; font-size: 13.5px; font-weight: 650; letter-spacing: -0.005em; }
.ml-card .ml-note { margin-top: 4px; }

.ml-scroll {
  max-height: 62vh; overflow: auto;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 12px;
  background: var(--dsw-alias-card-fill);
  scrollbar-color: var(--dsw-alias-scrollbar-bg-l2) transparent;
  animation: ml-rise .34s cubic-bezier(.22, 1, .36, 1) both;
}
.ml-scroll::-webkit-scrollbar-thumb { background: var(--dsw-alias-scrollbar-bg-l2); border-radius: 999px; }
.ml-scroll::-webkit-scrollbar-thumb:hover { background: var(--dsw-alias-scrollbar-hover-l2); }
table.ml-table { border-collapse: separate; border-spacing: 0; width: 100%; font-variant-numeric: tabular-nums; }
table.ml-table th, table.ml-table td {
  text-align: left; padding: 8px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  white-space: nowrap;
}
table.ml-table tbody tr:last-child td { border-bottom: none; }
table.ml-table th {
  position: sticky; top: 0; z-index: 1;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-tertiary);
  font-weight: 500; font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
  cursor: pointer;
  transition: color .16s ease;
}
table.ml-table th.ml-nosort { cursor: default; }
table.ml-table tbody tr { transition: background .14s ease; }
@media (hover: hover) {
  table.ml-table th:hover { color: var(--dsw-alias-label-primary); }
  table.ml-table tbody tr:hover { background: var(--dsw-alias-interactive-bg-hover); }
}
table.ml-table td.ml-num { text-align: right; }

.ml-model { display: flex; align-items: center; gap: 8px; }
.ml-model-name { font-weight: 500; }
.ml-model-id { color: var(--dsw-alias-label-secondary); font-size: 11px; }
.ml-badge {
  font-size: 10.5px; border-radius: 999px; padding: 2px 8px;
  color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l3);
  background: var(--dsw-alias-interactive-bg-hover);
  letter-spacing: .02em;
}
.ml-badge-ok {
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent);
}
.ml-badge-warn {
  color: var(--dsw-alias-state-warn-label);
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 50%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 14%, transparent);
}
.ml-badge-no { color: var(--dsw-alias-label-secondary); }
.ml-actions { display: flex; gap: 6px; }
.ml-actions .ml-btn { padding: 3px 9px; font-size: 12px; }

.ml-bars { display: flex; flex-direction: column; gap: 5px; margin-top: 10px; }
.ml-bar-row { display: grid; grid-template-columns: 220px 1fr 84px; align-items: center; gap: 12px; }
.ml-bar-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ml-bar-track { background: var(--dsw-alias-interactive-bg-hover); border-radius: 5px; height: 12px; overflow: hidden; }
.ml-bar-fill {
  height: 100%; border-radius: 5px;
  /* The host's monochrome brand fill is a wall of black across 27 bars, so the
     chart marks use the brand-blue accent at a soft alpha instead. UI chrome
     (tabs, buttons, pills) stays neutral so the panel does not turn all blue. */
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--dsw-alias-state-business-primary) 48%, transparent),
    color-mix(in srgb, var(--dsw-alias-state-business-primary) 88%, transparent));
  transform-origin: left center;
  animation: ml-grow .55s cubic-bezier(.22, 1, .36, 1) both;
}
.ml-bar-value { text-align: right; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }

.ml-chart {
  width: 100%; height: auto; display: block;
  cursor: grab;
  /* The chart is a drag surface: its labels are not text to select, and a native
     selection would fight the pan and paint the labels blue. */
  user-select: none;
  -webkit-user-select: none;
  animation: ml-fade .45s ease both;
}
.ml-chart:active { cursor: grabbing; }
.ml-chart-zoomed { border-radius: 8px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, transparent); }
.ml-chart-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 12px 0 8px;
  user-select: none;
  -webkit-user-select: none;
}
.ml-chart-bar .ml-btn { padding: 3px 9px; font-size: 12px; }
.ml-chart-sep { width: 1px; height: 18px; background: var(--dsw-alias-border-l2); }
.ml-hint { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; margin-left: auto; }
.ml-marquee {
  fill: color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);
  stroke: var(--dsw-alias-state-business-primary);
  stroke-width: 1; stroke-dasharray: 4 3;
  pointer-events: none;
}
.ml-axis { stroke: var(--dsw-alias-border-l3); stroke-width: 1; }
.ml-grid { stroke: var(--dsw-alias-border-l2); stroke-width: 1; }
.ml-tick { fill: var(--dsw-alias-label-tertiary); font-size: 11px; font-variant-numeric: tabular-nums; }
.ml-tick-mark { stroke: var(--dsw-alias-border-l3); stroke-width: 1; }
.ml-axis-title { fill: var(--dsw-alias-label-secondary); font-size: 11.5px; letter-spacing: .05em; }
.ml-point {
  animation: ml-pop .42s cubic-bezier(.22, 1, .36, 1) both;
  transform-box: fill-box; transform-origin: center;
}
.ml-halo {
  fill: var(--dsw-alias-state-business-primary); opacity: .18;
  transform-box: fill-box; transform-origin: center;
  transition: opacity .2s ease, transform .22s cubic-bezier(.22, 1, .36, 1);
}
.ml-halo-off { fill: var(--dsw-alias-state-idle-primary); opacity: .16; }
.ml-hit { fill: transparent; }
.ml-dot {
  transition: transform .22s cubic-bezier(.22, 1, .36, 1);
  transform-box: fill-box; transform-origin: center;
}
.ml-dot-off {
  fill: var(--dsw-alias-state-idle-primary);
  transition: transform .22s cubic-bezier(.22, 1, .36, 1);
  transform-box: fill-box; transform-origin: center;
}
.ml-dot-hot { transform: scale(1.75); }
.ml-dot-label {
  fill: var(--dsw-alias-label-secondary); font-size: 10px;
  pointer-events: none;
  transition: fill .16s ease;
}
.ml-dot-label-hot { fill: var(--dsw-alias-label-primary); font-weight: 600; }
.ml-dot-label-pin { fill: var(--dsw-alias-label-primary); font-weight: 600; }
.ml-leader { stroke: var(--dsw-alias-state-business-primary); stroke-width: 1; opacity: .5; pointer-events: none; }
.ml-pins { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
.ml-pins-label { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.ml-pin {
  display: inline-flex; align-items: center; gap: 6px;
  font: inherit; font-size: 12px; cursor: pointer;
  color: var(--dsw-alias-label-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent);
  border-radius: 999px; padding: 2px 10px;
  transition: background .16s ease, border-color .16s ease;
}
.ml-pin-x { color: var(--dsw-alias-label-secondary); }
.ml-pin:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
@media (hover: hover) {
  .ml-pin:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent); }
}
.ml-tip { opacity: 0; pointer-events: none; transition: opacity .16s ease; }
.ml-tip-on { opacity: 1; }
.ml-tip-box { fill: var(--dsw-alias-tooltip-bg); stroke: var(--dsw-alias-border-l4); stroke-width: 1; }
.ml-tip-title { fill: var(--dsw-alias-tooltip-label); font-size: 12px; font-weight: 600; }
.ml-tip-line { fill: var(--dsw-alias-tooltip-label); opacity: .78; font-size: 11px; font-variant-numeric: tabular-nums; }
@media (hover: hover) {
  .ml-point:hover .ml-halo { opacity: .34; transform: scale(1.4); }
}
.ml-legend { display: flex; gap: 18px; align-items: center; color: var(--dsw-alias-label-secondary); margin-top: 10px; font-size: 12px; }
.ml-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.ml-legend .ml-on { background: var(--dsw-alias-state-business-primary); }
.ml-legend .ml-off { background: var(--dsw-alias-state-idle-primary); }

.ml-search, .ml-select {
  font: inherit; font-size: 12.5px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-card-fill);
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 8px; padding: 5px 10px;
  transition: border-color .16s ease, background .16s ease;
}
.ml-search { width: 260px; }
.ml-search:focus-visible, .ml-select:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
@media (hover: hover) {
  .ml-search:hover, .ml-select:hover { border-color: var(--dsw-alias-border-l4); }
}
.ml-filters { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 12px 0; }
.ml-filters > label, .ml-filters-inline > label { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.ml-filters-inline { display: inline-flex; align-items: center; gap: 8px; }

.ml-foot { color: var(--dsw-alias-label-tertiary); margin-top: 24px; font-size: 11.5px; }
.ml-provider-row td { background: var(--dsw-alias-bg-module-platform); }
.ml-spark { display: inline-flex; align-items: flex-end; gap: 2px; height: 16px; }
.ml-spark span {
  width: 3px; border-radius: 2px;
  background: linear-gradient(180deg,
    var(--dsw-alias-state-business-primary),
    color-mix(in srgb, var(--dsw-alias-state-business-primary) 32%, transparent));
}
.ml-up { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent); }
.ml-down { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent); }

@keyframes ml-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes ml-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ml-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ml-pop { from { opacity: 0; transform: scale(.25); } to { opacity: 1; transform: scale(1); } }

@media (prefers-reduced-motion: reduce) {
  .ml-root, .ml-root *, .ml-root *::before, .ml-root *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
`
    // ------------------------------------------------------------- formatting

    function fmtPrice(value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
      // A negative price is OpenRouter's variable-pricing sentinel, not a price.
      if (value < 0) return '—'
      if (value === 0) return 'free'
      if (value >= 100) return '$' + value.toFixed(0)
      if (value >= 1) return '$' + value.toFixed(2)
      if (value >= 0.01) return '$' + value.toFixed(3)
      return '$' + value.toPrecision(2)
    }

    function fmtTokens(value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
      const sign = value < 0 ? '−' : ''
      const abs = Math.abs(value)
      if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + 'T'
      if (abs >= 1e9) return sign + (abs / 1e9).toFixed(2) + 'B'
      if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M'
      if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K'
      return sign + String(Math.round(abs))
    }

    function fmtSignedTokens(value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
      return (value >= 0 ? '+' : '') + fmtTokens(value)
    }

    function fmtContext(value) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '—'
      if (value >= 1000000) return (value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1) + 'M'
      if (value >= 1000) return Math.round(value / 1000) + 'K'
      return String(value)
    }

    function fmtMetric(value, digits) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
      return value.toFixed(digits === undefined ? 1 : digits)
    }

    function fmtDate(value) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '—'
      return new Date(value * 1000).toLocaleDateString()
    }

    /** Input tokens are weighted 3:1 against output for the blended price. */
    function blended(priceIn, priceOut) {
      if (typeof priceIn !== 'number' && typeof priceOut !== 'number') return undefined
      const a = typeof priceIn === 'number' ? priceIn : 0
      const b = typeof priceOut === 'number' ? priceOut : 0
      const value = (a * 3 + b) / 4
      return Number.isFinite(value) ? value : undefined
    }

    /** The ordered category boards the panel offers. */
    const BOARD_SPECS = [
      { id: 'popular', key: 'tokens', desc: true, format: fmtTokens, spark: true },
      { id: 'trending', key: 'growth', desc: true, format: fmtSignedTokens, spark: true },
      { id: 'newest', key: 'created', desc: true, format: fmtDate },
      { id: 'strongest', key: 'intelligence', desc: true, format: (v) => fmtMetric(v) },
      { id: 'coding', key: 'coding', desc: true, format: (v) => fmtMetric(v) },
      { id: 'agentic', key: 'agentic', desc: true, format: (v) => fmtMetric(v) },
      { id: 'value', key: 'score', desc: true, format: (v) => fmtMetric(v) },
      { id: 'cheapest', key: 'blended', desc: false, format: fmtPrice, positive: true },
      { id: 'context', key: 'contextLength', desc: true, format: fmtContext },
    ]

    // ------------------------------------------------------------------- data

    function buildRows(snapshot) {
      const models = new Map()
      for (const model of snapshot.models ?? []) models.set(model.id, model)
      const aa = new Map()
      for (const row of snapshot.benchmarks?.artificialAnalysis ?? []) aa.set(row.id, row)
      const usage = new Map()
      for (const row of snapshot.usage?.models ?? []) usage.set(row.id, row)

      // Design Arena arrives flat, one row per (model, category).
      const elos = new Map()
      for (const row of snapshot.benchmarks?.designArena ?? []) {
        const bucket = elos.get(row.id) ?? {}
        bucket[row.category] = { elo: row.elo, winRate: row.winRate }
        elos.set(row.id, bucket)
      }

      // The Host keyed every catalog route by its exact id and its date-stripped
      // id. Try the same candidates here, but never let a variant be dropped
      // silently: `x:free` resolving to `x` is a different model at a different
      // price, so it is reported as a mismatch rather than as available.
      const catalogRoutes = snapshot.catalogRoutes ?? {}
      const stripDate = (id) => String(id)
        .replace(/-\d{4}-\d{2}-\d{2}$/, '')
        .replace(/-\d{8}$/, '')
      const stripVariant = (id) => String(id).replace(/:[^:]*$/, '')
      const variantOf = (id) => {
        const text = String(id)
        const at = text.indexOf(':')
        return at < 0 ? '' : text.slice(at)
      }
      const resolveRoute = (id) => {
        for (const key of [id, stripDate(id), stripVariant(id), stripDate(stripVariant(id))]) {
          const route = catalogRoutes[key]
          if (route !== undefined) return route
        }
        return undefined
      }

      const ids = new Set([...models.keys(), ...aa.keys(), ...usage.keys(), ...elos.keys()])
      const rows = []
      for (const id of ids) {
        const model = models.get(id)
        const bench = aa.get(id)
        const used = usage.get(id)
        const route = resolveRoute(id)
        const variantPreserved = route === undefined || variantOf(route.id) === variantOf(id)
        const priceIn = bench?.priceIn ?? model?.priceIn
        const priceOut = bench?.priceOut ?? model?.priceOut
        const mix = blended(priceIn, priceOut)
        const intelligence = bench?.intelligence
        const byCategory = elos.get(id) ?? {}
        let elo
        let eloCategory
        let winRate
        for (const [category, entry] of Object.entries(byCategory)) {
          if (elo === undefined || entry.elo > elo) {
            elo = entry.elo
            eloCategory = category
            winRate = typeof entry.winRate === 'number' ? entry.winRate : undefined
          }
        }
        rows.push({
          id,
          name: bench?.name ?? model?.name ?? id,
          vendor: id.includes('/') ? id.slice(0, id.indexOf('/')) : id,
          intelligence,
          coding: bench?.coding,
          agentic: bench?.agentic,
          elo,
          eloCategory,
          winRate,
          elos: byCategory,
          priceIn,
          priceOut,
          blended: mix,
          contextLength: model?.contextLength,
          created: model?.created,
          tokens: used?.tokens,
          previous: used?.previous,
          growth: used?.growth,
          series: used?.series ?? [],
          score: typeof intelligence === 'number' && typeof mix === 'number' && mix > 0
            ? intelligence / mix
            : undefined,
          available: route !== undefined && variantPreserved,
          variantMismatch: route !== undefined && !variantPreserved,
          catalogId: route?.id,
          catalogProvider: route?.provider,
        })
      }
      return rows
    }

    // --------------------------------------------------------------- controls

    function useTranslate() {
      const [, bump] = React.useState(0)
      React.useEffect(() => {
        if (pluginCtx === null) return undefined
        return pluginCtx.locale.subscribe(() => bump((n) => n + 1))
      }, [])
      if (pluginCtx === null) return (key) => key
      return pluginCtx.locale.bind('model-leaderboard')
    }

    // ------------------------------------------------------------------ charts

    /**
     * Label packing for the scatter.
     *
     * LABEL_SLACK scales the buffers around each label and around each point, so
     * a lower value fits more names into the same region; 1 is the conservative
     * setting. LABEL_BUDGET is the number of automatic names drawn at full
     * zoom-out, and it rises with the zoom because zooming spreads the points
     * out — the collision checks still decide what actually fits.
     */
    const LABEL_SLACK = 0.7
    const LABEL_BUDGET = 9
    const LABEL_BUDGET_MAX_RATIO = 2

    /**
     * Keep a zoom window inside the data domain, with a small margin, and never
     * let it collapse to a degenerate span. Pure, so the clamping rules can be
     * checked without rendering.
     */
    function clampView(next, full) {
      const axis = (lo, hi, fullLo, fullHi) => {
        const fullSpan = fullHi - fullLo || 1
        const margin = fullSpan * 0.05
        const outerLo = fullLo - margin
        const outerHi = fullHi + margin
        const minSpan = fullSpan * 0.02
        const span = Math.min(Math.max(hi - lo, minSpan), outerHi - outerLo)
        const center = (lo + hi) / 2
        let a = center - span / 2
        let b = center + span / 2
        if (a < outerLo) { a = outerLo; b = a + span }
        if (b > outerHi) { b = outerHi; a = b - span }
        return [a, b]
      }
      const [x0, x1] = axis(next.x0, next.x1, full.x0, full.x1)
      const [y0, y1] = axis(next.y0, next.y1, full.y0, full.y1)
      return { x0, x1, y0, y1 }
    }

    /**
     * Intelligence against blended price, with a zoomable view. The x axis is
     * logarithmic because prices span four orders of magnitude, so the ticks are
     * powers of ten. Zooming changes the mapped domain rather than scaling the
     * SVG, so dots, strokes and text keep their size and the axes re-tick.
     *
     * Labels are placed greedily against already-placed labels and against other
     * points, so they never stack. A pinned name always gets a label, with a
     * leader line back to its dot.
     */
    function Scatter({ rows, t, pinned, onTogglePin, onClearPins }) {
      const [hover, setHover] = React.useState(null)
      const [rawView, setRawView] = React.useState(null)
      const [labelSize, setLabelSize] = React.useState(10)
      const [brush, setBrush] = React.useState(null)
      const lastHover = React.useRef(null)
      const drag = React.useRef(null)
      const moved = React.useRef(false)
      const svgRef = React.useRef(null)
      const gradientId = React.useMemo(() => 'ml-dot-gradient-' + (++chartSeq), [])

      const points = rows.filter((row) => typeof row.intelligence === 'number'
        && typeof row.blended === 'number' && row.blended > 0)
      if (points.length === 0) return h('p', { className: 'ml-note' }, t('panel.empty'))

      const show = (row) => {
        lastHover.current = row
        setHover(row)
      }
      // Clear only while this point is still the hovered one, so moving straight
      // from one point onto another never blanks the popover in between.
      const hide = (row) => {
        setHover((current) => (current !== null && current.id === row.id ? null : current))
      }

      const width = 820
      const height = 460
      const pad = { top: 26, right: 30, bottom: 64, left: 76 }
      const innerW = width - pad.left - pad.right
      const innerH = height - pad.top - pad.bottom

      const xMin = Math.min(...points.map((row) => Math.log10(row.blended)))
      const xMax = Math.max(...points.map((row) => Math.log10(row.blended)))
      const yMin = Math.min(...points.map((row) => row.intelligence))
      const yMax = Math.max(...points.map((row) => row.intelligence))
      const full = React.useMemo(
        () => ({ x0: xMin, x1: xMax, y0: yMin, y1: yMax }),
        [xMin, xMax, yMin, yMax],
      )
      const view = React.useMemo(
        () => (rawView === null ? full : clampView(rawView, full)),
        [rawView, full],
      )

      const px = (value) => pad.left + ((Math.log10(value) - view.x0) / (view.x1 - view.x0)) * innerW
      const py = (value) => pad.top + innerH - ((value - view.y0) / (view.y1 - view.y0)) * innerH
      const invX = (screenX) => view.x0 + ((screenX - pad.left) / innerW) * (view.x1 - view.x0)
      const invY = (screenY) => view.y0 + ((pad.top + innerH - screenY) / innerH) * (view.y1 - view.y0)

      const visible = points.filter((row) => {
        const lx = Math.log10(row.blended)
        return lx >= view.x0 && lx <= view.x1 && row.intelligence >= view.y0 && row.intelligence <= view.y1
      })

      const zoomed = rawView !== null

      // ---- ticks follow the view, not the data -------------------------------
      const decades = Math.ceil(view.x1) - Math.floor(view.x0)
      const multipliers = decades > 3 ? [1] : [1, 3]
      const xTicks = []
      for (let e = Math.floor(view.x0); e <= Math.ceil(view.x1); e++) {
        for (const m of multipliers) {
          const value = m * Math.pow(10, e)
          if (value >= Math.pow(10, view.x0) && value <= Math.pow(10, view.x1)) xTicks.push(value)
        }
      }
      const yTicks = (() => {
        const span = view.y1 - view.y0
        const raw = span / 5
        const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
        const normalized = raw / magnitude
        const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude
        const ticks = []
        for (let v = Math.ceil(view.y0 / step) * step; v <= view.y1 + step * 0.001; v += step) ticks.push(v)
        return ticks
      })()

      // ---- label placement ---------------------------------------------------
      const sideAnchors = [
        { dx: 10, dy: 3.5, anchor: 'start' },
        { dx: -10, dy: 3.5, anchor: 'end' },
        { dx: 10, dy: -10, anchor: 'start' },
        { dx: -10, dy: -10, anchor: 'end' },
      ]
      const allAnchors = [
        ...sideAnchors,
        { dx: 0, dy: -11, anchor: 'middle' },
        { dx: 0, dy: 17, anchor: 'middle' },
      ]
      const labels = []
      const labelBoxes = []
      const boxFor = (cx, cy, w, option) => {
        const x1 = option.anchor === 'start' ? cx + option.dx
          : option.anchor === 'end' ? cx + option.dx - w
            : cx + option.dx - w / 2
        return { x1, x2: x1 + w, y1: cy + option.dy - (labelSize + 2), y2: cy + option.dy + 3 }
      }
      const place = (row, priority) => {
        const text = row.name.length > 22 ? row.name.slice(0, 21) + '…' : row.name
        const w = text.length * labelSize * 0.56 + 8 * LABEL_SLACK
        const cx = px(row.blended)
        const cy = py(row.intelligence)
        for (const option of (priority ? sideAnchors : allAnchors)) {
          const box = boxFor(cx, cy, w, option)
          if (box.x1 < pad.left - 6 * LABEL_SLACK || box.x2 > pad.left + innerW + 6 * LABEL_SLACK) continue
          if (box.y1 < pad.top - 8 * LABEL_SLACK || box.y2 > pad.top + innerH + 8 * LABEL_SLACK) continue
          if (labelBoxes.some((b) => !(box.x2 < b.x1 || box.x1 > b.x2 || box.y2 < b.y1 || box.y1 > b.y2))) continue
          const buffer = 4 * LABEL_SLACK
          const crowds = visible.some((other) => {
            if (other === row) return false
            const ox = px(other.blended)
            const oy = py(other.intelligence)
            return ox > box.x1 - buffer && ox < box.x2 + buffer
              && oy > box.y1 - buffer && oy < box.y2 + buffer
          })
          if (crowds) continue
          labelBoxes.push(box)
          labels.push({ row, text, x: cx + option.dx, y: cy + option.dy, anchor: option.anchor, pinned: priority })
          return true
        }
        if (!priority) return false
        // A pinned name must appear even at the cost of overlapping, so fall back
        // to a clamped side label rather than dropping it.
        const x = Math.min(Math.max(cx + 10, pad.left), pad.left + innerW - w)
        labelBoxes.push({ x1: x, x2: x + w, y1: cy - labelSize + 1, y2: cy + 3 })
        labels.push({ row, text, x, y: cy + 3.5, anchor: 'start', pinned: true })
        return true
      }
      for (const row of visible) if (pinned.has(row.id)) place(row, true)
      const ranked = [...visible].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      // Zooming in spreads the points out, so the ceiling rises with it instead of
      // leaving the same handful of names on screen at every zoom level.
      const zoomRatio = (full.x1 - full.x0) / (view.x1 - view.x0)
      const budget = Math.round(LABEL_BUDGET * Math.min(Math.max(zoomRatio, 1), LABEL_BUDGET_MAX_RATIO))
      let auto = 0
      for (const row of ranked) {
        if (auto >= budget) break
        if (pinned.has(row.id)) continue
        if (place(row, false)) auto++
      }

      const hovered = hover !== null && visible.some((row) => row.id === hover.id) ? hover : null
      const tipRow = hovered ?? lastHover.current
      const tip = tipRow === null ? null : (() => {
        const tw = 216
        const th = 64
        const tx = Math.min(Math.max(px(tipRow.blended) + 16, pad.left), pad.left + innerW - tw)
        const ty = Math.min(Math.max(py(tipRow.intelligence) - th - 12, pad.top), pad.top + innerH - th)
        return { tw, th, tx, ty }
      })()

      // ---- interaction -------------------------------------------------------
      const toLocal = (event) => {
        const node = svgRef.current
        if (node === null) return { x: 0, y: 0 }
        const rect = node.getBoundingClientRect()
        return {
          x: ((event.clientX - rect.left) / (rect.width || 1)) * width,
          y: ((event.clientY - rect.top) / (rect.height || 1)) * height,
        }
      }
      const inPlot = (local) => local.x >= pad.left && local.x <= pad.left + innerW
        && local.y >= pad.top && local.y <= pad.top + innerH

      const zoomAt = (screenX, screenY, factor) => {
        const cx = invX(screenX)
        const cy = invY(screenY)
        setRawView(clampView({
          x0: cx + (view.x0 - cx) * factor,
          x1: cx + (view.x1 - cx) * factor,
          y0: cy + (view.y0 - cy) * factor,
          y1: cy + (view.y1 - cy) * factor,
        }, full))
      }

      // React registers `onWheel` passively at the root, so preventDefault needs
      // a native non-passive listener. `view` and `full` are memoized, so this
      // does not re-register on every hover.
      React.useEffect(() => {
        const node = svgRef.current
        if (node === null) return undefined
        const handler = (event) => {
          const rect = node.getBoundingClientRect()
          const local = {
            x: ((event.clientX - rect.left) / (rect.width || 1)) * width,
            y: ((event.clientY - rect.top) / (rect.height || 1)) * height,
          }
          if (!inPlot(local)) return
          event.preventDefault()
          zoomAt(local.x, local.y, Math.exp(event.deltaY * 0.0015))
        }
        node.addEventListener('wheel', handler, { passive: false })
        return () => node.removeEventListener('wheel', handler)
      }, [view, full])

      const onPointerDown = (event) => {
        if (event.button !== 0) return
        // Stop the browser starting a text selection from a press anywhere on the
        // chart, axis labels included. It does not suppress `click`, `dblclick`
        // or the enter/leave pair the points use.
        event.preventDefault()
        const local = toLocal(event)
        if (!inPlot(local)) return
        moved.current = false
        drag.current = {
          mode: event.shiftKey ? 'brush' : 'pan',
          startX: local.x,
          startY: local.y,
          view,
        }
      }
      const onPointerMove = (event) => {
        const state = drag.current
        if (state === null) return
        const local = toLocal(event)
        const dx = local.x - state.startX
        const dy = local.y - state.startY
        if (!moved.current && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
        moved.current = true
        if (state.mode === 'brush') {
          setBrush({
            x0: Math.min(state.startX, local.x),
            x1: Math.max(state.startX, local.x),
            y0: Math.min(state.startY, local.y),
            y1: Math.max(state.startY, local.y),
          })
          return
        }
        const sx = (state.view.x1 - state.view.x0) / innerW
        const sy = (state.view.y1 - state.view.y0) / innerH
        setRawView(clampView({
          x0: state.view.x0 - dx * sx,
          x1: state.view.x1 - dx * sx,
          y0: state.view.y0 + dy * sy,
          y1: state.view.y1 + dy * sy,
        }, full))
      }
      const endDrag = () => {
        const state = drag.current
        drag.current = null
        if (state === null) return
        if (state.mode !== 'brush') return
        if (brush !== null && brush.x1 - brush.x0 > 10 && brush.y1 - brush.y0 > 10) {
          setRawView(clampView({
            x0: invX(brush.x0),
            x1: invX(brush.x1),
            y0: invY(brush.y1),
            y1: invY(brush.y0),
          }, full))
        }
        setBrush(null)
      }
      const resetView = () => {
        setRawView(null)
        setBrush(null)
      }
      const zoomCentre = (factor) => zoomAt(pad.left + innerW / 2, pad.top + innerH / 2, factor)

      const pinnedRows = points.filter((row) => pinned.has(row.id))

      const bar = h('div', { className: 'ml-chart-bar' }, [
        h('button', {
          key: 'out', type: 'button', className: 'ml-btn',
          title: t('chart.zoomOut'), 'aria-label': t('chart.zoomOut'),
          onClick: () => zoomCentre(1 / 0.7),
        }, '−'),
        h('button', {
          key: 'in', type: 'button', className: 'ml-btn',
          title: t('chart.zoomIn'), 'aria-label': t('chart.zoomIn'),
          onClick: () => zoomCentre(0.7),
        }, '+'),
        h('button', {
          key: 'reset', type: 'button', className: 'ml-btn',
          disabled: !zoomed, onClick: resetView,
        }, t('chart.reset')),
        h('span', { key: 'sep', className: 'ml-chart-sep' }),
        h('button', {
          key: 'smaller', type: 'button', className: 'ml-btn',
          title: t('chart.labelSize'), 'aria-label': t('chart.labelSize'),
          disabled: labelSize <= 8, onClick: () => setLabelSize((size) => Math.max(8, size - 2)),
        }, 'A−'),
        h('button', {
          key: 'larger', type: 'button', className: 'ml-btn',
          title: t('chart.labelSize'), 'aria-label': t('chart.labelSize'),
          disabled: labelSize >= 18, onClick: () => setLabelSize((size) => Math.min(18, size + 2)),
        }, 'A+'),
        h('span', { key: 'count', className: 'ml-chip' },
          t('chart.visible') + ' ' + visible.length + ' ' + t('stat.of') + ' ' + points.length),
        h('span', { key: 'hint', className: 'ml-hint' }, t('chart.hint')),
      ])

      const pins = pinnedRows.length === 0 ? null : h('div', { className: 'ml-pins' }, [
        h('span', { key: 'l', className: 'ml-pins-label' }, t('chart.pinned') + ' ' + pinnedRows.length),
        ...pinnedRows.map((row) => h('button', {
          key: row.id,
          type: 'button',
          className: 'ml-pin',
          title: t('chart.unpin') + ' · ' + row.id,
          onClick: () => onTogglePin(row.id),
        }, [h('span', { key: 'n' }, row.name), h('span', { key: 'x', className: 'ml-pin-x' }, '×')])),
        h('button', {
          key: 'clear', type: 'button', className: 'ml-btn', onClick: onClearPins,
        }, t('chart.clearPins')),
      ])

      return h('div', null, [
        bar,
        h('svg', {
          key: 'chart',
          ref: svgRef,
          className: 'ml-chart' + (zoomed ? ' ml-chart-zoomed' : ''),
          viewBox: '0 0 ' + width + ' ' + height,
          role: 'img',
          'aria-label': t('tab.value'),
          onPointerDown,
          onPointerMove,
          onPointerUp: endDrag,
          onPointerLeave: endDrag,
          onMouseLeave: () => setHover(null),
          onClick: () => {
            if (moved.current) return
            setHover(null)
          },
          onDoubleClick: resetView,
        }, [
          h('defs', { key: 'defs' }, h('radialGradient', { id: gradientId }, [
            h('stop', { key: 'a', offset: '0%', stopColor: 'var(--dsw-alias-state-business-primary)', stopOpacity: '1' }),
            h('stop', { key: 'b', offset: '100%', stopColor: 'var(--dsw-alias-state-business-primary)', stopOpacity: '0.6' }),
          ])),

          // Horizontal gridlines only: vertical ones fight the logarithmic ticks.
          ...yTicks.map((tick, i) => h('line', {
            key: 'gy' + i, className: 'ml-grid',
            x1: pad.left, x2: pad.left + innerW, y1: py(tick), y2: py(tick),
          })),
          ...yTicks.map((tick, i) => h('text', {
            key: 'ty' + i, className: 'ml-tick',
            x: pad.left - 12, y: py(tick) + 4, textAnchor: 'end',
          }, tick.toFixed(0))),
          ...xTicks.map((tick, i) => h('line', {
            key: 'tm' + i, className: 'ml-tick-mark',
            x1: px(tick), x2: px(tick), y1: pad.top + innerH, y2: pad.top + innerH + 5,
          })),
          ...xTicks.map((tick, i) => h('text', {
            key: 'xl' + i, className: 'ml-tick',
            x: px(tick), y: pad.top + innerH + 21, textAnchor: 'middle',
          }, fmtPrice(tick))),

          h('line', { key: 'ax', className: 'ml-axis', x1: pad.left, x2: pad.left + innerW, y1: pad.top + innerH, y2: pad.top + innerH }),
          h('line', { key: 'ay', className: 'ml-axis', x1: pad.left, x2: pad.left, y1: pad.top, y2: pad.top + innerH }),

          // Axis titles sit outside the plot area, so nothing overlaps the data.
          h('text', {
            key: 'xt', className: 'ml-axis-title',
            x: pad.left + innerW / 2, y: height - 16, textAnchor: 'middle',
          }, t('col.blended')),
          h('text', {
            key: 'yt', className: 'ml-axis-title',
            transform: 'rotate(-90)',
            x: -(pad.top + innerH / 2), y: 18, textAnchor: 'middle',
          }, t('col.intelligence')),

          brush === null ? null : h('rect', {
            key: 'marquee',
            className: 'ml-marquee',
            x: Math.max(pad.left, brush.x0),
            y: Math.max(pad.top, brush.y0),
            width: Math.max(0, Math.min(pad.left + innerW, brush.x1) - Math.max(pad.left, brush.x0)),
            height: Math.max(0, Math.min(pad.top + innerH, brush.y1) - Math.max(pad.top, brush.y0)),
          }),

          ...visible.map((row, index) => {
            const cx = px(row.blended)
            const cy = py(row.intelligence)
            const hot = hovered !== null && hovered.id === row.id
            return h('g', {
              key: 'p' + row.id,
              className: 'ml-point',
              style: { animationDelay: Math.min(index * 6, 420) + 'ms' },
              onMouseEnter: () => show(row),
              onMouseLeave: () => hide(row),
              onClick: (event) => {
                // A click pins the name; stopping the bubble keeps the chart's
                // own click-to-dismiss from firing in the same gesture.
                event.stopPropagation()
                if (moved.current) return
                onTogglePin(row.id)
                show(row)
              },
            }, [
              h('circle', { key: 'h', className: row.available ? 'ml-halo' : 'ml-halo-off', cx, cy, r: 9 }),
              h('circle', {
                key: 'c',
                className: (row.available ? 'ml-dot' : 'ml-dot-off') + (hot ? ' ml-dot-hot' : ''),
                style: row.available ? { fill: 'url(#' + gradientId + ')' } : undefined,
                cx, cy, r: 4,
              }),
              h('circle', { key: 'hit', className: 'ml-hit', cx, cy, r: 11 }),
            ])
          }),

          ...labels.map((label) => (label.pinned ? h('line', {
            key: 'ld' + label.row.id,
            className: 'ml-leader',
            x1: px(label.row.blended),
            y1: py(label.row.intelligence),
            x2: label.x,
            y2: label.y - labelSize * 0.35,
          }) : null)),

          ...labels.map((label) => h('text', {
            key: 'l' + label.row.id,
            className: 'ml-dot-label'
              + (label.pinned ? ' ml-dot-label-pin' : '')
              + (hovered !== null && hovered.id === label.row.id ? ' ml-dot-label-hot' : ''),
            style: { fontSize: labelSize + 'px' },
            x: label.x, y: label.y, textAnchor: label.anchor,
          }, label.text)),

          tip === null ? null : h('g', {
            key: 'tip',
            className: 'ml-tip' + (hovered === null ? '' : ' ml-tip-on'),
            transform: 'translate(' + tip.tx + ',' + tip.ty + ')',
            'aria-hidden': true,
          }, [
            h('rect', { key: 'r', className: 'ml-tip-box', x: 0, y: 0, width: tip.tw, height: tip.th, rx: 10 }),
            h('text', { key: 'n', className: 'ml-tip-title', x: 13, y: 21 },
              tipRow.name.length > 27 ? tipRow.name.slice(0, 26) + '…' : tipRow.name),
            h('text', { key: 'i', className: 'ml-tip-line', x: 13, y: 40 },
              t('col.intelligence') + ' ' + fmtMetric(tipRow.intelligence)
              + '   ·   ' + t('col.blended') + ' ' + fmtPrice(tipRow.blended)),
            h('text', { key: 's', className: 'ml-tip-line', x: 13, y: 56 },
              tipRow.available ? t('badge.available') + ' · ' + (tipRow.catalogId ?? tipRow.id) : t('badge.unavailable')),
          ]),
        ]),
        pins,
      ])
    }

    function Bars({ rows, t, metric, format, label }) {
      const usable = rows.filter((row) => typeof row[metric] === 'number')
      if (usable.length === 0) return h('p', { className: 'ml-note' }, t('panel.empty'))
      const sorted = [...usable].sort((a, b) => b[metric] - a[metric]).slice(0, 30)
      const max = sorted[0][metric] || 1
      return h('div', { className: 'ml-bars' }, sorted.map((row) => h('div', {
        key: row.id, className: 'ml-bar-row',
      }, [
        h('div', { key: 'n', className: 'ml-bar-name', title: row.id }, label ? label(row) : row.name),
        h('div', { key: 't', className: 'ml-bar-track' },
          h('div', { className: 'ml-bar-fill', style: { width: Math.max(1, (row[metric] / max) * 100) + '%' } })),
        h('div', { key: 'v', className: 'ml-bar-value' }, format(row[metric])),
      ])))
    }

    function Spark({ series }) {
      if (!Array.isArray(series) || series.length < 2) return null
      const max = Math.max(...series.map((point) => point.tokens), 1)
      return h('span', { className: 'ml-spark', 'aria-hidden': true }, series.map((point, index) => h('span', {
        key: index,
        style: { height: Math.max(2, (point.tokens / max) * 14) + 'px' },
        title: point.date + ': ' + fmtTokens(point.tokens),
      })))
    }

    // ------------------------------------------------------------------ pieces

    function ModelCell({ row }) {
      return h('div', { className: 'ml-model' }, [
        h('div', { key: 'x' }, [
          h('div', { key: 'n', className: 'ml-model-name' }, row.name),
          h('div', { key: 'i', className: 'ml-model-id' }, row.id),
          row.catalogId !== undefined && row.catalogId !== row.id
            ? h('div', { key: 'c', className: 'ml-model-id' }, '→ ' + row.catalogId)
            : null,
        ]),
      ])
    }

    function StatusBadge({ row, t }) {
      if (row.variantMismatch) {
        return h('span', {
          className: 'ml-badge ml-badge-warn',
          title: row.catalogId,
        }, t('badge.variant'))
      }
      return row.available
        ? h('span', { className: 'ml-badge ml-badge-ok' }, t('badge.available'))
        : h('span', { className: 'ml-badge ml-badge-no' }, t('badge.unavailable'))
    }

    function useSortable(initialKey, initialDesc) {
      const [sort, setSort] = React.useState({ key: initialKey, desc: initialDesc })
      const toggle = React.useCallback((key) => {
        setSort((current) => current.key === key
          ? { key, desc: !current.desc }
          : { key, desc: true })
      }, [])
      const apply = React.useCallback((rows) => {
        const copy = [...rows]
        copy.sort((a, b) => {
          const left = a[sort.key]
          const right = b[sort.key]
          const leftMissing = left === undefined || left === null
          const rightMissing = right === undefined || right === null
          if (leftMissing && rightMissing) return a.name.localeCompare(b.name)
          if (leftMissing) return 1
          if (rightMissing) return -1
          if (typeof left === 'number' && typeof right === 'number') {
            return sort.desc ? right - left : left - right
          }
          return sort.desc
            ? String(right).localeCompare(String(left))
            : String(left).localeCompare(String(right))
        })
        return copy
      }, [sort])
      return { sort, toggle, apply }
    }

    function SortHeader({ label, sortKey, sort, onToggle, numeric }) {
      const active = sort.key === sortKey
      return h('th', {
        className: numeric ? 'ml-num' : undefined,
        onClick: () => onToggle(sortKey),
        'aria-sort': active ? (sort.desc ? 'descending' : 'ascending') : 'none',
        scope: 'col',
      }, label + (active ? (sort.desc ? ' ↓' : ' ↑') : ''))
    }

    /**
     * One filter predicate for every table, so the bar means the same thing
     * wherever it appears. `route` distinguishes the three badge states.
     */
    function applyFilters(rows, { query, vendor, route }) {
      const needle = query.trim().toLowerCase()
      return rows.filter((row) => {
        if (vendor !== '' && row.vendor !== vendor) return false
        if (route === 'available' && !row.available) return false
        if (route === 'variant' && !row.variantMismatch) return false
        if (route === 'unavailable' && (row.available || row.variantMismatch)) return false
        if (needle === '') return true
        return row.id.toLowerCase().includes(needle) || row.name.toLowerCase().includes(needle)
      })
    }

    function FilterBar({ t, filters, vendors, shown, total, onReset, extra }) {
      const active = filters.query !== '' || filters.vendor !== '' || filters.route !== ''
      return h('div', { className: 'ml-filters' }, [
        h('input', {
          key: 'q',
          className: 'ml-search',
          type: 'search',
          value: filters.query,
          placeholder: t('search.placeholder'),
          'aria-label': t('search.placeholder'),
          onChange: (event) => filters.setQuery(event.target.value),
        }),
        h('label', { key: 'vl', htmlFor: 'ml-vendor' }, t('filter.vendor')),
        h('select', {
          key: 'v',
          id: 'ml-vendor',
          className: 'ml-select',
          value: filters.vendor,
          onChange: (event) => filters.setVendor(event.target.value),
        }, [h('option', { key: '', value: '' }, t('filter.all'))].concat(
          vendors.map((entry) => h('option', {
            key: entry.name, value: entry.name,
          }, entry.name + ' (' + entry.count + ')')),
        )),
        h('label', { key: 'rl', htmlFor: 'ml-route' }, t('filter.route')),
        h('select', {
          key: 'r',
          id: 'ml-route',
          className: 'ml-select',
          value: filters.route,
          onChange: (event) => filters.setRoute(event.target.value),
        }, [
          h('option', { key: '', value: '' }, t('filter.routeAll')),
          h('option', { key: 'available', value: 'available' }, t('badge.available')),
          h('option', { key: 'variant', value: 'variant' }, t('badge.variant')),
          h('option', { key: 'unavailable', value: 'unavailable' }, t('badge.unavailable')),
        ]),
        extra ?? null,
        h('span', { key: 'c', className: 'ml-chip' },
          t('stat.showing') + ' ' + shown + ' ' + t('stat.of') + ' ' + total),
        active
          ? h('button', {
            key: 'x', type: 'button', className: 'ml-btn', onClick: onReset,
          }, t('filter.reset'))
          : null,
      ])
    }

    function ProviderDetail({ rowId, t }) {
      const [state, setState] = React.useState({ status: 'loading' })
      React.useEffect(() => {
        let cancelled = false
        fetch('/api/model-leaderboard/endpoints?id=' + encodeURIComponent(rowId), {
          headers: { accept: 'application/json' },
        })
          .then((response) => response.json())
          .then((payload) => { if (!cancelled) setState({ status: 'ready', payload }) })
          .catch((error) => { if (!cancelled) setState({ status: 'error', error: String(error?.message ?? error) }) })
        return () => { cancelled = true }
      }, [rowId])

      if (state.status === 'loading') return h('p', { className: 'ml-note' }, t('providers.loading'))
      if (state.status === 'error') return h('p', { className: 'ml-note ml-notice-error' }, state.error)
      const endpoints = state.payload?.endpoints ?? []
      if (endpoints.length === 0) return h('p', { className: 'ml-note' }, t('providers.none'))
      return h('table', { className: 'ml-table' }, [
        h('thead', { key: 'h' }, h('tr', null, [
          h('th', { key: 'p', scope: 'col' }, t('providers.provider')),
          h('th', { key: 'q', scope: 'col' }, t('providers.quant')),
          h('th', { key: 'i', className: 'ml-num', scope: 'col' }, t('col.priceIn')),
          h('th', { key: 'o', className: 'ml-num', scope: 'col' }, t('col.priceOut')),
          h('th', { key: 'u', className: 'ml-num', scope: 'col' }, t('providers.uptime')),
          h('th', { key: 'l', className: 'ml-num', scope: 'col' }, t('providers.latency')),
          h('th', { key: 't', className: 'ml-num', scope: 'col' }, t('providers.throughput')),
        ])),
        h('tbody', { key: 'b' }, endpoints.map((endpoint, index) => h('tr', {
          key: index, className: 'ml-provider-row',
        }, [
          h('td', { key: 'p' }, endpoint.provider ?? '—'),
          h('td', { key: 'q' }, endpoint.quantization ?? '—'),
          h('td', { key: 'i', className: 'ml-num' }, fmtPrice(endpoint.priceIn)),
          h('td', { key: 'o', className: 'ml-num' }, fmtPrice(endpoint.priceOut)),
          h('td', { key: 'u', className: 'ml-num' }, typeof endpoint.uptime1d === 'number' ? endpoint.uptime1d.toFixed(1) + '%' : '—'),
          h('td', { key: 'l', className: 'ml-num' }, typeof endpoint.latencyMs === 'number' ? Math.round(endpoint.latencyMs) + ' ms' : '—'),
          h('td', { key: 't', className: 'ml-num' }, typeof endpoint.throughput === 'number' ? Math.round(endpoint.throughput) + ' t/s' : '—'),
        ]))),
      ])
    }

    /**
     * One category board: a ranked table whose headline metric is the board's
     * own, so "newest" and "cheapest" read correctly without a second layout.
     */
    /**
     * The population a board can rank: rows that actually carry its metric. A
     * price board also drops the negative variable-pricing sentinel, which must
     * never rank as the cheapest entry.
     */
    function boardUsable(spec, rows) {
      return rows.filter((row) => typeof row[spec.key] === 'number'
        && (!spec.positive || row[spec.key] > 0))
    }

    function BoardTable({ spec, rows, t, busy, onSetDefault, onCopyId, limit }) {
      // The board picks the population and the starting order; the headers still
      // sort, so "cheapest" can be flipped to most expensive. The parent keys
      // this component by board id, so switching boards resets the sort.
      const [sort, setSort] = React.useState({ key: spec.key, desc: spec.desc })
      const toggle = React.useCallback((key) => {
        setSort((current) => (current.key === key
          ? { key, desc: !current.desc }
          : { key, desc: true }))
      }, [])
      const usable = boardUsable(spec, rows)
      if (usable.length === 0) return h('p', { className: 'ml-note' }, t('panel.empty'))
      const sorted = [...usable].sort((a, b) => {
        const left = a[sort.key]
        const right = b[sort.key]
        const leftMissing = left === undefined || left === null
        const rightMissing = right === undefined || right === null
        if (leftMissing && rightMissing) return a.name.localeCompare(b.name)
        if (leftMissing) return 1
        if (rightMissing) return -1
        return sort.desc ? right - left : left - right
      })
      const top = sorted.slice(0, limit ?? 25)
      return h('div', { className: 'ml-scroll' }, h('table', { className: 'ml-table' }, [
        h('thead', { key: 'h' }, h('tr', null, [
          h('th', { key: 'r', className: 'ml-nosort', scope: 'col' }, t('col.rank')),
          h('th', { key: 'm', className: 'ml-nosort', scope: 'col' }, t('col.model')),
          h(SortHeader, {
            key: 'v', label: t('col.metric'), sortKey: spec.key, sort, onToggle: toggle, numeric: true,
          }),
          spec.spark ? h('th', { key: 's', className: 'ml-nosort', scope: 'col' }, t('col.trend')) : null,
          h(SortHeader, {
            key: 'b', label: t('col.blended'), sortKey: 'blended', sort, onToggle: toggle, numeric: true,
          }),
          h(SortHeader, {
            key: 'c', label: t('col.context'), sortKey: 'contextLength', sort, onToggle: toggle, numeric: true,
          }),
          h('th', { key: 'st', className: 'ml-nosort', scope: 'col' }, t('col.status')),
          h('th', { key: 'a', className: 'ml-nosort', scope: 'col' }, t('col.actions')),
        ].filter(Boolean))),
        h('tbody', { key: 'b' }, top.map((row, index) => h('tr', { key: row.id }, [
          h('td', { key: 'r', className: 'ml-num' }, String(index + 1)),
          h('td', { key: 'm' }, h(ModelCell, { row })),
          h('td', {
            key: 'v',
            className: 'ml-num' + (spec.key === 'growth' ? (row[spec.key] >= 0 ? ' ml-up' : ' ml-down') : ''),
          }, spec.format(row[spec.key])),
          spec.spark ? h('td', { key: 's' }, h(Spark, { series: row.series })) : null,
          h('td', { key: 'b', className: 'ml-num' }, fmtPrice(row.blended)),
          h('td', { key: 'c', className: 'ml-num' }, fmtContext(row.contextLength)),
          h('td', { key: 'st' }, h(StatusBadge, { row, t })),
          h('td', { key: 'a' }, h('div', { className: 'ml-actions' }, [
            h('button', {
              key: 's', type: 'button', className: 'ml-btn ml-btn-primary',
              disabled: busy === row.id, onClick: () => onSetDefault(row),
            }, t('action.setDefault')),
            h('button', {
              key: 'c', type: 'button', className: 'ml-btn', onClick: () => onCopyId(row),
            }, t('action.copyId')),
          ])),
        ].filter(Boolean)))),
      ]))
    }

    // ------------------------------------------------------------------- panel

    function Panel() {
      const t = useTranslate()
      const [state, setState] = React.useState({ status: 'loading' })
      const [tab, setTab] = React.useState('boards')
      const [board, setBoard] = React.useState('popular')
      const [eloCategory, setEloCategory] = React.useState(null)
      const [vendor, setVendor] = React.useState('')
      const [route, setRoute] = React.useState('')
      // Pinned model names live here rather than in the chart, so they survive a
      // tab switch and a filter change.
      const [pinned, setPinned] = React.useState(() => new Set())
      const [notice, setNotice] = React.useState(null)
      const [query, setQuery] = React.useState('')
      const [expanded, setExpanded] = React.useState(null)
      const [busy, setBusy] = React.useState(null)

      const load = React.useCallback(async (force) => {
        setState((current) => ({ ...current, status: current.data ? 'refreshing' : 'loading' }))
        try {
          const response = await fetch('/api/model-leaderboard/snapshot' + (force ? '?refresh=1' : ''), {
            headers: { accept: 'application/json' },
          })
          if (!response.ok) throw new Error('HTTP ' + response.status)
          const data = await response.json()
          setState({ status: 'ready', data, error: undefined })
        } catch (error) {
          setState((current) => ({
            status: 'error',
            data: current.data,
            error: String(error?.message ?? error),
          }))
        }
      }, [])

      React.useEffect(() => { load(false) }, [load])

      const snapshot = state.data
      const rows = React.useMemo(() => (snapshot ? buildRows(snapshot) : []), [snapshot])

      const setDefault = React.useCallback(async (row) => {
        setBusy(row.id)
        setNotice(null)
        // Ask for the route DSH can dispatch, not the dated ranking permaslug,
        // and carry the current effort so a switch does not silently drop it.
        const model = row.catalogId ?? row.id
        const reasoningEffort = snapshot?.current?.reasoningEffort
        try {
          const response = await fetch('/api/model-leaderboard/default-model', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ provider: row.catalogProvider, model, reasoningEffort }),
          })
          const payload = await response.json()
          if (payload?.ok) {
            const label = payload.selection.provider + '/' + payload.selection.model
            const warning = payload.routed === false
              ? t('msg.setUnrouted')
              : payload.variantPreserved === false
                ? t('msg.setVariant') + ' ' + payload.requested
                : ''
            setNotice({
              kind: warning === '' ? 'ok' : 'warn',
              text: t('msg.setOk') + ' ' + label + (warning === '' ? '' : '. ' + warning),
            })
            setState((current) => (current.data
              ? { ...current, data: { ...current.data, current: payload.selection } }
              : current))
          } else {
            setNotice({ kind: 'error', text: t('msg.setFailed') + ': ' + (payload?.error ?? '') })
          }
        } catch (error) {
          setNotice({ kind: 'error', text: t('msg.setFailed') + ': ' + String(error?.message ?? error) })
        } finally {
          setBusy(null)
        }
      }, [t, snapshot])

      const copyId = React.useCallback(async (row) => {
        try {
          await navigator.clipboard.writeText(row.id)
          setNotice({ kind: 'ok', text: t('action.copied') + ': ' + row.id })
        } catch (error) {
          setNotice({ kind: 'error', text: t('msg.copyFailed') + ': ' + String(error?.message ?? error) })
        }
      }, [t])

      const value = useSortable('score', true)
      const quality = useSortable('intelligence', true)
      const usage = useSortable('tokens', true)
      const price = useSortable('blended', false)

      const vendors = React.useMemo(() => {
        const counts = new Map()
        for (const row of rows) counts.set(row.vendor, (counts.get(row.vendor) ?? 0) + 1)
        return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
      }, [rows])

      // One filter state shared by every table, so a filter set on one tab is
      // still in force on the next.
      const filters = { query, vendor, route, setQuery, setVendor, setRoute }
      const resetFilters = React.useCallback(() => {
        setQuery('')
        setVendor('')
        setRoute('')
      }, [])
      const togglePin = React.useCallback((id) => {
        setPinned((current) => {
          const next = new Set(current)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      }, [])
      const clearPins = React.useCallback(() => setPinned(new Set()), [])
      const filtered = React.useMemo(
        () => applyFilters(rows, { query, vendor, route }),
        [rows, query, vendor, route],
      )

      const header = h('div', { className: 'ml-topbar' }, h('div', { className: 'ml-shell' }, [
        h('div', { key: 'brand', className: 'ml-brand' }, [
          h('span', { key: 'mark', className: 'ml-mark' }, h(LadderIcon, { size: 18 })),
          h('div', { key: 'title', style: { minWidth: 0 } }, [
            h('h1', { key: 'h', className: 'ml-title' }, t('panel.title')),
            h('p', { key: 'p', className: 'ml-sub' }, t('panel.subtitle')),
          ]),
        ]),
        h('div', { key: 'actions', className: 'ml-head-actions' }, [
          snapshot
            ? h('span', { key: 'ts', className: 'ml-chip' }, [
              t('panel.generated') + ' ',
              h('strong', { key: 'v' }, new Date(snapshot.generatedAt).toLocaleTimeString()),
            ])
            : null,
          h('button', {
            key: 'refresh',
            type: 'button',
            className: 'ml-btn',
            disabled: state.status === 'loading' || state.status === 'refreshing',
            onClick: () => load(true),
          }, state.status === 'refreshing' ? t('panel.refreshing') : t('panel.refresh')),
        ]),
      ]))

      const tile = (key, labelKey, value, sub) => h('div', { key, className: 'ml-stat' }, [
        h('div', { key: 'l', className: 'ml-stat-label' }, t(labelKey)),
        h('div', { key: 'v', className: 'ml-stat-value', title: value }, value),
        sub ? h('div', { key: 's', className: 'ml-stat-sub', title: sub }, sub) : null,
      ])

      const stats = snapshot ? (() => {
        let popular = null
        let cheapest = null
        for (const row of rows) {
          if (typeof row.tokens === 'number' && (popular === null || row.tokens > popular.tokens)) popular = row
          if (typeof row.blended === 'number' && row.blended > 0
            && (cheapest === null || row.blended < cheapest.blended)) cheapest = row
        }
        const current = snapshot.current
        return h('div', { className: 'ml-stats' }, [
          tile('current', 'panel.current',
            current ? current.model : t('panel.none'),
            current
              ? current.provider + (current.reasoningEffort ? ' · ' + t('stat.effort') + ' ' + current.reasoningEffort : '')
              : ''),
          tile('models', 'stat.models',
            String(snapshot.models?.length ?? 0),
            t('stat.categories') + ' ' + String(snapshot.arenaCategories?.length ?? 0)),
          tile('popular', 'board.popular',
            popular ? popular.name : '—',
            popular ? fmtTokens(popular.tokens) + ' ' + t('stat.tokens') : ''),
          tile('cheapest', 'board.cheapest',
            cheapest ? cheapest.name : '—',
            cheapest ? fmtPrice(cheapest.blended) + '/M' : ''),
        ])
      })() : null

      const notices = []
      if (notice) {
        notices.push(h('div', {
          key: 'n', className: 'ml-notice ml-notice-' + notice.kind, role: 'status',
        }, notice.text))
      }
      if (state.status === 'error') {
        notices.push(h('div', { key: 'e', className: 'ml-notice ml-notice-error', role: 'alert' }, [
          t('panel.error') + ': ' + String(state.error) + ' ',
          h('button', {
            key: 'r', type: 'button', className: 'ml-btn', onClick: () => load(true),
          }, t('panel.retry')),
        ]))
      }
      if (snapshot && snapshot.keyConfigured === false) {
        notices.push(h('div', { key: 'k', className: 'ml-notice ml-notice-warn' }, t('panel.noKey')))
      }
      if (snapshot) {
        for (const [name, source] of Object.entries(snapshot.sources ?? {})) {
          if (source?.error) {
            const label = t('source.' + name)
            notices.push(h('div', {
              key: 's' + name, className: 'ml-notice ml-notice-warn',
            }, (label === 'source.' + name ? name : label) + ' — ' + t('source.failed') + ': ' + source.error))
          }
        }
      }

      const tabs = h('div', { className: 'ml-tabs', role: 'tablist' }, [
        ['boards', 'tab.boards'], ['value', 'tab.value'], ['quality', 'tab.quality'],
        ['usage', 'tab.usage'], ['price', 'tab.price'],
      ].map(([id, key]) => h('button', {
        key: id,
        type: 'button',
        role: 'tab',
        className: 'ml-tab',
        'aria-selected': tab === id ? 'true' : 'false',
        onClick: () => setTab(id),
      }, t(key))))

      let body = null
      if (state.status === 'loading' && !snapshot) {
        body = h('p', { className: 'ml-note' }, t('panel.loading'))
      } else if (snapshot) {
        if (tab === 'boards') {
          const spec = BOARD_SPECS.find((entry) => entry.id === board) ?? BOARD_SPECS[0]
          body = h('div', null, [
            h('div', { key: 'b', className: 'ml-boards', role: 'group', 'aria-label': t('tab.boards') },
              BOARD_SPECS.map((entry) => h('button', {
                key: entry.id,
                type: 'button',
                className: 'ml-board',
                'aria-pressed': board === entry.id ? 'true' : 'false',
                onClick: () => setBoard(entry.id),
              }, t('board.' + entry.id)))),
            h(FilterBar, {
              key: 'f',
              t,
              filters,
              vendors,
              shown: Math.min(boardUsable(spec, filtered).length, 30),
              total: boardUsable(spec, filtered).length,
              onReset: resetFilters,
            }),
            h('div', { key: 'c', className: 'ml-card' }, [
              h('h3', { key: 'h' }, t('board.' + spec.id)),
              h('p', { key: 'x', className: 'ml-note' }, t('board.' + spec.id + 'Hint')),
              h(BoardTable, {
                key: spec.id, spec, rows: filtered, t, busy, onSetDefault: setDefault, onCopyId: copyId, limit: 30,
              }),
            ]),
          ])
        } else if (tab === 'value') {
          const scored = filtered.filter((row) => row.score !== undefined)
          const sorted = value.apply(scored)
          body = h('div', null, [
            h('p', { key: 'x', className: 'ml-note' }, t('value.explainer')),
            h(FilterBar, {
              key: 'f', t, filters, vendors, shown: scored.length, total: scored.length, onReset: resetFilters,
            }),
            h('div', { key: 'c', className: 'ml-card' }, [
              h('h3', { key: 'h' }, t('tab.value')),
              h(Scatter, {
                key: 's',
                rows: filtered,
                t,
                pinned,
                onTogglePin: togglePin,
                onClearPins: clearPins,
              }),
              h('div', { key: 'l', className: 'ml-legend' }, [
                h('span', { key: 'on' }, [h('i', { key: 'i', className: 'ml-on' }), t('badge.available')]),
                h('span', { key: 'off' }, [h('i', { key: 'i', className: 'ml-off' }), t('badge.unavailable')]),
              ]),
            ]),
            h('div', { key: 't', className: 'ml-scroll' }, h('table', { className: 'ml-table' }, [
              h('thead', { key: 'h' }, h('tr', null, [
                h('th', { key: 'r', className: 'ml-nosort', scope: 'col' }, t('col.rank')),
                h('th', { key: 'm', className: 'ml-nosort', scope: 'col' }, t('col.model')),
                h(SortHeader, { key: 'sc', label: t('col.score'), sortKey: 'score', sort: value.sort, onToggle: value.toggle, numeric: true }),
                h(SortHeader, { key: 'i', label: t('col.intelligence'), sortKey: 'intelligence', sort: value.sort, onToggle: value.toggle, numeric: true }),
                h(SortHeader, { key: 'b', label: t('col.blended'), sortKey: 'blended', sort: value.sort, onToggle: value.toggle, numeric: true }),
                h(SortHeader, { key: 'pi', label: t('col.priceIn'), sortKey: 'priceIn', sort: value.sort, onToggle: value.toggle, numeric: true }),
                h(SortHeader, { key: 'po', label: t('col.priceOut'), sortKey: 'priceOut', sort: value.sort, onToggle: value.toggle, numeric: true }),
                h('th', { key: 'st', className: 'ml-nosort', scope: 'col' }, t('col.status')),
                h('th', { key: 'a', className: 'ml-nosort', scope: 'col' }, t('col.actions')),
              ])),
              h('tbody', { key: 'b' }, sorted.length === 0
                ? h('tr', null, h('td', { colSpan: 9 }, h('p', { className: 'ml-note' }, t('panel.empty'))))
                : sorted.map((row, index) => h('tr', { key: row.id }, [
                  h('td', { key: 'r', className: 'ml-num' }, String(index + 1)),
                  h('td', { key: 'm' }, h(ModelCell, { row })),
                  h('td', { key: 'sc', className: 'ml-num' }, fmtMetric(row.score)),
                  h('td', { key: 'i', className: 'ml-num' }, fmtMetric(row.intelligence)),
                  h('td', { key: 'b', className: 'ml-num' }, fmtPrice(row.blended)),
                  h('td', { key: 'pi', className: 'ml-num' }, fmtPrice(row.priceIn)),
                  h('td', { key: 'po', className: 'ml-num' }, fmtPrice(row.priceOut)),
                  h('td', { key: 'st' }, h(StatusBadge, { row, t })),
                  h('td', { key: 'a' }, h('div', { className: 'ml-actions' }, [
                    h('button', {
                      key: 's', type: 'button', className: 'ml-btn ml-btn-primary',
                      disabled: busy === row.id, onClick: () => setDefault(row),
                    }, t('action.setDefault')),
                    h('button', {
                      key: 'c', type: 'button', className: 'ml-btn', onClick: () => copyId(row),
                    }, t('action.copyId')),
                  ])),
                ]))),
            ])),
          ])
        } else if (tab === 'quality') {
          const categories = snapshot.arenaCategories ?? []
          const active = eloCategory ?? (categories[0]?.category ?? null)
          // Elo is only meaningful inside one category, so the selector drives
          // the table as well as the chart: a model with no Elo in the selected
          // category shows a dash rather than a score from another scale.
          const qualityRows = filtered.map((row) => {
            const entry = active === null ? undefined : row.elos?.[active]
            return entry === undefined
              ? { ...row, elo: undefined, winRate: undefined }
              : { ...row, elo: entry.elo, winRate: entry.winRate }
          })
          const eloRows = qualityRows.filter((row) => typeof row.elo === 'number')
          const ranked = qualityRows.filter((row) => typeof row.intelligence === 'number'
            || typeof row.elo === 'number')
          const sorted = quality.apply(ranked)
          const eloLabel = t('col.elo') + (active === null ? '' : ' · ' + active)
          const categorySelect = categories.length === 0 ? null : h('span', {
            key: 'cat', className: 'ml-filters-inline',
          }, [
            h('label', { key: 'l', htmlFor: 'ml-elo-cat' }, t('filter.category')),
            h('select', {
              key: 's',
              id: 'ml-elo-cat',
              className: 'ml-select',
              value: active ?? '',
              onChange: (event) => setEloCategory(event.target.value),
            }, categories.map((entry) => h('option', {
              key: entry.category, value: entry.category,
            }, entry.category + ' (' + entry.count + ')'))),
          ])
          body = h('div', null, [
            h('p', { key: 'x', className: 'ml-note' }, t('quality.explainer')),
            h(FilterBar, {
              key: 'f',
              t,
              filters,
              vendors,
              shown: ranked.length,
              total: ranked.length,
              onReset: resetFilters,
              extra: categorySelect,
            }),
            h('div', { key: 'b', className: 'ml-card' }, [
              h('h3', { key: 'h' }, t('metric.intelligence')),
              h(Bars, { key: 'c', rows: qualityRows, t, metric: 'intelligence', format: (v) => fmtMetric(v) }),
            ]),
            categories.length > 0
              ? h('div', { key: 'e', className: 'ml-card' }, [
                h('h3', { key: 'h' }, t('board.elo')),
                h(Bars, {
                  key: 'c',
                  rows: eloRows,
                  t,
                  metric: 'elo',
                  format: (v) => fmtMetric(v, 0),
                }),
              ])
              : null,
            h('div', { key: 't', className: 'ml-scroll' }, h('table', { className: 'ml-table' }, [
              h('thead', { key: 'h' }, h('tr', null, [
                h('th', { key: 'm', className: 'ml-nosort', scope: 'col' }, t('col.model')),
                h(SortHeader, { key: 'i', label: t('col.intelligence'), sortKey: 'intelligence', sort: quality.sort, onToggle: quality.toggle, numeric: true }),
                h(SortHeader, { key: 'c', label: t('col.coding'), sortKey: 'coding', sort: quality.sort, onToggle: quality.toggle, numeric: true }),
                h(SortHeader, { key: 'a', label: t('col.agentic'), sortKey: 'agentic', sort: quality.sort, onToggle: quality.toggle, numeric: true }),
                h(SortHeader, { key: 'e', label: eloLabel, sortKey: 'elo', sort: quality.sort, onToggle: quality.toggle, numeric: true }),
                h(SortHeader, { key: 'w', label: t('col.winRate'), sortKey: 'winRate', sort: quality.sort, onToggle: quality.toggle, numeric: true }),
                h('th', { key: 'st', className: 'ml-nosort', scope: 'col' }, t('col.status')),
                h('th', { key: 'x', className: 'ml-nosort', scope: 'col' }, t('col.actions')),
              ])),
              h('tbody', { key: 'b' }, sorted.length === 0
                ? h('tr', null, h('td', { colSpan: 8 }, h('p', { className: 'ml-note' }, t('panel.empty'))))
                : sorted.map((row) => h('tr', { key: row.id }, [
                  h('td', { key: 'm' }, h(ModelCell, { row })),
                  h('td', { key: 'i', className: 'ml-num' }, fmtMetric(row.intelligence)),
                  h('td', { key: 'c', className: 'ml-num' }, fmtMetric(row.coding)),
                  h('td', { key: 'a', className: 'ml-num' }, fmtMetric(row.agentic)),
                  h('td', { key: 'e', className: 'ml-num' }, fmtMetric(row.elo, 0)),
                  h('td', { key: 'w', className: 'ml-num' }, typeof row.winRate === 'number' ? fmtMetric(row.winRate) + '%' : '—'),
                  h('td', { key: 'st' }, h(StatusBadge, { row, t })),
                  h('td', { key: 'x' }, h('div', { className: 'ml-actions' }, [
                    h('button', {
                      key: 's', type: 'button', className: 'ml-btn ml-btn-primary',
                      disabled: busy === row.id, onClick: () => setDefault(row),
                    }, t('action.setDefault')),
                    h('button', {
                      key: 'c', type: 'button', className: 'ml-btn', onClick: () => copyId(row),
                    }, t('action.copyId')),
                  ])),
                ]))),
            ])),
          ])
        } else if (tab === 'usage') {
          const metered = filtered.filter((row) => typeof row.tokens === 'number')
          const sorted = usage.apply(metered)
          body = h('div', null, [
            h('p', { key: 'x', className: 'ml-note' }, t('usage.explainer')),
            h(FilterBar, {
              key: 'f',
              t,
              filters,
              vendors,
              shown: metered.length,
              total: metered.length,
              onReset: resetFilters,
            }),
            h('div', { key: 'b', className: 'ml-card' }, [
              h('h3', { key: 'h' }, t('col.tokens')),
              h(Bars, { key: 'c', rows: metered, t, metric: 'tokens', format: fmtTokens }),
            ]),
            snapshot.classifications?.tasks?.length
              ? h('div', { key: 't', className: 'ml-card' }, [
                h('h3', { key: 'h' }, t('tasks.title')),
                h('div', { className: 'ml-bars' }, snapshot.classifications.tasks.slice(0, 12).map((task) => h('div', {
                  key: task.tag, className: 'ml-bar-row',
                }, [
                  h('div', { key: 'n', className: 'ml-bar-name', title: task.tag }, task.label ?? task.tag),
                  h('div', { key: 't', className: 'ml-bar-track' },
                    h('div', { className: 'ml-bar-fill', style: { width: Math.max(1, (task.usageShare ?? 0) * 100) + '%' } })),
                  h('div', { key: 'v', className: 'ml-bar-value' }, ((task.usageShare ?? 0) * 100).toFixed(1) + '%'),
                ]))),
              ])
              : null,
            h('div', { key: 's', className: 'ml-scroll' }, h('table', { className: 'ml-table' }, [
              h('thead', { key: 'h' }, h('tr', null, [
                h('th', { key: 'r', className: 'ml-nosort', scope: 'col' }, t('col.rank')),
                h('th', { key: 'm', className: 'ml-nosort', scope: 'col' }, t('col.model')),
                h(SortHeader, { key: 't', label: t('col.tokens'), sortKey: 'tokens', sort: usage.sort, onToggle: usage.toggle, numeric: true }),
                h(SortHeader, { key: 'g', label: t('board.trending'), sortKey: 'growth', sort: usage.sort, onToggle: usage.toggle, numeric: true }),
                h('th', { key: 'd', className: 'ml-nosort', scope: 'col' }, t('col.trend')),
                h('th', { key: 'st', className: 'ml-nosort', scope: 'col' }, t('col.status')),
                h('th', { key: 'x', className: 'ml-nosort', scope: 'col' }, t('col.actions')),
              ])),
              h('tbody', { key: 'b' }, sorted.length === 0
                ? h('tr', null, h('td', { colSpan: 7 }, h('p', { className: 'ml-note' }, t('panel.empty'))))
                : sorted.map((row, index) => h('tr', { key: row.id }, [
                  h('td', { key: 'r', className: 'ml-num' }, String(index + 1)),
                  h('td', { key: 'm' }, h(ModelCell, { row })),
                  h('td', { key: 't', className: 'ml-num' }, fmtTokens(row.tokens)),
                  h('td', {
                    key: 'g',
                    className: 'ml-num' + (typeof row.growth === 'number' ? (row.growth >= 0 ? ' ml-up' : ' ml-down') : ''),
                  }, fmtSignedTokens(row.growth)),
                  h('td', { key: 'd' }, h(Spark, { series: row.series })),
                  h('td', { key: 'st' }, h(StatusBadge, { row, t })),
                  h('td', { key: 'x' }, h('div', { className: 'ml-actions' }, [
                    h('button', {
                      key: 's', type: 'button', className: 'ml-btn ml-btn-primary',
                      disabled: busy === row.id, onClick: () => setDefault(row),
                    }, t('action.setDefault')),
                    h('button', {
                      key: 'c', type: 'button', className: 'ml-btn', onClick: () => copyId(row),
                    }, t('action.copyId')),
                  ])),
                ]))),
            ])),
          ])
        } else {
          const sorted = price.apply(filtered)
          body = h('div', null, [
            h('p', { key: 'x', className: 'ml-note' }, t('price.explainer')),
            h(FilterBar, {
              key: 'f',
              t,
              filters,
              vendors,
              shown: Math.min(sorted.length, 400),
              total: sorted.length,
              onReset: resetFilters,
            }),
            h('div', { key: 't', className: 'ml-scroll' }, h('table', { className: 'ml-table' }, [
              h('thead', { key: 'h' }, h('tr', null, [
                h('th', { key: 'm', className: 'ml-nosort', scope: 'col' }, t('col.model')),
                h(SortHeader, { key: 'b', label: t('col.blended'), sortKey: 'blended', sort: price.sort, onToggle: price.toggle, numeric: true }),
                h(SortHeader, { key: 'pi', label: t('col.priceIn'), sortKey: 'priceIn', sort: price.sort, onToggle: price.toggle, numeric: true }),
                h(SortHeader, { key: 'po', label: t('col.priceOut'), sortKey: 'priceOut', sort: price.sort, onToggle: price.toggle, numeric: true }),
                h(SortHeader, { key: 'c', label: t('col.context'), sortKey: 'contextLength', sort: price.sort, onToggle: price.toggle, numeric: true }),
                h(SortHeader, { key: 'i', label: t('col.intelligence'), sortKey: 'intelligence', sort: price.sort, onToggle: price.toggle, numeric: true }),
                h(SortHeader, { key: 'n', label: t('board.newest'), sortKey: 'created', sort: price.sort, onToggle: price.toggle, numeric: true }),
                h('th', { key: 'st', className: 'ml-nosort', scope: 'col' }, t('col.status')),
                h('th', { key: 'x', className: 'ml-nosort', scope: 'col' }, t('col.actions')),
              ])),
              h('tbody', { key: 'b' }, sorted.length === 0
                ? h('tr', null, h('td', { colSpan: 9 }, h('p', { className: 'ml-note' }, t('panel.empty'))))
                : sorted.slice(0, 400).map((row) => [
                h('tr', { key: row.id }, [
                  h('td', { key: 'm' }, h(ModelCell, { row })),
                  h('td', { key: 'b', className: 'ml-num' }, fmtPrice(row.blended)),
                  h('td', { key: 'pi', className: 'ml-num' }, fmtPrice(row.priceIn)),
                  h('td', { key: 'po', className: 'ml-num' }, fmtPrice(row.priceOut)),
                  h('td', { key: 'c', className: 'ml-num' }, fmtContext(row.contextLength)),
                  h('td', { key: 'i', className: 'ml-num' }, fmtMetric(row.intelligence)),
                  h('td', { key: 'n', className: 'ml-num' }, fmtDate(row.created)),
                  h('td', { key: 'st' }, h(StatusBadge, { row, t })),
                  h('td', { key: 'x' }, h('div', { className: 'ml-actions' }, [
                    h('button', {
                      key: 's', type: 'button', className: 'ml-btn ml-btn-primary',
                      disabled: busy === row.id, onClick: () => setDefault(row),
                    }, t('action.setDefault')),
                    h('button', {
                      key: 'c', type: 'button', className: 'ml-btn', onClick: () => copyId(row),
                    }, t('action.copyId')),
                    h('button', {
                      key: 'p', type: 'button', className: 'ml-btn',
                      onClick: () => setExpanded(expanded === row.id ? null : row.id),
                    }, expanded === row.id ? t('action.collapse') : t('action.expand')),
                  ])),
                ]),
                expanded === row.id
                  ? h('tr', { key: row.id + ':p' }, h('td', { colSpan: 9 }, h(ProviderDetail, { rowId: row.id, t })))
                  : null,
              ])),
            ])),
          ])
        }
      }

      return h('div', { className: 'ml-root' }, [
        h('style', { key: 'css' }, CSS),
        header,
        h('div', { key: 'main', className: 'ml-shell' }, [
          stats,
          ...notices,
          tabs,
          body,
          h('p', { key: 'attr', className: 'ml-foot' }, t('attribution')),
        ]),
      ])
    }

    // -------------------------------------------------------------- icon

    function LadderIcon(props) {
      const size = typeof props?.size === 'number' ? props.size : 16
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block' },
      }, [
        h('path', { key: 'a', d: 'M4 20h4V12H4z' }),
        h('path', { key: 'b', d: 'M10 20h4V7h-4z' }),
        h('path', { key: 'c', d: 'M16 20h4V3h-4z' }),
      ])
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        pluginCtx = ctx

        ctx.effect(() => ctx.locale.register('model-leaderboard', 'en', EN))
        ctx.effect(() => ctx.locale.register('model-leaderboard', 'zh', ZH))

        const t = ctx.locale.bind('model-leaderboard')

        ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'model-leaderboard',
          order: 40,
          label: () => t('panel.title'),
        }, LadderIcon)))

        ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'model-leaderboard',
        }, Panel)))
      },
    }
  },
})
