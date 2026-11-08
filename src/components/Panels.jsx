export function Guidelines({ deal }) {
  const ex = deal.exceptions
  return (
    <div className="panel">
      <h2>Credit guideline check</h2>
      <p className="muted">
        Compared with Invest Detroit's Credit Guidelines (rev. 4/2026). Items marked (*) are not counted toward the
        3-exception limit that triggers Oversight Council approval.
      </p>
      {deal.oversight && <div className="banner bad">More than 3 counted exceptions: Oversight Council approval is required.</div>}
      {ex.length === 0 ? (
        <div className="banner ok">No exceptions. This loan fits the guidelines for its product.</div>
      ) : (
        <ul className="exc-list">
          {ex.map((e, i) => (
            <li key={i}>
              <span className={'chip ' + (e.kind === 'policy' ? 'policy' : 'guideline')}>{e.kind === 'policy' ? 'Policy' : 'Guideline'}</span>
              <div>
                <strong>
                  {e.item}
                  {e.counts_toward_oversight ? '' : ' (*)'}
                </strong>
                <div className="muted">
                  Required: {e.requirement}. This loan: {e.actual}.
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="muted">NAICS industry code: {deal.naics.code ? `${deal.naics.code} ${deal.naics.title}` : 'not determined'}</p>
    </div>
  )
}

export function Flags({ flags }) {
  const order = { critical: 0, warning: 1, info: 2 }
  const seen = new Set()
  const rows = [...flags]
    .sort((a, b) => order[a.severity] - order[b.severity])
    .filter((f) => !seen.has(f.message) && seen.add(f.message))
  return (
    <div className="panel">
      <h2>Things for the underwriter to check</h2>
      <p className="muted">Automatic checks found these. Nothing here is hidden from the Investment Summary; it is a to-do list.</p>
      {rows.map((f, i) => (
        <div className="flagrow" key={i}>
          <span className={'sev ' + f.severity}>{f.severity}</span>
          <span>
            {f.message}
            {f.ref ? <span className="muted"> ({f.ref})</span> : null}
          </span>
        </div>
      ))}
    </div>
  )
}
