/**
 * Host half of the Model leaderboard bundle.
 *
 * Two jobs, both owned by this package:
 *  1. Fetch the public OpenRouter model catalog plus the key-gated OpenRouter
 *     Data API datasets (benchmarks, daily usage, task classifications), cache
 *     them, and serve one assembled snapshot to the Client half over a
 *     same-origin HTTP route.
 *  2. Write a model the user picked in the panel into the profile's
 *     default-model row, so new sessions start on it.
 *
 * The Client half never talks to openrouter.ai directly: the browser would hit
 * CORS, and the API key must stay on this side.
 */

const OPENROUTER_API = 'https://openrouter.ai/api/v1'
const ROUTE_PREFIX = '/api/model-leaderboard'

/** Credential reference names tried in order for the OpenRouter key. */
const KEY_REFS = ['OPENROUTER_API_KEY']

const TTL = {
  models: 30 * 60 * 1000,
  benchmarks: 10 * 60 * 1000,
  usage: 10 * 60 * 1000,
  classifications: 10 * 60 * 1000,
}

export function apply(ctx) {
  const webServer = ctx.get('webServer')
  if (webServer === undefined) {
    ctx.logger?.warn?.('model-leaderboard: no webServer in this composition; panel data route not registered')
    return
  }

  /** name -> { at, value, error, pending } */
  const cache = new Map()

  const num = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  /** OpenRouter prices are USD per token; the panel speaks USD per million. */
  const perMillion = (value) => {
    const parsed = num(value)
    // OpenRouter sends pricing.prompt = -1 as its "variable pricing" sentinel
    // for router endpoints. Scaling that would surface as -$1,000,000 and put
    // those rows at the top of every cheapest-first sort.
    if (parsed === undefined || parsed < 0) return undefined
    // Round the token->million scaling so 0.0000001405 does not surface as
    // 0.14049999999999999.
    return Math.round(parsed * 1e6 * 1e6) / 1e6
  }

  /**
   * Artificial Analysis reports 0 for an index it has not evaluated for a
   * model, so 0 means "not reported" here rather than a real score.
   */
  const index = (value) => {
    const parsed = num(value)
    return parsed === undefined || parsed === 0 ? undefined : parsed
  }

  /**
   * Ranking permaslugs carry decorations DSH's own catalog does not: a
   * `-YYYYMMDD` release date, and sometimes a `:variant` suffix. The date is
   * cosmetic and is stripped for matching; the variant is NOT, because
   * `vendor/model:free` and `vendor/model` are different routes with different
   * prices and must never collide on one lookup key.
   */
  const stripDate = (value) => String(value)
    .replace(/-\d{4}-\d{2}-\d{2}$/, '')
    .replace(/-\d{8}$/, '')
  const stripVariant = (value) => String(value).replace(/:[^:]*$/, '')
  const variantOf = (value) => {
    const text = String(value)
    const at = text.indexOf(':')
    return at < 0 ? '' : text.slice(at)
  }

  async function resolveKey() {
    const credentials = ctx.get('credentials')
    if (credentials !== undefined) {
      for (const ref of KEY_REFS) {
        try {
          const resolved = await credentials.resolve(ref)
          if (resolved !== undefined && typeof resolved.value === 'string' && resolved.value !== '') {
            return resolved.value
          }
        } catch {
          // A missing or unreadable reference is not fatal: fall through to the
          // ambient environment before giving up on the key-gated datasets.
        }
      }
    }
    for (const ref of KEY_REFS) {
      const ambient = globalThis.process?.env?.[ref]
      if (typeof ambient === 'string' && ambient !== '') return ambient
    }
    return undefined
  }

  async function getJson(url, key) {
    const fetchImpl = globalThis.fetch
    if (typeof fetchImpl !== 'function') throw new Error('no fetch implementation in this runtime')
    const headers = { accept: 'application/json' }
    if (key !== undefined) headers.authorization = `Bearer ${key}`
    const response = await fetchImpl(url, { headers })
    if (!response.ok) {
      const detail = response.status === 401 || response.status === 403
        ? 'OpenRouter rejected the API key'
        : `${response.status} ${response.statusText}`
      throw new Error(detail)
    }
    return response.json()
  }

  /**
   * Read through one cache entry. A failed refresh keeps the previous value and
   * records the failure, so a transient upstream error degrades the panel
   * instead of emptying it.
   */
  async function load(name, ttlMs, loader, force) {
    const entry = cache.get(name)
    const now = Date.now()
    if (!force && entry !== undefined && entry.value !== undefined && now - entry.at < ttlMs) {
      return entry
    }
    if (entry !== undefined && entry.pending !== undefined) return entry.pending
    const pending = (async () => {
      try {
        const value = await loader()
        const next = { at: Date.now(), value, error: undefined }
        cache.set(name, next)
        return next
      } catch (error) {
        const next = {
          at: entry?.at ?? 0,
          value: entry?.value,
          error: error instanceof Error ? error.message : String(error),
        }
        cache.set(name, next)
        return next
      }
    })()
    cache.set(name, { ...(entry ?? {}), pending })
    return pending
  }

  // ---------------------------------------------------------------- shaping

  function shapeModels(payload) {
    const rows = Array.isArray(payload?.data) ? payload.data : []
    const models = []
    for (const row of rows) {
      if (row === null || typeof row !== 'object') continue
      if (typeof row.id !== 'string') continue
      models.push({
        id: row.id,
        name: typeof row.name === 'string' && row.name !== '' ? row.name : row.id,
        created: num(row.created),
        contextLength: num(row.context_length) ?? num(row.top_provider?.context_length),
        maxCompletionTokens: num(row.top_provider?.max_completion_tokens),
        inputModalities: Array.isArray(row.architecture?.input_modalities)
          ? row.architecture.input_modalities
          : [],
        priceIn: perMillion(row.pricing?.prompt),
        priceOut: perMillion(row.pricing?.completion),
        priceCacheRead: perMillion(row.pricing?.input_cache_read),
      })
    }
    return models
  }

  function shapeBenchmarks(payload) {
    const rows = Array.isArray(payload?.data) ? payload.data : []
    const out = []
    for (const row of rows) {
      if (row === null || typeof row !== 'object') continue
      if (typeof row.model_permaslug !== 'string') continue
      out.push({
        id: row.model_permaslug,
        name: typeof row.display_name === 'string' && row.display_name !== ''
          ? row.display_name
          : row.model_permaslug,
        intelligence: index(row.intelligence_index),
        coding: index(row.coding_index),
        agentic: index(row.agentic_index),
        priceIn: perMillion(row.pricing?.prompt),
        priceOut: perMillion(row.pricing?.completion),
      })
    }
    return out
  }

  /**
   * Design Arena publishes one Elo per model *per category*, so a model appears
   * up to eight times. Keep every (model, category) pair flat and let the panel
   * group or filter it; collapsing here would throw away the category the user
   * wants to rank within.
   */
  function shapeArena(payload) {
    const rows = Array.isArray(payload?.data) ? payload.data : []
    const seen = new Set()
    const out = []
    for (const row of rows) {
      if (row === null || typeof row !== 'object') continue
      if (typeof row.model_permaslug !== 'string') continue
      const elo = num(row.elo)
      if (elo === undefined) continue
      const category = typeof row.category === 'string' && row.category !== ''
        ? row.category
        : 'overall'
      const key = `${row.model_permaslug}|${category}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        id: row.model_permaslug,
        name: typeof row.display_name === 'string' && row.display_name !== ''
          ? row.display_name
          : row.model_permaslug,
        category,
        elo,
        winRate: num(row.win_rate),
        priceIn: perMillion(row.pricing?.prompt),
        priceOut: perMillion(row.pricing?.completion),
      })
    }
    return out
  }

  /**
   * Split the fetched window into a recent half and the baseline before it, so
   * "most popular" and "trending" come from the same request. Trending is the
   * absolute excess token growth, matching how OpenRouter ranks apps.
   */
  function shapeUsage(payload) {
    const rows = Array.isArray(payload?.data) ? payload.data : []
    const byModel = new Map()
    const days = new Set()
    for (const row of rows) {
      if (row === null || typeof row !== 'object') continue
      const id = row.model_permaslug
      // `other` is OpenRouter's aggregated long-tail row, not a model.
      if (typeof id !== 'string' || id === 'other') continue
      const tokens = Number(row.total_tokens)
      if (!Number.isFinite(tokens)) continue
      if (typeof row.date === 'string') days.add(row.date)
      const current = byModel.get(id) ?? { id, series: [] }
      current.series.push({ date: row.date, tokens })
      byModel.set(id, current)
    }

    const ordered = [...days].sort()
    const recentDays = new Set(ordered.slice(-7))
    const models = [...byModel.values()]
    for (const model of models) {
      model.series.sort((a, b) => String(a.date).localeCompare(String(b.date)))
      let recent = 0
      let previous = 0
      for (const point of model.series) {
        if (recentDays.has(point.date)) recent += point.tokens
        else previous += point.tokens
      }
      model.tokens = recent
      model.previous = previous
      model.growth = recent - previous
      model.series = model.series.filter((point) => recentDays.has(point.date))
    }
    models.sort((a, b) => b.tokens - a.tokens)
    return {
      asOf: payload?.meta?.as_of,
      days: ordered,
      recentDays: [...recentDays].sort(),
      models,
    }
  }

  function shapeClassifications(payload) {
    const data = payload?.data
    if (data === null || typeof data !== 'object') return { asOf: undefined, macro: [], tasks: [] }
    const macro = Array.isArray(data.macro_categories)
      ? data.macro_categories.map((row) => ({
        key: row?.key,
        label: row?.label,
        usageShare: num(row?.usage_share),
        tokenShare: num(row?.token_share),
      }))
      : []
    const tasks = Array.isArray(data.classifications)
      ? data.classifications.map((row) => ({
        tag: row?.tag,
        label: row?.display_name,
        macro: row?.macro_category,
        usageShare: num(row?.usage_share),
        tokenShare: num(row?.token_share),
        models: Array.isArray(row?.models)
          ? row.models.map((m) => ({
            id: m?.id,
            usageShare: num(m?.tag_usage_share),
            tokenShare: num(m?.tag_token_share),
          }))
          : [],
      }))
      : []
    return { asOf: data.as_of, macro, tasks }
  }

  // ------------------------------------------------------- DSH-side catalog

  /**
   * Which provider/model routes this DSH can actually route right now. The
   * panel marks ladder entries against this, so a ranking never looks
   * selectable when the adapter would refuse it.
   */
  async function dshCatalog() {
    const llm = ctx.get('llm')
    if (llm === undefined) return { providers: [], models: [], error: 'llm service unavailable' }
    try {
      const providers = await llm.listProviders()
      const models = []
      for (const provider of providers) {
        try {
          const listed = await llm.listModels(provider.id)
          for (const model of listed) {
            models.push({ provider: provider.id, id: model.id, name: model.name ?? model.id })
          }
        } catch (error) {
          models.push({
            provider: provider.id,
            id: '',
            name: '',
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
      return { providers, models }
    } catch (error) {
      return { providers: [], models: [], error: error instanceof Error ? error.message : String(error) }
    }
  }

  function currentSelection() {
    const service = ctx.get('agentDefaultModel')
    if (service === undefined) return undefined
    try {
      return service.currentSelection()
    } catch {
      return undefined
    }
  }

  // ------------------------------------------------------------- assembling

  async function snapshot(force) {
    const key = await resolveKey()
    const keyConfigured = key !== undefined

    // Fourteen days: the newest seven answer "most popular", the seven before
    // them are the baseline "trending" is measured against.
    const end = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const start = new Date(end.getTime() - 13 * 24 * 60 * 60 * 1000)
    const iso = (date) => date.toISOString().slice(0, 10)

    const [models, artificialAnalysis, designArena, usage, classifications, catalog] = await Promise.all([
      load('models', TTL.models, () => getJson(`${OPENROUTER_API}/models`), force),
      keyConfigured
        ? load(
          'benchmarks-aa',
          TTL.benchmarks,
          () => getJson(`${OPENROUTER_API}/benchmarks?source=artificial-analysis&max_results=100`, key),
          force,
        )
        : Promise.resolve({ error: undefined, value: undefined }),
      keyConfigured
        ? load(
          'benchmarks-arena',
          TTL.benchmarks,
          () => getJson(`${OPENROUTER_API}/benchmarks?source=design-arena&arena=models&max_results=100`, key),
          force,
        )
        : Promise.resolve({ error: undefined, value: undefined }),
      keyConfigured
        ? load(
          'usage',
          TTL.usage,
          () => getJson(
            `${OPENROUTER_API}/datasets/rankings-daily?start_date=${iso(start)}&end_date=${iso(end)}`,
            key,
          ),
          force,
        )
        : Promise.resolve({ error: undefined, value: undefined }),
      keyConfigured
        ? load(
          'classifications',
          TTL.classifications,
          () => getJson(`${OPENROUTER_API}/classifications/task?window=7d`, key),
          force,
        )
        : Promise.resolve({ error: undefined, value: undefined }),
      dshCatalog(),
    ])

    const sources = {
      models: { error: models.error, asOf: undefined },
      artificialAnalysis: { error: artificialAnalysis.error, asOf: undefined },
      designArena: { error: designArena.error, asOf: undefined },
      usage: { error: usage.error, asOf: usage.value?.meta?.as_of },
      classifications: { error: classifications.error, asOf: classifications.value?.data?.as_of },
    }

    // One lookup the Client half can use directly: OpenRouter permaslug ->
    // the exact provider/model route this DSH can actually dispatch. Keyed by
    // the exact catalog id and by its date-stripped form, with the variant
    // preserved in both, so `x:free` and `x` stay distinct routes.
    const catalogRoutes = {}
    for (const model of catalog.models) {
      if (!model.id) continue
      for (const key of new Set([model.id, stripDate(model.id)])) {
        const existing = catalogRoutes[key]
        if (existing === undefined || (model.provider === 'openrouter' && existing.provider !== 'openrouter')) {
          catalogRoutes[key] = { provider: model.provider, id: model.id }
        }
      }
    }

    const arena = shapeArena(designArena.value)
    const arenaCategories = []
    const arenaCounts = new Map()
    for (const row of arena) arenaCounts.set(row.category, (arenaCounts.get(row.category) ?? 0) + 1)
    for (const [category, count] of [...arenaCounts.entries()].sort((a, b) => b[1] - a[1])) {
      arenaCategories.push({ category, count })
    }

    return {
      generatedAt: new Date().toISOString(),
      keyConfigured,
      routePrefix: ROUTE_PREFIX,
      sources,
      current: currentSelection(),
      catalog,
      catalogRoutes,
      models: shapeModels(models.value),
      benchmarks: {
        artificialAnalysis: shapeBenchmarks(artificialAnalysis.value),
        designArena: arena,
      },
      arenaCategories,
      usage: shapeUsage(usage.value),
      classifications: shapeClassifications(classifications.value),
    }
  }

  // ------------------------------------------------------ default-model write

  /**
   * Decide the reasoning effort to write alongside a selection.
   *
   * `saveSelection` replaces the WHOLE selection, so omitting the effort clears
   * it. That makes "I could not check" a destructive answer, which is how a
   * transient adapter failure once silently reset a user's `high` to the adapter
   * default. The rules, in order:
   *
   *  - the model advertises the wanted effort          -> keep it;
   *  - the model advertises no reasoning at all        -> drop it, correctly;
   *  - it advertises efforts but not the wanted one    -> use its default, and
   *                                                       report the drop;
   *  - the adapter cannot be interrogated              -> keep the effort when
   *                                                       the model is unchanged
   *                                                       (it is in use right now,
   *                                                       so it is known-good),
   *                                                       otherwise drop it and
   *                                                       report that.
   *
   * `dropped` is what lets the panel say so instead of the user finding out.
   */
  async function resolveEffort(provider, model, requested, current) {
    const wanted = typeof requested === 'string' && requested !== ''
      ? requested
      : (typeof current?.reasoningEffort === 'string' && current.reasoningEffort !== ''
        ? current.reasoningEffort
        : undefined)
    const unchanged = current !== undefined
      && current.provider === provider
      && current.model === model
    const unresolved = () => ({
      effort: unchanged ? wanted : undefined,
      dropped: !unchanged && wanted !== undefined,
    })

    const llm = ctx.get('llm')
    if (llm === undefined) return unresolved()
    try {
      const info = await llm.resolveModelInfo(provider, model)
      const efforts = info?.reasoning?.efforts
      if (!Array.isArray(efforts) || efforts.length === 0) {
        return { effort: undefined, dropped: wanted !== undefined }
      }
      const ids = efforts.map((effort) => effort.id)
      if (wanted !== undefined && ids.includes(wanted)) return { effort: wanted, dropped: false }
      const fallback = info.reasoning.defaultEffort
      if (typeof fallback === 'string' && ids.includes(fallback)) {
        return { effort: fallback, dropped: wanted !== undefined && wanted !== fallback }
      }
      return { effort: undefined, dropped: wanted !== undefined }
    } catch {
      return unresolved()
    }
  }

  /**
   * Find the provider route that actually serves a model, so the panel never
   * has to hardcode one. Tries the exact id first, then the date-stripped id,
   * then the same pair with the variant dropped — and prefers `openrouter`
   * whenever several providers offer the same id.
   */
  async function resolveRoute(model) {
    const catalog = await dshCatalog()
    const candidates = catalog.models.filter((entry) => entry.id !== '')
    const keys = [model, stripDate(model), stripVariant(model), stripDate(stripVariant(model))]
    const preferred = (pool) => pool.find((entry) => entry.provider === 'openrouter') ?? pool[0]
    for (const key of keys) {
      const exact = candidates.filter((entry) => entry.id === key)
      if (exact.length > 0) return { provider: preferred(exact).provider, model: preferred(exact).id }
    }
    for (const key of keys) {
      const loose = candidates.filter((entry) => stripDate(entry.id) === key)
      if (loose.length > 0) return { provider: preferred(loose).provider, model: preferred(loose).id }
    }
    return undefined
  }

  async function setDefaultModel(input) {
    const service = ctx.get('agentDefaultModel')
    if (service === undefined) {
      return { ok: false, error: 'The default-model service is not mounted in this profile.' }
    }
    const requested = typeof input?.model === 'string' ? input.model : ''
    if (requested === '') return { ok: false, error: 'No model id was supplied.' }

    const route = await resolveRoute(requested)
    const current = currentSelection()
    const provider = typeof input?.provider === 'string' && input.provider !== ''
      ? input.provider
      : (route?.provider ?? current?.provider ?? 'openrouter')
    // Dispatch the id DSH's catalog actually carries, not the dated permaslug
    // the ranking came in under.
    const model = route !== undefined && route.provider === provider ? route.model : requested

    const selection = { provider, model }
    const resolved = await resolveEffort(provider, model, input?.reasoningEffort, current)
    if (resolved.effort !== undefined) selection.reasoningEffort = resolved.effort

    try {
      await service.saveSelection(selection)
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
    return {
      ok: true,
      selection: currentSelection() ?? selection,
      routed: route !== undefined,
      // A `:free` row that resolved to the paid route is a different model at a
      // different price, so the panel must say so rather than call it available.
      variantPreserved: variantOf(model) === variantOf(requested),
      requested,
      // True when the previous effort could not be carried over, so the panel
      // can say it instead of the user discovering it later.
      effortDropped: resolved.dropped,
    }
  }

  // ------------------------------------------------------------------ routes

  function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }

  async function handle(request) {
    const url = new URL(request.url)
    const suffix = url.pathname.slice(ROUTE_PREFIX.length)

    if (suffix === '/snapshot') {
      if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'method not allowed' }, 405)
      const force = url.searchParams.get('refresh') === '1'
      return json(await snapshot(force))
    }

    if (suffix === '/endpoints') {
      if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'method not allowed' }, 405)
      const id = url.searchParams.get('id') ?? ''
      if (!/^[A-Za-z0-9._:/-]+$/.test(id) || id.includes('..')) {
        return json({ error: 'invalid model id' }, 400)
      }
      const key = await resolveKey()
      const entry = await load(`endpoints:${id}`, TTL.models, async () => {
        const payload = await getJson(`${OPENROUTER_API}/models/${id}/endpoints`, key)
        const endpoints = Array.isArray(payload?.data?.endpoints) ? payload.data.endpoints : []
        return endpoints.map((endpoint) => ({
          provider: endpoint?.provider_name,
          tag: endpoint?.tag,
          quantization: endpoint?.quantization,
          contextLength: num(endpoint?.context_length),
          maxCompletionTokens: num(endpoint?.max_completion_tokens),
          priceIn: perMillion(endpoint?.pricing?.prompt),
          priceOut: perMillion(endpoint?.pricing?.completion),
          priceCacheRead: perMillion(endpoint?.pricing?.input_cache_read),
          uptime1d: num(endpoint?.uptime_last_1d),
          latencyMs: num(endpoint?.latency_last_30m),
          throughput: num(endpoint?.throughput_last_30m),
          status: num(endpoint?.status),
        }))
      }, false)
      if (entry.error !== undefined && entry.value === undefined) {
        return json({ error: entry.error, endpoints: [] })
      }
      return json({ id, error: entry.error, endpoints: entry.value ?? [] })
    }

    if (suffix === '/default-model') {
      // Reached only when this path is requested without the exact route below
      // claiming it; the write itself lives in `handleDefaultModel`.
      return json({ error: 'method not allowed' }, 405)
    }

    return json({ error: 'not found' }, 404)
  }

  /**
   * A `resource` route is GET/HEAD only, so the one write endpoint is a
   * `handler` route that owns the whole Node response lifecycle.
   */
  function sendJson(res, status, body) {
    const text = JSON.stringify(body)
    res.statusCode = status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'no-store')
    res.end(text)
  }

  async function readJsonBody(req) {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    if (chunks.length === 0) return undefined
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }

  /**
   * The webserver enforces no origin policy of its own, so this route owns it.
   * A browser always sends `Origin` on a non-GET request, including a
   * same-origin one; requiring it to match `Host` rejects a cross-origin page
   * reaching the loopback port. A non-browser caller sends no `Origin` and is
   * allowed through, which keeps `curl` usable for diagnosis.
   */
  function sameOrigin(req) {
    const origin = req.headers.origin
    if (origin === undefined) return true
    const host = req.headers.host
    if (host === undefined) return false
    try {
      return new URL(origin).host === host
    } catch {
      return false
    }
  }

  async function handleDefaultModel(req, res) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'method not allowed' })
      return
    }
    if (!sameOrigin(req)) {
      sendJson(res, 403, { ok: false, error: 'cross-origin request refused' })
      return
    }
    // A JSON content type also forces a CORS preflight, which this route never
    // answers, so a simple-request form post cannot reach the write either.
    const contentType = String(req.headers['content-type'] ?? '')
    if (!contentType.toLowerCase().startsWith('application/json')) {
      sendJson(res, 415, { ok: false, error: 'expected application/json' })
      return
    }
    let body
    try {
      body = await readJsonBody(req)
    } catch {
      sendJson(res, 400, { ok: false, error: 'request body is not JSON' })
      return
    }
    const result = await setDefaultModel(body)
    sendJson(res, result.ok ? 200 : 400, result)
  }

  ctx.effect(() => webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    resource: handle,
  }))

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/default-model`,
    handler: handleDefaultModel,
  }))
}
