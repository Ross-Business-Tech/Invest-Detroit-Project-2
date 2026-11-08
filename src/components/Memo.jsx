import { Fragment } from 'react'

// Draws the Investment Summary that the Python engine produced (a list of sections, each a list of blocks).
function Table({ b }) {
  const grid = b.kind === 'grid'
  const numeric = (v) => /^[\s$()\-\d,.%x/]*$/.test(String(v)) && String(v).trim() !== ''
  return (
    <>
      {b.title && <div className="tbl-title">{b.title}</div>}
      <div className="tbl-wrap" tabIndex={0}>
        <table className={grid ? 'grid' : 'fin'}>
          <thead>
            <tr>
              {b.columns.map((c, i) => (
                <th key={i}>
                  {String(c).split('\n').map((line, j) => (
                    <Fragment key={j}>
                      {j > 0 && <br />}
                      {line}
                    </Fragment>
                  ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i} className={r.style || ''}>
                {r.cells.map((c, j) => (
                  <td key={j} className={grid && j > 0 && numeric(c) ? 'num' : ''}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {b.footnote && <div className="foot">{b.footnote}</div>}
    </>
  )
}

function Block({ b }) {
  switch (b.type) {
    case 'header':
      return (
        <div className="hdr">
          <div className="fund">{b.fund}</div>
          <div>
            <b>BORROWER</b>
            {b.left.filter(Boolean).map((l, i) => (
              <div key={i}>{l}</div>
            ))}
            <b className="cap">REQUEST</b>
            <div>{b.request}</div>
          </div>
          <div>
            {b.right.map((l, i) => (i === 0 ? <b key={i}>{l}</b> : <div key={i}>{l}</div>))}
            <b className="cap">POLICY EXCEPTIONS</b>
            {b.policy_exceptions.map((e, i) => (
              <div key={i} className={e.startsWith('None') ? '' : 'exc'}>
                • {e}
              </div>
            ))}
            <b className="cap">GUIDELINE EXCEPTIONS</b>
            {b.guideline_exceptions.map((e, i) => (
              <div key={i} className={e.startsWith('None') ? '' : 'exc'}>
                • {e}
              </div>
            ))}
            {b.oversight && <div className="exc">
              <b>Oversight Council approval required</b>
            </div>}
          </div>
        </div>
      )
    case 'p':
      return <p className={'src-' + b.source}>{b.text}</p>
    case 'placeholder':
      return <p className="placeholder">{b.text}</p>
    case 'subhead':
      return <div className="sub">{b.text}</div>
    case 'bullets':
      return <ul>{b.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    case 'numbered':
      return <ol>{b.items.map((t, i) => <li key={i}>{t}</li>)}</ol>
    case 'kv':
      return (
        <div className="tbl-wrap">
          <table className="grid">
            <tbody>
              {b.rows.map(([k, v], i) => (
                <tr key={i}>
                  <th style={{ width: 150 }}>{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'table':
      return <Table b={b} />
    default:
      return null
  }
}

export default function Memo({ memo }) {
  return (
    <>
      <div className="legend">
        <span className="c">computed by code</span>
        <span className="e">read from documents</span>
        <span className="i">underwriter input</span>
        <span className="p">underwriter to complete</span>
      </div>
      <article className="memo">
        {memo.sections.map((s) => {
          const first = s.blocks[0]
          const dup = first && first.type === 'table' && (first.title || '').startsWith(s.title || '\u0000')
          return (
            <section key={s.key}>
              {s.title && !dup && <h2>{s.title}</h2>}
              {s.blocks.map((b, i) => (
                <Block key={i} b={b} />
              ))}
            </section>
          )
        })}
      </article>
    </>
  )
}
