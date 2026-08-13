const FIELDS = [
  { key: 'title', label: 'Title', placeholder: 'e.g. Mid-Term Examination' },
  { key: 'subject', label: 'Subject', placeholder: 'e.g. Mathematics' },
  { key: 'className', label: 'Class / Grade', placeholder: 'e.g. Grade 8' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'duration', label: 'Duration', placeholder: 'e.g. 90 minutes' },
]

export default function PaperSetupForm({ paper, onFieldChange, autoTotal, onOverrideTotal, onResetTotalOverride }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Paper Setup</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-sm text-gray-700">
            {field.label}
            <input
              type={field.type ?? 'text'}
              value={paper[field.key]}
              placeholder={field.placeholder}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        ))}

        <div className="flex flex-col gap-1 text-sm text-gray-700">
          Total Marks
          {paper.totalMarksOverridden ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={paper.totalMarks}
                onChange={(e) => onOverrideTotal(e.target.value)}
                className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={onResetTotalOverride}
                className="text-xs text-indigo-600 hover:underline"
              >
                Reset to auto
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-600">
                {autoTotal} (auto)
              </span>
              <button
                type="button"
                onClick={() => onOverrideTotal(autoTotal)}
                className="text-xs text-indigo-600 hover:underline"
              >
                Override
              </button>
            </div>
          )}
        </div>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Questions per Page (PDF)
          <input
            type="number"
            min="0"
            step="1"
            value={paper.questionsPerPage ?? ''}
            placeholder="Auto (fit as many as possible)"
            onChange={(e) => onFieldChange('questionsPerPage', e.target.value ? Number(e.target.value) : null)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={paper.showStudentInfoFields}
          onChange={(e) => onFieldChange('showStudentInfoFields', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Include Name / ID / Roll / Department blanks on the Question Paper for students to fill in
      </label>
    </section>
  )
}
