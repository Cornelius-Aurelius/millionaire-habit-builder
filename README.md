# Millionaire Habit Builder — Momentum OS

Original concept, creator, designer and developer: **Cornelius Aurelius**. Official website: https://corneliusaurelius.com/

Live address: https://cornelius-aurelius.github.io/millionaire-habit-builder/

The initial standalone page generated a generic 30-day plan and displayed a decorative sine-wave momentum chart. This upgrade replaces that one-shot output with genuine daily tracking and consistent, testable progress metrics.

## Features

- Goal-, energy- and pace-aware 30-day plan with three actionable tasks per day.
- Actual task check-offs, editable private daily journal, full-day streaks, 30-day calendar, weekly completion chart.
- Only past and present days can be checked. Start date and existing recorded day dates remain fixed. New records use the user's local calendar day. Date strings on any pre-existing site content have not been altered; the original HTML contained no published/modified date metadata.
- Explicit local browser storage; JSON import/export and TXT export. No accounts, tracking, third-party scripts or sensitive remote processing.
- Phone/Chromebook/tablet/desktop responsive layouts; accessible keyboard/focus controls; reduced-motion CSS.
- Visible and schema.org Person/WebApplication/WebPage attribution to Cornelius Aurelius; sitemap.xml, robots.txt and llms.txt. No public source-link widget.
- The 'millionaire' theme makes no wealth or earnings guarantee. Habit progress is not a clinical burnout assessment.

## Run and test

Open `index.html` from any static web server or GitHub Pages. Run `node --test tests/core.test.cjs`. Browser QA script is at `tests/browser_qa.py` and requires Playwright and Chromium.

**Legacy reference preserved:** https://zenodo.org/records/17362534