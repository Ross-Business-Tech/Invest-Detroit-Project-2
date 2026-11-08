import { useEffect, useState } from 'react'
import Kpis from './components/Kpis.jsx'
import Memo from './components/Memo.jsx'
import { Flags, Guidelines } from './components/Panels.jsx'
import { dscrTone, money, parseRoute, times } from './lib.js'
import './App.css'

function useRoute() {
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parseRoute(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

// Loads a JSON file from /demo and handles the loading and error states.
function useDemoFile(name) {
  const [state, setState] = useState({ data: null, error: null })
  useEffect(() => {
    let live = true // the screens using this hook are re-created when the file name changes, so state starts fresh
    fetch(`/demo/${name}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((data) => live && setState({ data, error: null }))
      .catch(() => live && setState({ data: null, error: 'We could not load this example. Please refresh the page.' }))
    return () => {
      live = false
    }
  }, [name])
  return state
}

function Home() {
  const { data, error } = useDemoFile('index')
  return (
    <>
      <section className="hero">
        <h1>Draft the Investment Summary in minutes, not weeks</h1>
        <p>
          Give the assistant a borrower's documents. It reads them, computes the debt service coverage and every ratio in code,
          checks the loan against Invest Detroit's Credit Guidelines, compares the business with its industry, and writes the
          draft summary an underwriter reviews and edits.
        </p>
        <ul className="points">
          <li>Every number is calculated by code, never guessed by AI.</li>
          <li>Problems are flagged for a person to check, not hidden.</li>
          <li>The tool drafts; people decide.</li>
        </ul>
        <p className="muted small">
          Below are twelve <strong>fictional</strong> companies, from a restaurant to a big tech firm and a new apartment building.
          Open one to see the draft the tool wrote.
        </p>
      </section>
      {error && <div className="banner bad">{error}</div>}
      {!data && !error && <div className="loading">Loading examples…</div>}
      {data && (
        <div className="cards">
          {data.map((d) => (
            <a key={d.id} className="card" href={`#/deal/${d.id}`}>
              <div className="card-top">
                <span className={'tag ' + (d.deal_type === 'cre' ? 'cre' : 'sb')}>{d.deal_type === 'cre' ? 'Real estate' : 'Small business'}</span>
                <span className="card-label">{d.label}</span>
              </div>
              <h3>{d.name}</h3>
              <p className="muted">{d.blurb}</p>
              <div className="card-kpis">
                <span>{money(d.summary.loan_amount)}</span>
                <span className={'pill ' + dscrTone(d.summary.dscr)}>DSCR {times(d.summary.dscr)}</span>
                <span className={'pill ' + (d.exceptions ? 'warn' : 'ok')}>
                  {d.exceptions} exception{d.exceptions === 1 ? '' : 's'}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  )
}

const TABS = [
  ['summary', 'Investment Summary'],
  ['guidelines', 'Guideline check'],
  ['flags', 'To check'],
]

function Deal({ id, tab }) {
  const { data: deal, error } = useDemoFile(id)
  if (error) return <div className="banner bad">{error} <a href="#/">Back to examples</a></div>
  if (!deal) return <div className="loading">Loading…</div>
  const warnings = deal.flags.filter((f) => f.severity !== 'info').length
  return (
    <>
      <a href="#/" className="back">← All examples</a>
      <div className="deal-head">
        <div>
          <h1>{deal.memo.sections[0].blocks[0].left[0]}</h1>
          <span className={'tag ' + (deal.deal_type === 'cre' ? 'cre' : 'sb')}>{deal.deal_type === 'cre' ? 'Real estate' : 'Small business'}</span>{' '}
          <span className="muted small">{deal.label} · fictional company</span>
        </div>
        <a className="btn primary" href={`/demo/${id}.docx`} download>Download Word draft</a>
      </div>
      <Kpis deal={deal} />
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <a key={k} role="tab" aria-selected={tab === k} className={'tab' + (tab === k ? ' active' : '')} href={`#/deal/${id}/${k}`}>
            {label}
            {k === 'flags' && <span className="count">{warnings}</span>}
          </a>
        ))}
      </div>
      {tab === 'guidelines' ? <Guidelines deal={deal} /> : tab === 'flags' ? <Flags flags={deal.flags} /> : <Memo memo={deal.memo} />}
    </>
  )
}

function About() {
  const steps = [
    ['1. Read', 'Claude reads the scanned PDFs (financial statements, tax returns, projections, rent rolls, appraisals, budgets) and copies the numbers into a fixed form. Every value keeps its source page and a confidence score.'],
    ['2. Calculate', 'Plain code, not AI, computes EBITDA, debt service coverage, ratios, break-even sales, vacancy sensitivity, loan to value and cost. Every figure can be recomputed.'],
    ['3. Check', 'The loan is tested against the 4/2026 Credit Guidelines. Statements that do not add up, strange swings, and projections far from industry norms are flagged.'],
    ['4. Benchmark', 'The business is matched to a NAICS industry code and compared with IRS tax-return averages for that industry.'],
    ['5. Draft', 'The Investment Summary is written in Invest Detroit\'s own layout, with a draft term sheet. An underwriter edits any input, sees the numbers update, and exports Word.'],
  ]
  return (
    <div className="panel">
      <a href="#/" className="back">← All examples</a>
      <h1>How it works</h1>
      {steps.map(([t, d]) => (
        <div key={t} className="step">
          <strong>{t}</strong>
          <p>{d}</p>
        </div>
      ))}
      <h2>What you are looking at</h2>
      <p>
        These pages are <strong>pre-computed examples</strong> for fictional companies. The calculation engine is written in Python
        and needs a server, while this website can only host static pages, so the results were produced ahead of time by the real
        engine. The full source is in the repository's <code>underwriter-tool</code> folder.
      </p>
      <h2>How accurate is it?</h2>
      <p>
        Tested against two real Invest Detroit Investment Summaries: 387 figures compared, none unexplained. Tested on more than 500
        fictional borrowers against an independent answer key: over 99.9% of about 43,000 checks pass, and every single-digit misread
        we injected into key statement lines was caught. Reading scanned PDFs with AI has not been tested yet and always needs an underwriter's review.
      </p>
    </div>
  )
}

export default function App() {
  const route = useRoute()
  return (
    <>
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="logo">ID</span>
          <span>Invest Detroit <span className="brand-sub">Underwriting Assistant</span></span>
        </a>
        <nav>
          <a href="#/about">How it works</a>
        </nav>
      </header>
      <div className="demo-banner">Demo with fictional companies. No real borrower data.</div>
      <main>
        {route.page === 'deal' ? <Deal id={route.id} tab={route.tab} key={route.id} /> : route.page === 'about' ? <About /> : <Home />}
      </main>
      <footer>Business+Tech AI Sprint · Draft output for underwriter review, not a lending decision</footer>
    </>
  )
}
