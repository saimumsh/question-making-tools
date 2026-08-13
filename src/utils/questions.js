export const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'trueFalse', label: 'True / False' },
  { value: 'fillBlank', label: 'Fill in the Blank' },
  { value: 'short', label: 'Short Answer' },
  { value: 'long', label: 'Long Answer / Essay' },
]

export const OPTION_LETTERS = ['a', 'b', 'c', 'd']

export const MCQ_LAYOUTS = [
  { value: 'vertical', label: 'Vertical (one per line)' },
  { value: 'horizontal', label: 'Horizontal (in a row)' },
  { value: 'grid', label: 'Both (2×2 grid)' },
]

export function createId() {
  return crypto.randomUUID()
}

export function sumMarks(questions) {
  return questions.reduce((total, q) => total + (Number(q.marks) || 0), 0)
}

// A blank in fill-in-the-blank text is any run of 3+ underscores.
const BLANK_PATTERN = /_{3,}/g

export function countBlanks(text) {
  const matches = text.match(BLANK_PATTERN)
  return matches ? matches.length : 0
}

export function splitOnBlanks(text) {
  return text.split(new RegExp(`(${BLANK_PATTERN.source})`, 'g'))
}

export function isBlankSegment(segment) {
  return /^_{3,}$/.test(segment)
}

export function emptyQuestionDraft(type = 'mcq') {
  return {
    type,
    text: '',
    marks: 1,
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    optionLayout: 'vertical', // mcq only
    trueFalseAnswer: 'true',
    blankAnswers: [],
    modelAnswer: '',
    image: null, // data URL, optional, any question type
  }
}

// Converts an internal builder draft (form-shaped) into a stored question
// (plan.md state-shape), or back, since the two shapes diverge per type.
export function draftToQuestion(draft, id) {
  const base = {
    id,
    type: draft.type,
    text: draft.text.trim(),
    marks: Number(draft.marks) || 0,
    image: draft.image || null,
  }

  switch (draft.type) {
    case 'mcq':
      return {
        ...base,
        options: draft.options.map((o) => o.trim()),
        correctAnswer: draft.correctOptionIndex,
        optionLayout: draft.optionLayout,
      }
    case 'trueFalse':
      return { ...base, correctAnswer: draft.trueFalseAnswer }
    case 'fillBlank':
      return { ...base, correctAnswer: draft.blankAnswers.map((a) => a.trim()) }
    case 'short':
    case 'long':
      return { ...base, correctAnswer: draft.modelAnswer.trim() }
    default:
      return base
  }
}

export function questionToDraft(question) {
  const draft = emptyQuestionDraft(question.type)
  draft.text = question.text
  draft.marks = question.marks
  draft.image = question.image ?? null

  switch (question.type) {
    case 'mcq':
      draft.options = [0, 1, 2, 3].map((i) => question.options?.[i] ?? '')
      draft.correctOptionIndex = Number(question.correctAnswer) || 0
      draft.optionLayout = question.optionLayout ?? 'vertical'
      break
    case 'trueFalse':
      draft.trueFalseAnswer = question.correctAnswer === 'false' ? 'false' : 'true'
      break
    case 'fillBlank':
      draft.blankAnswers = Array.isArray(question.correctAnswer) ? [...question.correctAnswer] : []
      break
    case 'short':
    case 'long':
      draft.modelAnswer = question.correctAnswer ?? ''
      break
  }

  return draft
}

// Returns a human-readable reason the draft can't be saved yet, or null if it's valid.
export function getDraftError(draft) {
  if (!draft.text.trim()) return 'Question text is required.'
  if (!(Number(draft.marks) > 0)) return 'Marks must be greater than 0.'

  switch (draft.type) {
    case 'mcq': {
      const filled = draft.options.filter((o) => o.trim())
      if (filled.length < 2) return 'Fill in at least 2 options.'
      if (!draft.options[draft.correctOptionIndex]?.trim()) {
        return 'The option selected as correct must have text.'
      }
      return null
    }
    case 'trueFalse':
      return draft.trueFalseAnswer === 'true' || draft.trueFalseAnswer === 'false'
        ? null
        : 'Select True or False.'
    case 'fillBlank': {
      const blankCount = countBlanks(draft.text)
      if (blankCount < 1) return 'Add at least one blank (___) to the question text.'
      if (draft.blankAnswers.length !== blankCount || !draft.blankAnswers.every((a) => a.trim())) {
        return 'Provide an answer for every blank.'
      }
      return null
    }
    case 'short':
    case 'long':
      return draft.modelAnswer.trim() ? null : 'Model answer is required.'
    default:
      return 'Unknown question type.'
  }
}
