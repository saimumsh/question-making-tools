import { useMemo, useRef, useState } from 'react'
import PaperSetupForm from './components/PaperSetupForm'
import QuestionBuilder from './components/QuestionBuilder'
import QuestionList from './components/QuestionList'
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
  questionsPerPage: null, // null = auto (fit as many as possible)
}

export default function App() {
  const [paper, setPaper] = useState(initialPaper)
  const [questions, setQuestions] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  const paperPreviewRef = useRef(null)
  const answerSheetPreviewRef = useRef(null)

  const autoTotal = useMemo(() => sumMarks(questions), [questions])
  const effectivePaper = {
    ...paper,
    totalMarks: paper.totalMarksOverridden ? paper.totalMarks : autoTotal,
  }
  const editingQuestion = questions.find((q) => q.id === editingId) ?? null

  function handleFieldChange(field, value) {
    setPaper((prev) => ({ ...prev, [field]: value }))
  }

  function handleOverrideTotal(value) {
    setPaper((prev) => ({ ...prev, totalMarks: Number(value) || 0, totalMarksOverridden: true }))
  }

  function handleResetTotalOverride() {
    setPaper((prev) => ({ ...prev, totalMarksOverridden: false }))
  }

  // Any change to the question list (add/edit/delete/reorder) clears a manual
  // total-marks override, per plan.md's marks auto-totaling rule.
  function mutateQuestions(updater) {
    setQuestions(updater)
    setPaper((prev) => (prev.totalMarksOverridden ? { ...prev, totalMarksOverridden: false } : prev))
  }

  function handleSaveQuestion(question) {
    if (editingId) {
      mutateQuestions((prev) => prev.map((q) => (q.id === editingId ? question : q)))
      setEditingId(null)
    } else {
      mutateQuestions((prev) => [...prev, { ...question, id: createId() }])
    }
  }

  function handleDelete(id) {
    mutateQuestions((prev) => prev.filter((q) => q.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function handleMove(id, direction) {
    mutateQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id)
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function runExport(kind) {
    setIsExporting(true)
    try {
      const filenameBase = slugifyFilename(paper.title, 'question-paper')
      if (kind === 'paper' || kind === 'both') {
        await exportBlocksToPdf(paperPreviewRef.current, `${filenameBase}-question-paper.pdf`, paper.questionsPerPage)
      }
      if (kind === 'answer' || kind === 'both') {
        await exportBlocksToPdf(answerSheetPreviewRef.current, `${filenameBase}-answer-sheet.pdf`, paper.questionsPerPage)
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Question &amp; Answer Sheet Builder</h1>
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
          />
          <QuestionList
            questions={questions}
            editingId={editingId}
            onEdit={setEditingId}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        </div>

        <div className="flex flex-col gap-6">
          <ExportControls
            onExportPaper={() => runExport('paper')}
            onExportAnswerSheet={() => runExport('answer')}
            onExportBoth={() => runExport('both')}
            disabled={questions.length === 0}
            isExporting={isExporting}
          />
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Question Paper Preview</h2>
            <div className="max-h-[70vh] overflow-auto rounded border border-gray-200 bg-white">
              <PaperPreview ref={paperPreviewRef} paper={effectivePaper} questions={questions} />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Answer Sheet Preview</h2>
            <div className="max-h-[70vh] overflow-auto rounded border border-gray-200 bg-white">
              <AnswerSheetPreview ref={answerSheetPreviewRef} paper={effectivePaper} questions={questions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
