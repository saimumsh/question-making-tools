import { forwardRef } from 'react'
import PreviewBase from './PreviewBase'

const AnswerSheetPreview = forwardRef(function AnswerSheetPreview({ paper, questions }, ref) {
  return (
    <PreviewBase
      ref={ref}
      paper={paper}
      questions={questions}
      mode="answer"
      heading="Answer Sheet"
    />
  )
})

export default AnswerSheetPreview
