# Question & Answer Sheet Builder

A web app for quickly building a question paper and its matching answer sheet, then exporting both as PDFs. No login, no database — everything lives in-session in React state.

## Features

- Paper setup form (title, subject, class, date, duration, total marks — auto-summed from questions, or manually overridable)
- Question builder supporting 5 question types: Multiple Choice, True/False, Fill in the Blank (multi-blank support), Short Answer, Long Answer/Essay
- Editable, reorderable question list with running marks total
- Live preview of both the Question Paper (no answers) and the Answer Sheet (with correct/model answers)
- One-click PDF export — Question Paper, Answer Sheet, or both — paginated so a question is never split across a page break

See [plan.md](plan.md) for the full project plan and design decisions.

## Tech Stack

- React + Vite
- Tailwind CSS
- jsPDF + html2canvas-pro for PDF export

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

### Other scripts

```bash
npm run build    # production build
npm run preview  # preview the production build locally
npm run lint     # run oxlint
```
