# Question & Answer Sheet Builder — Project Plan

## 1. Purpose
A web app that lets a teacher quickly build a question paper and its matching answer sheet, then export both as PDFs. No login, no database — single-session, in-browser tool built for speed.

## 2. Tech Stack
- **React** (Vite for dev/build tooling)
- **Tailwind CSS** for styling — no component library required
- **jsPDF** + **html2canvas** for PDF export — export directly from the rendered preview so formatting isn't duplicated
- No backend, no database, no auth — all state lives in React state (in-memory only)

## 3. Core User Flow
1. Teacher fills in paper metadata (title, subject, class, date, duration, total marks — optional fields).
2. Teacher adds questions one at a time through a builder form.
3. Each added question appears in a running, editable list.
4. A live preview renders the paper as it's being built.
5. Teacher clicks **Export** → generates two PDFs: the **Question Paper** and the **Answer Sheet**.
6. On-screen view remains available/editable at all times (export doesn't lock the session).

## 4. Question Types to Support
- Multiple Choice (MCQ) — question + options (a/b/c/d) + correct answer
- True / False — question + correct answer
- Fill in the Blank — question text with blank(s) + correct answer(s) (one answer per `___` marker)
- Short Answer — question + model/expected answer
- Long Answer / Essay — question + model answer or grading notes

Each question also has: **marks value** (number), and is **auto-numbered** based on position.

## 5. Screens / Components

> **Terminology note:** "paper" in this codebase (the `paper` state object) means the whole exam document's metadata (title, subject, total marks, etc.) — **not** a physical sheet. A physical A4 sheet in the exported PDF is called a **page** below (`pages`, `PageSection`), to avoid confusion between the two.

### `PaperSetupForm`
- Title, subject, class/grade, date, duration, total marks (auto-calculated from questions but editable override)

### `PageSection` (one per physical PDF page)
- A stacked card per page, in export order. Each card holds:
  - **Max questions on this page** (optional number input). Blank = inherit the session-wide default (`defaultQuestionsPerPage`, set in the header — see §7); the placeholder shows the active default, e.g. "Use default (5)". A "Reset to default" link appears once a local value is set, mirroring the Total Marks override/reset pattern.
  - That page's own question list (same rendering as today's `QuestionList`, scoped to just this page's questions) — edit/delete/reorder (up/down), reordering is scoped within the page only in v1 (no cross-page drag).
  - "+ Add Question" button — opens the shared `QuestionBuilder` targeting this page.
  - "Delete Page" — only enabled when the page is empty (see Open Decisions).
- A "+ Add Page" button below the last card appends a new empty page.
- The app starts with a single Page 1, so existing single-page papers look unchanged until a teacher explicitly adds a page.

### `QuestionBuilder`
- Unchanged form itself (type dropdown, dynamic fields per type, marks input, image upload).
- Now takes an implicit **target page**: set by whichever `PageSection`'s "+ Add Question" was clicked; editing an existing question keeps it pinned to that question's current page.
- Doubles as the **edit form**: selecting "edit" on a question pre-fills this component and swaps the button to "Save Changes"

### `PaperPreview`
- Renders the question paper exactly as it will be exported: pages rendered in order, each ending in a visible page-break divider; questions numbered continuously across all pages (not reset per page); no answers shown.
- Updates live as questions/pages are added/edited/reordered

### `AnswerSheetPreview`
- Same structure as `PaperPreview` (same pages, same per-page limits), but shows correct/model answers instead of blank space

### `ExportControls`
- "Export Question Paper (PDF)" button
- "Export Answer Sheet (PDF)" button
- Optional: "Export Both" combined action

## 6. Formatting Rules (auto-handled, not manual)
- Questions auto-numbered sequentially (1, 2, 3…) **across the whole paper**, continuing across page boundaries, regardless of type mix
- MCQ options auto-lettered a) b) c) d)
- Fill-in-blank renders each blank as a formatted underscore line in the paper, and shows the filled answer(s) in the answer sheet
- Total marks auto-sums from all questions **across all pages** by default; if the teacher manually overrides the total, that override holds until the question list changes again (add/delete/reorder/marks edit, on any page), at which point it snaps back to auto-sum
- Question order: **default = order added, grouped by page**; stretch goal = optional "group by type" toggle
- Minimum validation before "Add Question" is enabled: question text non-empty; MCQ requires at least 2 non-empty options and a selected correct option

