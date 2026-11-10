// Remembers, in this browser only, the analyses the visitor has run so they can find the output files again.
const KEY = 'idua-analyses'
export function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}
export function saveAnalysis(entry) {
  try {
    const list = loadSaved().filter((e) => e.id !== entry.id)
    localStorage.setItem(KEY, JSON.stringify([entry, ...list].slice(0, 20)))
  } catch {
    /* storage can be blocked; the result page still opens */
  }
}
