# Invest Detroit Underwriting Assistant

**A first-draft Investment Summary in minutes, in Invest Detroit's own format — so credit staff spend their time reviewing, not re-typing.**

Built for **Invest Detroit**, Michigan's largest community development financial institution (CDFI), by the Business+Tech AI Sprint team at the University of Michigan Ross School of Business (Fall 2026).

---

## Why it exists

Turning a borrower's documents into an Investment Summary takes Invest Detroit's credit staff about **17 days**. Most of that is re-keying numbers into a template and working them by hand before any judgment is applied.

This assistant does the mechanical first pass in minutes:

1. **Reads** the borrower's documents — financial statements, tax returns, projections, rent rolls, appraisals and development budgets — including scanned PDFs.
2. **Calculates** debt service coverage (DSCR), the full ratio set, break-even sales or vacancy, loan-to-value and loan-to-cost. **Every number is computed in code — never guessed by the AI.**
3. **Checks** the loan against Invest Detroit's Credit Guidelines and flags figures that don't reconcile.
4. **Benchmarks** the borrower against its industry using its NAICS code and IRS industry averages.
5. **Drafts** the Investment Summary in Invest Detroit's own layout — including the Risk Rating worksheet, its matrix interpretation, and a Key Risks & Mitigants section — plus a draft term sheet, ready to export to Word.

An underwriter edits any input, watches the numbers recalculate, and exports the finished document.

> **The tool drafts; people decide.** It never makes or recommends the lending decision, and every figure it reads is presented for an underwriter to confirm.

**Who uses it:** Invest Detroit loan officers, underwriters and the approval committee. Borrowers never touch it.

---

## What it produces

The draft follows Invest Detroit's real Investment Summary templates and adapts to the deal type:

- **Small Business** and **C&I** — operating highlights, financial review, collateral, guarantors, benchmarking.
- **Commercial Real Estate** — sources & uses, projected cash flow and debt service, rent roll, sensitivity analysis, collateral and development budget.

Both include, matching Invest Detroit's framework:

- **Mission Alignment, Deal Overview, Request and Sources of Repayment** in ID's section order.
- **Credit Guideline compliance** with policy and guideline exceptions called out, and the Oversight Council trigger.
- **Risk Rating worksheet** — ID's own categories, with the quantitative lines (debt service, LTV/LTC, contingency) scored from the analysis — followed by the **Interpretation** from ID's Risk Rating Matrix (1 Outstanding → 8 Loss, with the typical DSC/LTV profile and allowance for loan losses).
- **Key Risks & Mitigants** in ID's template format (Risk / Probability of Occurrence / Impact on Loan Repayment / Mitigants), pre-filled from the issues the tool detects so the underwriter confirms rather than starts from a blank page.
- A **Draft Term Sheet** and the reporting-requirement checklist.

The interface uses Invest Detroit's yellow-and-white look.

---

## How well does it work?

- **Against two real Invest Detroit Investment Summaries:** 387 figures checked, none unexplained. The handful of differences trace to spreadsheet errors in the originals, documented in [`underwriter-tool/docs/sample-findings.md`](underwriter-tool/docs/sample-findings.md).
- **Against an independent answer key on 580+ fictional borrowers** (restaurants, manufacturers, child-care centers, start-ups, apartment buildings and more): 43,039 of 43,051 checks pass. The only misses are the backup industry-code guess, which always asks the underwriter to confirm.
- **Deliberately corrupted inputs** — mistyped figures, statements left in thousands, flipped signs, duplicate uploads — are all caught and flagged.

**Still to validate:** the AI reading *real* scanned PDFs end-to-end, which requires a connected API key; run [`underwriter-tool/scripts/eval_live_extraction.py`](underwriter-tool/scripts/eval_live_extraction.py) once one is available. The Risk Rating cutoffs are drawn from Invest Detroit's sample worksheets and are marked "not yet confirmed" in the output pending the full rubric. Every extraction is reviewed by an underwriter.

The round-by-round testing log is in [`underwriter-tool/docs/test-loop-log.md`](underwriter-tool/docs/test-loop-log.md).

---

## How the AI is used, and where data goes

The AI's only job is **transcription** — reading printed and scanned documents into structured fields. It is instructed never to calculate, estimate or infer a number that isn't printed, and never to copy SSNs or account numbers. All arithmetic and every guideline check run in auditable code.

The tool runs on either of two AI services:

- The **University of Michigan GPT Toolkit**, which keeps documents within U-M's environment, or
- **Anthropic's Claude**, if an Anthropic key is configured instead.

The key is stored as a server setting (on the hosting service), never in the code or this repository.

---

## What's in this repository

| Where | What |
| --- | --- |
| `src/`, `public/`, `index.html` | The website (React + Vite), styled in Invest Detroit's colors. It shows pre-computed examples for **twelve fictional companies** — eight small businesses and four real-estate projects. |
| `public/demo/` | The example data and a Word draft for each fictional company, generated by the Python tool. |
| `underwriter-tool/` | The full engine: document reading, the calculation engine, guideline checks, NAICS benchmarks, the memo writer, Word export, the underwriter review screen, tests, and a harness of 580+ fictional borrowers. See [`underwriter-tool/README.md`](underwriter-tool/README.md). |
| [`START-HERE.md`](START-HERE.md), [`PROMPTS.md`](PROMPTS.md) | How the team works on the project. |

The website hosts static pages only (no server), so it can't run the Python engine live; the examples are produced ahead of time by the real engine. To refresh them after an engine change:

```bash
cd underwriter-tool
pip install -r requirements.txt
python scripts/export_demo.py
```

---

## Open questions for Invest Detroit

1. May borrower documents be processed by the University of Michigan GPT Toolkit (or another AI service), and are there data-handling terms we should follow?
2. Can you share the **full Risk Rating worksheet rubric**? We have the category list and one completed example, so the quantitative cutoffs are our best reconstruction until confirmed.
3. Are the older assumptions in the Ballpoint sample memo (2% rent growth, 3% expense growth, 15% commercial vacancy, $0.50/SF reserves) still current? They aren't in the latest guidelines.
4. Who uploads documents — staff only, or borrowers through a portal?

---

## A note on data and privacy

This repository is **public**. Everything in it uses **fictional companies and people**. Real borrower documents, Invest Detroit's internal files, and any API key must never be committed here.
