import { jsonUrl, wordUrl } from '../api.js'
import { loadSaved } from '../saved.js'

const ago = (t) => {
  const m = Math.round((Date.now() - t) / 60000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`
}

// The output side of the workspace: analyses you ran (kept in this browser) plus the example analyses, each with its files.
export default function Outputs({ examples, version }) {
  const mine = loadSaved() // version changes after a new analysis so this list re-reads
  return (
    <section className="panel work-panel" aria-labelledby="out-h" data-v={version}>
      <div className="work-head">
        <span className="step-num out">2</span>
        <div>
          <h2 id="out-h">Analysis files</h2>
          <p className="muted small">The Investment Summary, guideline check and flags, ready to open or download.</p>
        </div>
      </div>

      <h3 className="list-title">Your analyses</h3>
      {mine.length === 0 ? (
        <div className="empty">Nothing yet. Analyses you run will appear here with their Word and data files.</div>
      ) : (
        <ul className="outlist">
          {mine.map((a) => (
            <li key={a.id} className="outitem">
              <div className="outname">
                <strong>{a.name}</strong>
                <span className="muted small">{ago(a.when)}</span>
              </div>
              <div className="outactions">
                <a className="chipbtn main" href={`#/live/${a.id}`}>Open</a>
                <a className="chipbtn" href={wordUrl(a.id)} download>Word</a>
                <a className="chipbtn" href={jsonUrl(a.id)} download>Data</a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="list-title">Example analyses</h3>
      {!examples ? (
        <div className="empty">Loading examples…</div>
      ) : (
        <ul className="outlist scroll">
          {examples.map((d) => (
            <li key={d.id} className="outitem">
              <div className="outname">
                <strong>{d.name}</strong>
                <span className="muted small">{d.label}</span>
              </div>
              <div className="outactions">
                <a className="chipbtn main" href={`#/deal/${d.id}`}>Open</a>
                <a className="chipbtn" href={`/demo/${d.id}.docx`} download>Word</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
