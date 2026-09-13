import { useMemo, useRef, useState } from 'react'
import PaperSetupForm from './components/PaperSetupForm'
import QuestionBuilder from './components/QuestionBuilder'
import PageSection from './components/PageSection'
import PaperPreview from './components/PaperPreview'
import AnswerSheetPreview from './components/AnswerSheetPreview'
import ExportControls from './components/ExportControls'
import { createId, sumMarks } from './utils/questions'
import { exportBlocksToPdf, slugifyFilename } from './utils/pdfExport'

const initialPaper = {
  title: '',
  subject: '',
  className: '',
  date: '',
  duration: '',
  showStudentInfoFields: true,
  totalMarks: 0,
  totalMarksOverridden: false,
}

function createPage() {
  return { id: createId(), maxQuestions: null, questions: [] }
}

export default function App() {
  const [paper, setPaper] = useState(initialPaper)
  const [pages, setPages] = useState(() => [createPage()])
  const [editingId, setEditingId] = useState(null)
  const [targetPageId, setTargetPageId] = useState(() => pages[0].id)
  const [isExporting, setIsExporting] = useState(false)
  // Session-wide default for "questions per page." Applies to every page
  // unless that page sets its own value (page.maxQuestions). Resets on
  // reload — not persisted, consistent with this app's in-memory-only design.
  const [defaultQuestionsPerPage, setDefaultQuestionsPerPage] = useState(null)

  const paperPreviewRef = useRef(null)
  const answerSheetPreviewRef = useRef(null)

  const allQuestions = useMemo(() => pages.flatMap((p) => p.questions), [pages])
  const autoTotal = useMemo(() => sumMarks(allQuestions), [allQuestions])
  const effectivePaper = {
    ...paper,
    totalMarks: paper.totalMarksOverridden ? paper.totalMarks : autoTotal,
  }
  const editingQuestion = allQuestions.find((q) => q.id === editingId) ?? null
  const targetPageIndex = pages.findIndex((p) => p.id === targetPageId)
  const hasAnyQuestions = allQuestions.length > 0

  function handleFieldChange(field, value) {
    setPaper((prev) => ({ ...prev, [field]: value }))
  }

  function handleOverrideTotal(value) {
    setPaper((prev) => ({ ...prev, totalMarks: Number(value) || 0, totalMarksOverridden: true }))
  }

  function handleResetTotalOverride() {
    setPaper((prev) => ({ ...prev, totalMarksOverridden: false }))
  }

  // Any change to the question list (add/edit/delete/reorder, on any page)
  // clears a manual total-marks override, per plan.md's marks auto-totaling rule.
  function mutatePages(updater) {
    setPages(updater)
    setPaper((prev) => (prev.totalMarksOverridden ? { ...prev, totalMarksOverridden: false } : prev))
  }

  function handleSaveQuestion(question) {
    if (editingId) {
      mutatePages((prev) =>
        prev.map((page) => ({
          ...page,
          questions: page.questions.map((q) => (q.id === editingId ? question : q)),
        })),
      )
      setEditingId(null)
    } else {
      const newQuestion = { ...question, id: createId() }
      mutatePages((prev) =>
        prev.map((page) =>
          page.id === targetPageId ? { ...page, questions: [...page.questions, newQuestion] } : page,
        ),
      )
    }
  }

  function handleDelete(id) {
    mutatePages((prev) => prev.map((page) => ({ ...page, questions: page.questions.filter((q) => q.id !== id) })))
    if (editingId === id) setEditingId(null)
  }

  function handleMove(id, direction) {
    mutatePages((prev) =>
      prev.map((page) => {
        const index = page.questions.findIndex((q) => q.id === id)
        if (index === -1) return page
        const target = index + direction
        if (target < 0 || target >= page.questions.length) return page
        const next = [...page.questions]
        ;[next[index], next[target]] = [next[target], next[index]]
        return { ...page, questions: next }
      }),
    )
  }

  function handleAddQuestionToPage(pageId) {
    setEditingId(null)
    setTargetPageId(pageId)
  }

  function handlePageMaxQuestionsChange(pageId, value) {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, maxQuestions: value } : p)))
  }

  function handleAddPage() {
    const newPage = createPage()
    setPages((prev) => [...prev, newPage])
    setTargetPageId(newPage.id)
  }

  function handleDeletePage(pageId) {
    const page = pages.find((p) => p.id === pageId)
    if (!page || page.questions.length > 0 || pages.length <= 1) return
    const next = pages.filter((p) => p.id !== pageId)
    setPages(next)
    if (targetPageId === pageId) setTargetPageId(next[0].id)
  }

  async function runExport(kind) {
    setIsExporting(true)
    try {
      const filenameBase = slugifyFilename(paper.title, 'question-paper')
      if (kind === 'paper' || kind === 'both') {
        await exportBlocksToPdf(paperPreviewRef.current, `${filenameBase}-question-paper.pdf`)
      }
      if (kind === 'answer' || kind === 'both') {
        await exportBlocksToPdf(answerSheetPreviewRef.current, `${filenameBase}-answer-sheet.pdf`)
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Question &amp; Answer Sheet Builder</h1>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Default Questions per Page (PDF)
          <input
            type="number"
            min="0"
            step="1"
            value={defaultQuestionsPerPage ?? ''}
            placeholder="Auto"
            onChange={(e) =>
              setDefaultQuestionsPerPage(e.target.value ? Number(e.target.value) : null)
            }
            className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <PaperSetupForm
            paper={paper}
            onFieldChange={handleFieldChange}
            autoTotal={autoTotal}
            onOverrideTotal={handleOverrideTotal}
            onResetTotalOverride={handleResetTotalOverride}
          />
          <QuestionBuilder
            onSave={handleSaveQuestion}
            editingQuestion={editingQuestion}
            onCancelEdit={() => setEditingId(null)}
            targetPageLabel={`Page ${targetPageIndex + 1}`}
          />

          {pages.map((page, index) => (
            <PageSection
              key={page.id}
              page={page}
              index={index}
              totalPages={pages.length}
              defaultQuestionsPerPage={defaultQuestionsPerPage}
              editingId={editingId}
              onMaxQuestionsChange={handlePageMaxQuestionsChange}
              onAddQuestion={handleAddQuestionToPage}
              onEditQuestion={setEditingId}
              onDeleteQuestion={handleDelete}
              onMoveQuestion={handleMove}
              onDeletePage={handleDeletePage}
            />
          ))}

          <button
            type="button"
            onClick={handleAddPage}
            className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
          >
            + Add Page
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <ExportControls
            onExportPaper={() => runExport('paper')}
            onExportAnswerSheet={() => runExport('answer')}
            onExportBoth={() => runExport('both')}
            disabled={!hasAnyQuestions}
            isExporting={isExporting}
          />
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Question Paper Preview</h2>
            <div className="max-h-[70vh] overflow-auto rounded border border-gray-200 bg-white">
              <PaperPreview
                ref={paperPreviewRef}
                paper={effectivePaper}
                pages={pages}
                defaultQuestionsPerPage={defaultQuestionsPerPage}
              />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Answer Sheet Preview</h2>
            <div className="max-h-[70vh] overflow-auto rounded border border-gray-200 bg-white">
              <AnswerSheetPreview
                ref={answerSheetPreviewRef}
                paper={effectivePaper}
                pages={pages}
                defaultQuestionsPerPage={defaultQuestionsPerPage}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
