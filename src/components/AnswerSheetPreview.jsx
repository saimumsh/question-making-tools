import { forwardRef } from 'react'
import PreviewBase from './PreviewBase'

const AnswerSheetPreview = forwardRef(function AnswerSheetPreview({ paper, pages, defaultQuestionsPerPage }, ref) {
  return (
    <PreviewBase
      ref={ref}
      paper={paper}
      pages={pages}
      defaultQuestionsPerPage={defaultQuestionsPerPage}
      mode="answer"
      heading="Answer Sheet"
    />
  )
})

export default AnswerSheetPreview
