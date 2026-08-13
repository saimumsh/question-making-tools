import { forwardRef } from 'react'
import PreviewBase from './PreviewBase'

const PaperPreview = forwardRef(function PaperPreview({ paper, questions }, ref) {
  return (
    <PreviewBase
      ref={ref}
      paper={paper}
      questions={questions}
      mode="paper"
      heading="Question Paper"
    />
  )
})

export default PaperPreview
