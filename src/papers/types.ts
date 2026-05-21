export type PaperLink = {
  label: string
  url: string
}

export type RelationType =
  | 'related'
  | 'combine'
  | 'improve'
  | 'compare'
  | 'baseline'
  | 'extend'
  | 'cite'

export type PaperRelation = {
  toId: string
  type: RelationType
  note?: string
}

export type PaperCard = {
  id: string
  title: string
  topics: string[]
  createdAt: string
  updatedAt: string
  year?: number
  authors?: string
  venue?: string
  links?: PaperLink[]
  oneSentence: string
  threeMethod: string
  contributions: string[]
  keyEvidence: string
  reproduciblePoints: string
  limitations: string
  relations: PaperRelation[]
  takeAway: string
}

export type PaperDraft = Omit<PaperCard, 'id' | 'createdAt' | 'updatedAt'>

export const createEmptyDraft = (topics: string[]): PaperDraft => ({
  title: '',
  topics,
  year: undefined,
  authors: '',
  venue: '',
  links: [],
  oneSentence: '',
  threeMethod: '',
  contributions: [],
  keyEvidence: '',
  reproduciblePoints: '',
  limitations: '',
  relations: [],
  takeAway: '',
})

export const nowIso = () => new Date().toISOString()

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
