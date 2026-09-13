import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

const MARGIN = 36 // pt, ~0.5in
const BLOCK_GAP = 12 // pt

// Question blocks carry `data-page-id` (which builder "page" section they
// belong to) and `data-page-limit` (that page's effective questions-per-page
// limit, or '' for unlimited), set by PreviewBase. A change in `data-page-id`
// is always a hard page break: a builder page never shares a physical PDF
// page with another builder page.
//
// Within one builder page's run of blocks:
// - If a limit is set, the run is split into chunks of at most `limit`
//   questions. Each chunk gets its own physical page, sharing that page's
//   height equally among however many questions actually landed in it (so a
//   chunk of 1 fills the whole page, a chunk of 3 splits it into thirds) —
//   never leaving reserved-but-empty slots.
// - If unlimited, blocks pack at their natural height and only break to a
//   new page when the next block wouldn't fit in the remaining space.
export async function exportBlocksToPdf(containerElement, filename) {
  const allBlocks = Array.from(containerElement.querySelectorAll('[data-pdf-block]'))
  const headerBlock = allBlocks.find((b) => b.dataset.pdfBlockType === 'header')
  const questionBlocks = allBlocks.filter((b) => b.dataset.pdfBlockType === 'question')
  if (!headerBlock && questionBlocks.length === 0) return

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2
  const maxContentHeight = pageHeight - MARGIN * 2

  // Renders a block into an image, scaled down to fit `maxHeight` if it
  // would otherwise be taller (never split across a page).
  async function captureFitted(block, maxHeight) {
    const canvas = await html2canvas(block, { scale: 2, backgroundColor: '#ffffff' })
    let width = contentWidth
    let height = (canvas.height * width) / canvas.width
    if (height > maxHeight) {
      height = maxHeight
      width = (canvas.width * height) / canvas.height
    }
    return { dataUrl: canvas.toDataURL('image/png'), width, height }
  }

  let y = MARGIN

  if (headerBlock) {
    const { dataUrl, width, height } = await captureFitted(headerBlock, maxContentHeight)
    pdf.addImage(dataUrl, 'PNG', MARGIN, y, width, height)
    y += height + BLOCK_GAP
  }

  // Group consecutive question blocks by their builder page (data-page-id).
  const pageGroups = []
  for (const block of questionBlocks) {
    const pageId = block.dataset.pageId ?? null
    const limit = Number(block.dataset.pageLimit) || 0
    const last = pageGroups[pageGroups.length - 1]
    if (last && last.pageId === pageId) {
      last.blocks.push(block)
    } else {
      pageGroups.push({ pageId, limit, blocks: [block] })
    }
  }

  // Only the very first unit (right after the header, still on page 1)
  // skips the leading page break — every unit after it always starts fresh.
  let isFirstUnit = true

  for (const group of pageGroups) {
    if (group.limit > 0) {
      for (let i = 0; i < group.blocks.length; i += group.limit) {
        const chunk = group.blocks.slice(i, i + group.limit)
        if (!isFirstUnit) {
          pdf.addPage()
          y = MARGIN
        }
        isFirstUnit = false

        const available = MARGIN + maxContentHeight - y
        const slotHeight = available / chunk.length
        for (let s = 0; s < chunk.length; s++) {
          const { dataUrl, width, height } = await captureFitted(chunk[s], slotHeight)
          pdf.addImage(dataUrl, 'PNG', MARGIN, y + s * slotHeight, width, height)
        }
        y = MARGIN + maxContentHeight
      }
    } else {
      if (!isFirstUnit) {
        pdf.addPage()
        y = MARGIN
      }
      isFirstUnit = false

      for (const block of group.blocks) {
        const { dataUrl, width, height } = await captureFitted(block, maxContentHeight)
        const overflowsPage = y > MARGIN && y + height > MARGIN + maxContentHeight
        if (overflowsPage) {
          pdf.addPage()
          y = MARGIN
        }
        pdf.addImage(dataUrl, 'PNG', MARGIN, y, width, height)
        y += height + BLOCK_GAP
      }
    }
  }

  pdf.save(filename)
}

export function slugifyFilename(title, fallback) {
  const base = (title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base || fallback
}
