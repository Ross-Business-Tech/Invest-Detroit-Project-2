// Where the Python backend lives. On Vercel this comes from the VITE_API_BASE setting (the Render address, no
// trailing slash). When it is empty the live features are switched off and only the pre-computed examples show.
// If the setting is empty, the live site falls back to the backend address named in render.yaml, so uploads work
// without any extra setup. Local development and tests still start with live features off.
const DEFAULT_BACKEND = 'https://invest-detroit-underwriter-api.onrender.com'
export const API = (import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? DEFAULT_BACKEND : '')).replace(/\/+$/, '')
export const liveEnabled = API !== ''

async function request(path, opts) {
  let r
  try {
    r = await fetch(API + path, opts)
  } catch {
    throw new Error('We could not reach the server. If it was asleep, wait a minute and try again.')
  }
  if (!r.ok) {
    let msg = 'Something went wrong on the server.'
    try {
      const j = await r.json()
      if (j.detail) msg = typeof j.detail === 'string' ? j.detail : msg
    } catch {
      /* keep the default message */
    }
    throw new Error(msg)
  }
  return r.json()
}

export const getStatus = () => request('/api/status')
export const getLiveDeal = (id) => request(`/api/deals/${encodeURIComponent(id)}/view`)
export const getJob = (id) => request(`/api/jobs/${encodeURIComponent(id)}`)
export const wordUrl = (id) => `${API}/api/deals/${encodeURIComponent(id)}/export.docx`

export const jsonUrl = (id) => `${API}/api/deals/${encodeURIComponent(id)}/export.json`

export function uploadPdfs(files) {
  const body = new FormData()
  for (const f of files) body.append('files', f)
  return request('/api/deals/upload', { method: 'POST', body })
}
