import { useEffect, useRef, useState } from 'react'
import { getJob, getLiveDeal, getStatus, liveEnabled, uploadPdfs } from '../api.js'
import { saveAnalysis } from '../saved.js'

// The input side of the workspace: drop in PDFs, send them to the backend, follow its progress, then open the result.
export default function Analyze({ onSaved }) {
  const [server, setServer] = useState(liveEnabled ? 'checking' : 'off') // checking | ready | nokey | down | off
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [progress, setProgress] = useState([])
  const [error, setError] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    if (!liveEnabled) return undefined
    let live = true
    getStatus()
      .then((s) => live && setServer(s.llm_available ? 'ready' : 'nokey'))
      .catch(() => live && setServer('down'))
    return () => {
      live = false
      clearTimeout(timer.current)
    }
  }, [])

  function choose(list) {
    const bad = list.find((f) => !f.name.toLowerCase().endsWith('.pdf'))
    setError(bad ? `${bad.name} is not a PDF. Please choose PDF files only.` : null)
    setFiles(bad ? [] : list)
  }

  async function finish(job_id) {
    let name = 'Uploaded deal'
    try {
      const deal = await getLiveDeal(job_id)
      name = deal.memo.sections[0].blocks[0].left[0] || name
    } catch {
      /* keep the generic name */
    }
    saveAnalysis({ id: job_id, name, when: Date.now() })
    onSaved?.()
    location.hash = `#/live/${job_id}`
  }

  async function start() {
    setBusy(true)
    setError(null)
    setProgress(['Uploading…'])
    try {
      const { job_id } = await uploadPdfs(files)
      const poll = async () => {
        try {
          const j = await getJob(job_id)
          setProgress(j.progress)
          if (j.status === 'done') {
            setBusy(false)
            finish(job_id)
          } else if (j.status === 'error') {
            setError(j.error || 'The assistant could not read these documents.')
            setBusy(false)
          } else {
            timer.current = setTimeout(poll, 2000)
          }
        } catch (e) {
          setError(e.message)
          setBusy(false)
        }
      }
      poll()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const ready = server === 'ready'
  return (
    <section className="panel work-panel" aria-labelledby="in-h">
      <div className="work-head">
        <span className="step-num">1</span>
        <div>
          <h2 id="in-h">Input files</h2>
          <p className="muted small">Borrower documents: financial statements, tax returns, business plan, rent roll.</p>
        </div>
      </div>

      <label
        className={'dropzone' + (drag ? ' drag' : '') + (ready ? '' : ' off')}
        onDragOver={(e) => { e.preventDefault(); if (ready) setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (ready && !busy) choose(Array.from(e.dataTransfer.files)) }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
        </svg>
        <strong>Drop PDF files here</strong>
        <span className="muted small">or tap to choose files</span>
        <input type="file" accept="application/pdf,.pdf" multiple disabled={!ready || busy} onChange={(e) => choose(Array.from(e.target.files || []))} />
      </label>

      {files.length > 0 && (
        <ul className="filelist">
          {files.map((f) => (
            <li key={f.name}>📄 {f.name} <span className="muted small">({(f.size / 1024 / 1024).toFixed(1)} MB)</span></li>
          ))}
        </ul>
      )}

      <button type="button" className="btn primary wide" onClick={start} disabled={!ready || busy || files.length === 0}>
        {busy ? 'Working…' : 'Run the analysis'}
      </button>

      {server === 'off' && (
        <div className="banner warn">Uploading is not switched on for this site yet. The example analyses on the right still work.</div>
      )}
      {server === 'checking' && <div className="banner warn">Connecting to the analysis server… it can take up to a minute to wake up.</div>}
      {server === 'down' && <div className="banner bad">We could not reach the analysis server. Wait a minute and refresh the page.</div>}
      {server === 'nokey' && <div className="banner bad">The server is running but has no AI key set up, so it cannot read documents yet.</div>}
      <p className="muted small">Demo only: please use fictional documents. Uploads are deleted from the server after 24 hours.</p>

      {busy && (
        <ol className="progress" aria-live="polite">
          {progress.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      )}
      {error && <div className="banner bad">{error}</div>}
    </section>
  )
}