## 7. State Shape
```js
// Session-wide default for "questions per page," set once per session
// (plain React state, not persisted — reloading resets it). Applies to
// every page unless that page sets its own value. null = auto (fit as
// many as possible / height-limited only).
defaultQuestionsPerPage = null

paper = {
  title: '',
  subject: '',
  className: '',
  date: '',
  duration: '',
  totalMarks: null,       // auto-calculated across all pages' questions, overridable
  totalMarksOverridden: false, // tracks whether the override is currently active
}

// Replaces the old flat `questions` array. Each entry is one physical PDF
// page, in export order.
pages = [
  {
    id: string,               // crypto.randomUUID()
    maxQuestions: number | null, // local override; null = inherit defaultQuestionsPerPage
    questions: [
      {
        id: string,           // crypto.randomUUID()
        type: 'mcq' | 'trueFalse' | 'fillBlank' | 'short' | 'long',
        text: string,
        marks: number,
        options: [string, string, string, string], // mcq only
        correctAnswer: string | number | string[],
          // mcq: index of correct option
          // trueFalse: 'true' | 'false'
          // fillBlank: string[] (one entry per ___ marker, in order)
          // short/long: string (model answer)
      },
      ...
    ],
  },
  ...
]
```

## 8. PDF Export Notes
- Render `PaperPreview` and `AnswerSheetPreview` off-screen (or reuse the visible preview) and pass each to `html2canvas` → `jsPDF`
- Keep print-friendly styling via Tailwind: clean margins, avoid page-break-splitting a question awkwardly (use CSS `break-inside: avoid` on question blocks)
- **Known risk:** slicing a single `html2canvas` output across multiple PDF pages can still cut a question in half despite `break-inside: avoid`, since the canvas is one continuous image. Build and manually test a 15+ question paper early to confirm pagination looks right before treating export as done. If slicing proves unreliable, fall back to per-question canvas capture (one canvas per question block, placed onto pages individually) rather than one full-page canvas.
- File naming: `{title}-question-paper.pdf` and `{title}-answer-sheet.pdf`
- **Questions per page — global default vs per-page override:** A session-wide default (`defaultQuestionsPerPage`) is set once in the header and applies to every page for the rest of the session. Each `PageSection`'s own `maxQuestions` overrides it for just that page; leaving it blank inherits the session default. The effective limit for a page is `page.maxQuestions ?? defaultQuestionsPerPage` (both null = unlimited/auto — height overflow is still the only break trigger). No persistence (localStorage/DB) — consistent with this app's in-memory-only design.
- **Page-break mechanics:** `PreviewBase` tags each question block with `data-page-id` (which `pages` entry it belongs to) and `data-page-limit` (that page's effective limit, or empty for unlimited). `exportBlocksToPdf` groups consecutive question blocks by `data-page-id` — a change in page id is always a **hard break**: one builder page never shares a physical PDF page with another. Within one builder page's run of blocks:
  - **Limit set:** the run is split into chunks of at most `limit` questions; each chunk gets its own physical page and that page's height is divided **equally among however many questions actually landed in the chunk** (a lone question fills the whole page; three questions split it into thirds) — never reserved-but-empty slots sized for the limit itself.
  - **Unlimited (`null`):** unchanged natural-height packing — blocks are placed at their rendered height and only break to a new page when the next one wouldn't fit in the remaining space.
  A page with zero questions produces no blocks and is skipped entirely on export (no blank PDF page). The exported PDF's page count can exceed `pages.length` (an unlimited builder page whose content overflows, or a limited one needing multiple chunks).

## 9. Explicit Non-Goals (v1)
- No saving/loading question banks
- No user accounts or multi-teacher support
- No question randomization/shuffling
- No collaborative/real-time editing
- No drag-and-drop reordering of questions across page boundaries (up/down move stays within a page)
- No merging/splitting pages automatically — teachers manage page boundaries manually via "+ Add Page" / "Delete Page"

## 10. Open Decisions (confirm before/while implementing)
- **Deleting a non-empty page:** current assumption is "Delete Page" is disabled until the page has 0 questions, to avoid silently discarding questions. Alternative: allow it and move its questions to the previous page (or delete them with a confirm dialog).
- **Deleting the only remaining page:** should always be blocked — at least one page must exist.
- **Answer sheet sharing page structure:** assumption is the Answer Sheet uses the *same* `pages` (same boundaries, same per-page limits) as the Question Paper, since today both already share one question list. Flag if a separate layout is wanted for the answer sheet.

## 11. Build Order (suggested for the agent)
1. Scaffold Vite + React + Tailwind project
2. Build `PaperSetupForm` + state
3. Build `QuestionBuilder` (add + edit modes) with all 5 question types, plus `QuestionList` (edit/delete/reorder)
4. Build `PaperPreview` and `AnswerSheetPreview` reading from shared state
5. Wire up PDF export (jsPDF/html2canvas); test pagination against a long paper early
6. Polish: responsive layout, print CSS, empty states, marks auto-totaling
7. Multi-page builder: introduce `pages` array (§7), session-wide `defaultQuestionsPerPage`, `PageSection` UI, per-page limits, and the page-boundary-aware PDF export (§8)
