import { forwardRef } from 'react'
import { OPTION_LETTERS, isBlankSegment, splitOnBlanks } from '../utils/questions'

function FillBlankText({ text, mode, answers }) {
  const segments = splitOnBlanks(text)
  let blankIndex = 0

  return (
    <span>
      {segments.map((segment, i) => {
        if (!isBlankSegment(segment)) return <span key={i}>{segment}</span>
        const answer = answers?.[blankIndex]
        blankIndex += 1
        return (
          <span
            key={i}
            className="mx-1 inline-block min-w-[6rem] border-b border-gray-800 text-center align-baseline"
          >
            {mode === 'answer' ? <span className="font-semibold">{answer}</span> : ' '}
          </span>
        )
      })}
    </span>
  )
}

const MCQ_LIST_CLASSES = {
  vertical: 'flex flex-col gap-0.5',
  horizontal: 'flex flex-row flex-wrap gap-x-8 gap-y-1',
  grid: 'grid grid-cols-2 gap-x-8 gap-y-1',
}

function QuestionBody({ question, mode }) {
  switch (question.type) {
    case 'mcq':
      return (
        <ul
          className={`mt-1 pl-4 text-sm text-gray-800 ${
            MCQ_LIST_CLASSES[question.optionLayout] ?? MCQ_LIST_CLASSES.vertical
          }`}
        >
          {question.options
            .map((option, i) => ({ option, i }))
            .filter(({ option }) => option.trim())
            .map(({ option, i }) => (
              <li
                key={i}
                className={mode === 'answer' && i === Number(question.correctAnswer) ? 'font-semibold' : ''}
              >
                {OPTION_LETTERS[i]}) {option}
                {mode === 'answer' && i === Number(question.correctAnswer) ? ' ✓' : ''}
              </li>
            ))}
        </ul>
      )
    case 'trueFalse':
      return (
        <p className="mt-1 text-sm text-gray-800">
          {mode === 'answer' ? (
            <span className="font-semibold">
              {question.correctAnswer === 'true' ? 'True' : 'False'}
            </span>
          ) : (
            '(Circle one: True / False)'
          )}
        </p>
      )
    case 'fillBlank':
      return (
        <p className="mt-1 text-sm text-gray-800">
          <FillBlankText text={question.text} mode={mode} answers={question.correctAnswer} />
        </p>
      )
    case 'short':
      return mode === 'answer' ? (
        <p className="mt-1 text-sm text-gray-800">
          <span className="font-semibold">Answer: </span>
          {question.correctAnswer}
        </p>
      ) : (
        <div className="mt-2 h-10 rounded border border-dashed border-gray-300" />
      )
    case 'long':
      return mode === 'answer' ? (
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
          <span className="font-semibold">Model answer: </span>
          {question.correctAnswer}
        </p>
      ) : (
        <div className="mt-2 h-28 rounded border border-dashed border-gray-300" />
      )
    default:
      return null
  }
}

const META_FIELDS = [
  { key: 'subject', label: 'Subject' },
  { key: 'className', label: 'Class' },
  { key: 'date', label: 'Date' },
  { key: 'duration', label: 'Duration' },
]

const STUDENT_INFO_FIELDS = ['Name', 'ID / Roll', 'Department']

function StudentInfoLine({ label }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-sm font-medium text-gray-700">{label}:</span>
      <span className="h-0 flex-1 border-b border-gray-400" />
    </div>
  )
}

const PreviewBase = forwardRef(function PreviewBase({ paper, questions, mode, heading }, ref) {
  const metaItems = META_FIELDS.filter((field) => paper[field.key])

  return (
    <div ref={ref} className="mx-auto max-w-2xl bg-white p-6 text-gray-900">
      <div
        data-pdf-block
        data-pdf-block-type="header"
        className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4"
      >
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {paper.title || 'Untitled Paper'}
          </h1>
          <span className="shrink-0 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {heading}
          </span>
        </div>

        {mode === 'paper' && paper.showStudentInfoFields && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-200 pt-4 sm:grid-cols-3">
            {STUDENT_INFO_FIELDS.map((label) => (
              <StudentInfoLine key={label} label={label} />
            ))}
          </div>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-gray-200 pt-4 sm:grid-cols-3">
          {metaItems.map((field) => (
            <div key={field.key}>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{field.label}</dt>
              <dd className="text-sm font-semibold text-gray-900">{paper[field.key]}</dd>
            </div>
          ))}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Marks</dt>
            <dd className="text-sm font-semibold text-gray-900">{paper.totalMarks}</dd>
          </div>
        </dl>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm italic text-gray-400">No questions added yet.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {questions.map((q, i) => (
            <li key={q.id} data-pdf-block data-pdf-block-type="question" className="break-inside-avoid">
              <p className="text-sm font-medium text-gray-900">
                {i + 1}. {q.text}{' '}
                <span className="font-normal text-gray-500">[{q.marks} marks]</span>
              </p>
              {q.image && (
                <img src={q.image} alt="" className="mt-2 max-h-64 w-auto rounded border border-gray-200 object-contain" />
              )}
              <QuestionBody question={q} mode={mode} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
})

export default PreviewBase
