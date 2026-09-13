import { forwardRef } from 'react'
import PreviewBase from './PreviewBase'

const PaperPreview = forwardRef(function PaperPreview({ paper, pages, defaultQuestionsPerPage }, ref) {
  return (
    <PreviewBase
      ref={ref}
      paper={paper}
      pages={pages}
      defaultQuestionsPerPage={defaultQuestionsPerPage}
      mode="paper"
      heading="Question Paper"
    />
  )
})

export default PaperPreview
