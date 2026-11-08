"""Pre-compute the website demo from FICTIONAL synthetic borrowers.

    python scripts/export_demo.py          (run from underwriter-tool/; writes ../public/demo/)

The website (here.now) can only host static pages, so the Python engine cannot run there. This script runs the
real engine on the synthetic companies in synth/scenarios.py and saves the results as JSON (plus a Word file per
company) for the React app to display. Re-run it whenever the engine or the scenarios change.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from synth.scenarios import by_id  # noqa: E402
from synth.to_deal import build_case  # noqa: E402
from underwriter.engine.common import jsonable  # noqa: E402
from underwriter.memo.docx_export import render_docx  # noqa: E402
from underwriter.pipeline import analyze  # noqa: E402
from underwriter.schema import Deal  # noqa: E402

OUT = ROOT.parent / "public" / "demo"
DEMOS = [
    ("sb01_auto_supplier", "Automotive parts maker", "Tier 2 stamping supplier with strong coverage (3.4x) and no guideline exceptions: what a clean file looks like."),
    ("sb02_restaurant", "Restaurant", "Neighborhood restaurant: coverage of 0.72x, net worth turning negative in 2025."),
    ("sb03_saas_startup", "Software start-up", "Two-year-old subscription software company: losses, start-up rules and an aggressive growth forecast."),
    ("sb04_childcare", "Child care centers", "Child care centers: a one-time state grant inflates one year of EBITDA, and the collateral falls short (128.6% LTV)."),
    ("sb08_bigtech", "Big tech / IT services", "A $100M IT services firm: statements in thousands, request above the $1M product maximum."),
    ("sb09_fitness", "Fitness and recreation center", "Recreation center whose cash flow covers only 0.41x of the new loan, with collateral below the loan."),
    ("sb12_struggling_mfg", "Plastics manufacturer", "Declining sales and margins, negative cash flow, a passive 30% owner not guaranteeing."),
    ("sb13_bakery_interim", "Bakery (interim + forecast)", "Half-year results plus a forecast combined into one full-year column; margin forecast flagged as high."),
    ("cre01_mixed_use", "Mixed-use rehab", "Rehab with retail and apartments, a takeout loan and a lease-up year; coverage on the new loan is too low."),
    ("cre02_community_center", "Community building", "Former school bought by a nonprofit and leased to tenants: thin equity and thin coverage."),
    ("cre03_multifamily_new", "New apartment building", "24-unit new apartment building: passive investor owns 49% and is not guaranteeing; coverage short on the Invest Detroit loan."),
    ("cre05_sports_complex", "Indoor sports complex", "New construction with many exceptions, so Oversight Council approval is required."),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for sid, label, blurb in DEMOS:
        spec = by_id(sid)
        deal_json, *_ = build_case(spec)
        deal = Deal.model_validate(deal_json)
        res = analyze(deal)
        out = jsonable({"id": sid, "label": label, "blurb": blurb, "deal_type": res["deal_type"], "summary": res["summary"],
                        "naics": res["naics"], "memo": res["memo"],
                        "exceptions": [{k: e[k] for k in ("kind", "item", "requirement", "actual", "counts_toward_oversight")}
                                       for e in res["policy"]["exceptions"]],
                        "oversight": res["policy"]["oversight_council_required"],
                        "flags": [f.to_dict() for f in res["flags"]]})
        (OUT / f"{sid}.json").write_text(json.dumps(out, separators=(",", ":")))
        (OUT / f"{sid}.docx").write_bytes(render_docx(res["memo"], spec["name"]))
        index.append({"id": sid, "name": spec["name"], "label": label, "blurb": blurb, "deal_type": res["deal_type"],
                      "summary": res["summary"], "exceptions": len(res["policy"]["exceptions"]),
                      "warnings": sum(1 for f in res["flags"] if f.severity != "info")})
        print("exported", sid)
    (OUT / "index.json").write_text(json.dumps(index, separators=(",", ":")))


if __name__ == "__main__":
    main()
