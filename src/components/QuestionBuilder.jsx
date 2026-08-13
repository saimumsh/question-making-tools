import { useEffect, useState } from 'react'
import {
  MCQ_LAYOUTS,
  OPTION_LETTERS,
  QUESTION_TYPES,
  countBlanks,
  draftToQuestion,
  emptyQuestionDraft,
  getDraftError,
  questionToDraft,
} from '../utils/questions'

export default function QuestionBuilder({ onSave, editingQuestion, onCancelEdit }) {
  const [draft, setDraft] = useState(() => emptyQuestionDraft())

  useEffect(() => {
    setDraft(editingQuestion ? questionToDraft(editingQuestion) : emptyQuestionDraft())
  }, [editingQuestion])

  function updateDraft(patch) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  function handleTypeChange(type) {
    setDraft(emptyQuestionDraft(type))
  }

  function handleTextChange(text) {
    setDraft((prev) => {
      const next = { ...prev, text }
      if (prev.type === 'fillBlank') {
        const blankCount = countBlanks(text)
        const blankAnswers = Array.from({ length: blankCount }, (_, i) => prev.blankAnswers[i] ?? '')
        next.blankAnswers = blankAnswers
      }
      return next
    })
  }

  function handleOptionChange(index, value) {
    setDraft((prev) => {
      const options = [...prev.options]
      options[index] = value
      return { ...prev, options }
    })
  }

  function handleBlankAnswerChange(index, value) {
    setDraft((prev) => {
      const blankAnswers = [...prev.blankAnswers]
      blankAnswers[index] = value
      return { ...prev, blankAnswers }
    })
  }

  function handleImageChange(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateDraft({ image: reader.result })
    reader.readAsDataURL(file)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (validationError) return
    onSave(draftToQuestion(draft, editingQuestion?.id))
    if (!editingQuestion) setDraft(emptyQuestionDraft(draft.type))
  }

  const validationError = getDraftError(draft)
  const blankCount = draft.type === 'fillBlank' ? countBlanks(draft.text) : 0

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">
        {editingQuestion ? 'Edit Question' : 'Add Question'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Question Type
          <select
            value={draft.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Question Text
          <textarea
            value={draft.text}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={3}
            placeholder={
              draft.type === 'fillBlank'
                ? 'e.g. The capital of France is ___.'
                : 'Enter the question text'
            }
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {draft.type === 'fillBlank' && (
            <span className="text-xs text-gray-500">
              Mark each blank with three or more underscores, e.g. ___
            </span>
          )}
        </label>

        <div className="flex flex-col gap-1 text-sm text-gray-700">
          Image (optional)
          {draft.image ? (
            <div className="flex items-center gap-3">
              <img src={draft.image} alt="Question" className="h-20 w-auto rounded border border-gray-200 object-contain" />
              <button
                type="button"
                onClick={() => updateDraft({ image: null })}
                className="text-xs text-red-600 hover:underline"
              >
                Remove image
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files?.[0])}
              className="text-sm text-gray-500 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
          )}
        </div>

        {draft.type === 'mcq' && (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Options (select the correct one)</span>
            {draft.options.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={draft.correctOptionIndex === i}
                  onChange={() => updateDraft({ correctOptionIndex: i })}
                />
                <span className="w-5 text-sm text-gray-500">{OPTION_LETTERS[i]})</span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`Option ${OPTION_LETTERS[i]}`}
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ))}

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Option Layout
              <select
                value={draft.optionLayout}
                onChange={(e) => updateDraft({ optionLayout: e.target.value })}
                className="w-56 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {MCQ_LAYOUTS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {draft.type === 'trueFalse' && (
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="trueFalseAnswer"
                checked={draft.trueFalseAnswer === 'true'}
                onChange={() => updateDraft({ trueFalseAnswer: 'true' })}
              />
              True
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="trueFalseAnswer"
                checked={draft.trueFalseAnswer === 'false'}
                onChange={() => updateDraft({ trueFalseAnswer: 'false' })}
              />
              False
            </label>
          </div>
        )}

        {draft.type === 'fillBlank' && (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">
              {blankCount > 0 ? 'Answers for each blank' : 'Add ___ to the question text to create a blank'}
            </span>
            {Array.from({ length: blankCount }, (_, i) => (
              <input
                key={i}
                type="text"
                value={draft.blankAnswers[i] ?? ''}
                onChange={(e) => handleBlankAnswerChange(i, e.target.value)}
                placeholder={`Answer for blank ${i + 1}`}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ))}
          </div>
        )}

        {(draft.type === 'short' || draft.type === 'long') && (
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Model Answer
            <textarea
              value={draft.modelAnswer}
              onChange={(e) => updateDraft({ modelAnswer: e.target.value })}
              rows={draft.type === 'long' ? 4 : 2}
              placeholder="Expected answer or grading notes"
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        )}

        <label className="flex w-32 flex-col gap-1 text-sm text-gray-700">
          Marks
          <input
            type="number"
            min="1"
            step="1"
            value={draft.marks}
            onChange={(e) => updateDraft({ marks: e.target.value })}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!!validationError}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {editingQuestion ? 'Save Changes' : 'Add Question'}
          </button>
          {editingQuestion && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          {validationError && <span className="text-xs text-gray-500">{validationError}</span>}
        </div>
      </form>
    </section>
  )
}
