export default function ExportControls({ onExportPaper, onExportAnswerSheet, onExportBoth, disabled, isExporting }) {
  return (
    <section className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <button
        type="button"
        onClick={onExportPaper}
        disabled={disabled || isExporting}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Export Question Paper (PDF)
      </button>
      <button
        type="button"
        onClick={onExportAnswerSheet}
        disabled={disabled || isExporting}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Export Answer Sheet (PDF)
      </button>
      <button
        type="button"
        onClick={onExportBoth}
        disabled={disabled || isExporting}
        className="rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
      >
        Export Both
      </button>
      {isExporting && <span className="text-sm text-gray-500">Generating PDF…</span>}
      {disabled && !isExporting && (
        <span className="text-sm text-gray-400">Add at least one question to export</span>
      )}
    </section>
  )
}
