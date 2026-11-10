// Small helpers shared by the screens.
export const money = (v) =>
  v == null ? 'n/a' : (v < 0 ? '(' : '') + '$' + Math.abs(Math.round(v)).toLocaleString('en-US') + (v < 0 ? ')' : '')
export const pct = (v, d = 1) => (v == null ? 'n/a' : (v * 100).toFixed(d) + '%')
export const times = (v) => (v == null ? 'n/a' : v.toFixed(2) + 'x')

// Green at or above Invest Detroit's 1.15x minimum, amber from 1.00x, red below.
export const dscrTone = (v) => (v == null ? '' : v >= 1.15 ? 'ok' : v >= 1 ? 'warn' : 'bad')

// Hash routes: #/ (home), #/about, #/analyze, #/deal/<id>[/<tab>] (example), #/live/<id>[/<tab>] (uploaded)
export function parseRoute(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'deal' && parts[1]) return { page: 'deal', id: parts[1], tab: parts[2] || 'summary' }
  if (parts[0] === 'live' && parts[1]) return { page: 'deal', live: true, id: parts[1], tab: parts[2] || 'summary' }
  if (parts[0] === 'analyze') return { page: 'analyze' }
  if (parts[0] === 'about') return { page: 'about' }
  return { page: 'home' }
}
