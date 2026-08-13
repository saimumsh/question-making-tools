import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

const MARGIN = 36 // pt, ~0.5in
const BLOCK_GAP = 12 // pt

// Captures each [data-pdf-block] element inside `containerElement` as its own
// image and places them one at a time, starting a new page whenever a block
// wouldn't fit on the current page. This keeps a single question from being
// sliced across a page break, unlike a single full-page canvas capture.
//
// `questionsPerPage`, if set, forces a page break after that many question
// blocks even when more would still fit — the height-fit check still applies
// on top of it, so an oversized block can still force an earlier break.
export async function exportBlocksToPdf(containerElement, filename, questionsPerPage) {
  const blocks = Array.from(containerElement.querySelectorAll('[data-pdf-block]'))
  if (blocks.length === 0) return

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2
  const maxContentHeight = pageHeight - MARGIN * 2

  let y = MARGIN
  let questionsOnPage = 0

  for (const block of blocks) {
    const isQuestion = block.dataset.pdfBlockType === 'question'
    const canvas = await html2canvas(block, { scale: 2, backgroundColor: '#ffffff' })
    let imgWidth = contentWidth
    let imgHeight = (canvas.height * imgWidth) / canvas.width

    // A block taller than a full page gets scaled down to fit rather than split.
    if (imgHeight > maxContentHeight) {
      imgHeight = maxContentHeight
      imgWidth = (canvas.width * imgHeight) / canvas.height
    }

    const hitsUserLimit = isQuestion && questionsPerPage > 0 && questionsOnPage >= questionsPerPage
    const overflowsPage = y > MARGIN && y + imgHeight > MARGIN + maxContentHeight

    if (hitsUserLimit || overflowsPage) {
      pdf.addPage()
      y = MARGIN
      questionsOnPage = 0
    }

    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', MARGIN, y, imgWidth, imgHeight)
    y += imgHeight + BLOCK_GAP
    if (isQuestion) questionsOnPage += 1
  }

  pdf.save(filename)
}

export function slugifyFilename(title, fallback) {
  const base = (title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base || fallback
}
