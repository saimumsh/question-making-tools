import { QUESTION_TYPES, sumMarks } from '../utils/questions'

const TYPE_LABELS = Object.fromEntries(QUESTION_TYPES.map((t) => [t.value, t.label]))

export default function QuestionList({ questions, editingId, onEdit, onDelete, onMove }) {
  const total = sumMarks(questions)

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Questions ({questions.length})</h2>
        <span className="text-sm text-gray-500">Total: {total} marks</span>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-gray-400">No questions added yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {questions.map((q, i) => (
            <li
              key={q.id}
              className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 ${
                editingId === q.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5">{TYPE_LABELS[q.type]}</span>
                  <span>{q.marks} marks</span>
                </div>
                <p className="truncate text-sm text-gray-800">
                  {i + 1}. {q.text || <span className="italic text-gray-400">(empty question)</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onMove(q.id, -1)}
                  disabled={i === 0}
                  className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMove(q.id, 1)}
                  disabled={i === questions.length - 1}
                  className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(q.id)}
                  className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(q.id)}
                  className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
