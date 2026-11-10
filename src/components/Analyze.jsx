import { useEffect, useRef, useState } from 'react'
import { getJob, getStatus, liveEnabled, uploadPdfs } from '../api.js'

// The "Analyze a deal" screen: pick PDFs, send them to the backend, follow its progress, then open the result.
export default function Analyze() {
  const [server, setServer] = useState(liveEnabled ? 'checking' : 'off') // checking | ready | nokey | down | off
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
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

  function pick(e) {
    const list = Array.from(e.target.files || [])
    const bad = list.find((f) => !f.name.toLowerCase().endsWith('.pdf'))
    setError(bad ? `${bad.name} is not a PDF. Please choose PDF files only.` : null)
    setFiles(bad ? [] : list)
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
            location.hash = `#/live/${job_id}`
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

  return (
    <div className="panel">
      <a href="#/" className="back">← All examples</a>
      <h1>Analyze a deal</h1>
      <p>
        Choose the PDF files for a <strong>fictional</strong> borrower (financial statements, tax returns, a business plan, a rent
        roll). The assistant reads them and drafts the Investment Summary. This takes a few minutes.
      </p>
      <div className="banner warn">Demo only. Do not upload real borrower documents. Files are deleted from the server after 24 hours.</div>

      {server === 'off' && (
        <div className="banner bad">Live analysis is not connected yet. The examples on the home page still work.</div>
      )}
      {server === 'checking' && <div className="loading">Connecting to the server… it may take up to a minute to wake up.</div>}
      {server === 'down' && <div className="banner bad">We could not reach the server. Wait a minute and refresh the page.</div>}
      {server === 'nokey' && (
        <div className="banner bad">The server is running but has no AI key set up, so it cannot read documents yet.</div>
      )}

      {server === 'ready' && (
        <>
          <label className="filepick">
            <span>PDF files</span>
            <input type="file" accept="application/pdf,.pdf" multiple onChange={pick} disabled={busy} />
          </label>
          {files.length > 0 && (
            <ul className="filelist">
              {files.map((f) => (
                <li key={f.name}>{f.name} <span className="muted small">({(f.size / 1024 / 1024).toFixed(1)} MB)</span></li>
              ))}
            </ul>
          )}
          <button type="button" className="btn primary" onClick={start} disabled={busy || files.length === 0}>
            {busy ? 'Working…' : 'Draft the Investment Summary'}
          </button>
        </>
      )}

      {busy && (
        <ol className="progress" aria-live="polite">
          {progress.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      )}
      {error && <div className="banner bad">{error}</div>}
    </div>
  )
}
