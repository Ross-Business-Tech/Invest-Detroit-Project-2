# Prompts for your team

Copy a prompt, replace the parts in `<angle brackets>`, and paste it into Claude. You don't need to know how to code. Be specific about **who** uses the app and **what they can do**.

## How your team works

1. **One person runs the Kickoff prompt** while the team decides the idea together. Claude builds a first version and opens a *pull request*: a proposed change your teammates can try before it goes live.
2. **Everyone else reviews it.** Open the test link on your phone, then on GitHub click **Files changed > Review changes > Approve**, and **Merge**. Your team's dev site updates a few minutes later. (Your public address stays "Coming soon" until staff reveal all teams at the end.)
3. **Then split up.** Each person picks one feature and starts a **new session** for it. New sessions always start from the team's latest version.
4. **One feature = one session = one pull request.** Small pull requests are easier to review and rarely collide.

## 1. Kickoff (one person, once)

Already filled in for our app. The first version (a website of pre-computed examples plus the full Python tool) is built, so
this is kept for the record and for anyone starting fresh.

```
We're team Invest Detroit Project 2 and we're building the Invest Detroit Underwriting Assistant.
Who it's for: Invest Detroit's loan officers, underwriters and approval committee (a Michigan community lender that
finances Detroit projects banks won't fully fund).
The problem it solves: staff spend about 17 days re-typing a borrower's documents into a template and analyzing them by
hand to write an Investment Summary. We draft it in minutes. The tool drafts; people decide.
In this first version, someone should be able to:
1. Pick a fictional borrower (small business or real estate) and read a full draft Investment Summary.
2. See the key numbers at a glance: debt service coverage (DSCR), EBITDA or NOI, loan to value, and guideline exceptions.
3. See which Credit Guideline rules the loan breaks and what an underwriter should double-check.
Look and feel: trustworthy and calm, like a bank's internal tool. Deep blue and teal with a warm gold accent (Invest Detroit's
colors), readable tables, works well on a phone.
Replace the starter page with this first version. Keep it simple enough to finish in an hour.
Use made-up sample data. When it works on a phone, give me a test link, then open a pull request
titled "First version of the Invest Detroit Underwriting Assistant".
```

## 2. Start a feature (everyone, new session each time)

```
I'm adding <feature> to our app.
What it should do: <describe it from the user's point of view>
Where it goes: <which page or part of the screen>
It's done when: <how you'll know it works>
Only change what this feature needs, and tell me if you have to touch anything else.
```

## 3. Change something you can see

```
On the <page/screen>, <what's wrong or what you want instead>.
For example: <a concrete example of the result you want>.
```

## 4. Ready to share with the team

```
This is ready. Bring in the team's latest changes, test again, and open a pull request
with a short plain-language summary and my test link.
```

## 5. Review a teammate's pull request

```
Explain pull request #<number> in plain language: what does it change for users,
and is there anything that might break or confuse people? Don't change any code.
```

## 6. Respond to review comments

```
My teammate commented on pull request #<number>: "<paste the comment>".
Please address it and update the pull request.
```

## 7. Something's broken

```
<What you did>, and <what happened instead of what you expected>.
Please find the cause, fix it, and explain what was wrong in one sentence.
```

## 8. Get ready to present

```
We present in <time>. Check the whole app on a phone screen, fix anything that looks broken
or unfinished, and make sure the first screen explains what the app does in one sentence.
```

## 9. Ready-made prompts for our app

These use what is already built. The Python tool lives in `underwriter-tool/`; the website only hosts static pages, so ideas
that need a server are phrased to run in the browser.

**Live what-if in the browser**
```
I'm adding a "what if" panel to the Investment Summary page.
What it should do: let the user change the loan amount, interest rate and years to repay, and instantly see the new debt
service coverage (DSCR) and whether it meets Invest Detroit's 1.15x minimum.
Where it goes: on a deal page, above the tabs.
It's done when: changing the rate on the restaurant example moves its DSCR and the color of the DSCR box.
The math is in underwriter-tool/underwriter/engine; reproduce the same formulas in the browser and check they match the
pre-computed numbers for each example before you finish.
```

**Upload and AI reading (needs the instructor)**
```
I want people to upload a borrower's PDF and get the draft summary. The website can't run Python, so please design this to use
a here.now proxy route for the AI call (no secret key in the code). Tell me exactly what my instructor has to set up, then build
the upload screen so it shows a friendly message until that is set up.
```

**Industry comparison picture**
```
On each deal page, add a simple chart that compares the borrower's margins and ratios with its industry (NAICS) average.
Use the benchmark numbers already in the example data. Green when better than the industry, red when worse, and a one-line
plain-language summary.
```

**Prepare for the Invest Detroit meetings (Nov 10 and Nov 17)**
```
We meet Invest Detroit's team on Nov 10 and present on Nov 17. Add a "Questions for Invest Detroit" page listing the open
questions from the README, and make the first screen explain in one sentence what the tool does. Check everything on a phone.
```

**Pitch deck facts**
```
Write the five most convincing, accurate numbers from our test results (README and underwriter-tool/docs/test-loop-log.md) as a
short "Proof" section for the home page. Do not exaggerate: say clearly that reading real scanned PDFs with AI is not tested yet.
```

