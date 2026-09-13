import QuestionList from './QuestionList'

export default function PageSection({
  page,
  index,
  totalPages,
  defaultQuestionsPerPage,
  editingId,
  onMaxQuestionsChange,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onDeletePage,
}) {
  const canDeletePage = totalPages > 1 && page.questions.length === 0

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Page {index + 1}</h2>
        {canDeletePage && (
          <button
            type="button"
            onClick={() => onDeletePage(page.id)}
            className="text-xs text-red-600 hover:underline"
          >
            Delete Page
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-col gap-1 text-sm text-gray-700">
        Max questions on this page
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={page.maxQuestions ?? ''}
            placeholder={
              defaultQuestionsPerPage
                ? `Use default (${defaultQuestionsPerPage})`
                : 'Auto (fit as many as possible)'
            }
            onChange={(e) =>
              onMaxQuestionsChange(page.id, e.target.value ? Number(e.target.value) : null)
            }
            className="w-48 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {page.maxQuestions != null && (
            <button
              type="button"
              onClick={() => onMaxQuestionsChange(page.id, null)}
              className="whitespace-nowrap text-xs text-indigo-600 hover:underline"
            >
              Reset to default
            </button>
          )}
        </div>
      </div>

      <QuestionList
        questions={page.questions}
        editingId={editingId}
        onEdit={onEditQuestion}
        onDelete={onDeleteQuestion}
        onMove={onMoveQuestion}
      />

      <button
        type="button"
        onClick={() => onAddQuestion(page.id)}
        className="mt-3 w-full rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
      >
        + Add Question to Page {index + 1}
      </button>
    </section>
  )
}
