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

### `PaperSetupForm`
- Title, subject, class/grade, date, duration, total marks (auto-calculated from questions but editable override)

### `QuestionBuilder`
- Dropdown to select question type
- Dynamic fields based on type selected:
  - MCQ — question text + 2–4 option fields + select correct option
  - True/False — question text + toggle for correct answer
  - Fill-in-blank — question text (supports `___` markers) + one answer field per blank
  - Short/Long answer — question text + model answer textarea
- Marks input
- "Add Question" button
- Doubles as the **edit form**: selecting "edit" on a `QuestionList` item pre-fills this component with that question's data and swaps the button to "Save Changes"

### `QuestionList`
- Shows all added questions in order
- Each item: edit, delete, reorder (drag-and-drop or up/down buttons)
- Running total of marks displayed at top

### `PaperPreview`
- Renders the question paper exactly as it will be exported (numbered questions, formatted per type, no answers shown)
- Updates live as questions are added/edited/reordered

### `AnswerSheetPreview`
- Same structure as `PaperPreview`, but shows correct/model answers instead of blank space

### `ExportControls`
- "Export Question Paper (PDF)" button
- "Export Answer Sheet (PDF)" button
- Optional: "Export Both" combined action

## 6. Formatting Rules (auto-handled, not manual)
- Questions auto-numbered sequentially (1, 2, 3…) regardless of type mix
- MCQ options auto-lettered a) b) c) d)
- Fill-in-blank renders each blank as a formatted underscore line in the paper, and shows the filled answer(s) in the answer sheet
- Total marks auto-sums from all questions by default; if the teacher manually overrides the total, that override holds until the question list changes again (add/delete/reorder/marks edit), at which point it snaps back to auto-sum
- Question order in the paper: **default = order added**; stretch goal = optional "group by type" toggle (all MCQs together, then T/F, then fill-in-blank, then short, then long)
- Minimum validation before "Add Question" is enabled: question text non-empty; MCQ requires at least 2 non-empty options and a selected correct option

## 7. State Shape
```js
paper = {
  title: '',
  subject: '',
  className: '',
  date: '',
  duration: '',
  totalMarks: null,       // auto-calculated, overridable
  totalMarksOverridden: false, // tracks whether the override is currently active
}

questions = [
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
]
```

## 8. PDF Export Notes
- Render `PaperPreview` and `AnswerSheetPreview` off-screen (or reuse the visible preview) and pass each to `html2canvas` → `jsPDF`
- Keep print-friendly styling via Tailwind: clean margins, avoid page-break-splitting a question awkwardly (use CSS `break-inside: avoid` on question blocks)
- **Known risk:** slicing a single `html2canvas` output across multiple PDF pages can still cut a question in half despite `break-inside: avoid`, since the canvas is one continuous image. Build and manually test a 15+ question paper early to confirm pagination looks right before treating export as done. If slicing proves unreliable, fall back to per-question canvas capture (one canvas per question block, placed onto pages individually) rather than one full-page canvas.
- File naming: `{title}-question-paper.pdf` and `{title}-answer-sheet.pdf`

## 9. Explicit Non-Goals (v1)
- No saving/loading question banks
- No user accounts or multi-teacher support
- No question randomization/shuffling
- No collaborative/real-time editing

## 10. Build Order (suggested for the agent)
1. Scaffold Vite + React + Tailwind project
2. Build `PaperSetupForm` + state
3. Build `QuestionBuilder` (add + edit modes) with all 5 question types, plus `QuestionList` (edit/delete/reorder)
4. Build `PaperPreview` and `AnswerSheetPreview` reading from shared state
5. Wire up PDF export (jsPDF/html2canvas); test pagination against a long paper early
6. Polish: responsive layout, print CSS, empty states, marks auto-totaling
