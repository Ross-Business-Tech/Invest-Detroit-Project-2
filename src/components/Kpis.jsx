import { dscrTone, money, pct, times } from '../lib.js'

function Kpi({ label, value, sub, tone = '' }) {
  return (
    <div className={'kpi ' + tone}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

// The headline numbers at the top of a deal. All values come from the engine's summary.
export default function Kpis({ deal }) {
  const s = deal.summary
  const cre = deal.deal_type === 'cre'
  return (
    <div className="kpis">
      <Kpi label="Request" value={money(s.loan_amount)} sub={s.product} />
      {cre ? (
        <>
          <Kpi label="Stabilized DSCR" value={times(s.dscr)} sub={`takeout case, ${s.stabilized_year}`} tone={dscrTone(s.dscr)} />
          <Kpi label="DSCR on this loan" value={times(s.dscr_id_loan)} sub="if not refinanced" tone={dscrTone(s.dscr_id_loan)} />
          <Kpi label="NOI" value={money(s.noi)} sub={String(s.stabilized_year)} />
          <Kpi label="Loan to cost" value={pct(s.ltc)} sub="of total project cost" />
        </>
      ) : (
        <>
          <Kpi label="DSCR" value={times(s.dscr)} sub={s.latest_period} tone={dscrTone(s.dscr)} />
          {s.dscr_ex_nonrecurring != null && Math.abs(s.dscr_ex_nonrecurring - s.dscr) > 0.005 && (
            <Kpi label="DSCR without one-time income" value={times(s.dscr_ex_nonrecurring)} sub="excludes non-recurring" tone={dscrTone(s.dscr_ex_nonrecurring)} />
          )}
          {s.projected_dscr != null && <Kpi label="Projected DSCR" value={times(s.projected_dscr)} sub="company forecast" tone={dscrTone(s.projected_dscr)} />}
          <Kpi label="EBITDA" value={money(s.ebitda)} sub={money(s.revenue) + ' sales'} />
        </>
      )}
      <Kpi label="Loan to value" value={pct(s.ltv)} sub="gross collateral value" tone={s.ltv != null && s.ltv > 0.9 ? 'bad' : ''} />
      <Kpi
        label="Guideline exceptions"
        value={s.exceptions}
        sub={s.oversight_council ? 'Oversight Council needed' : 'policy + guideline'}
        tone={s.oversight_council ? 'bad' : s.exceptions ? 'warn' : 'ok'}
      />
      {s.risk_rating != null && <Kpi label="Risk rating" value={s.risk_rating} sub="after override" />}
    </div>
  )
}
