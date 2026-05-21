import type { PaperCard, PaperLink, RelationType } from './types'
import { seedCards } from './seed'

const STORAGE_KEY = 'paper-cards.v1'

const normalizeCards = (raw: unknown): PaperCard[] => {
  if (!Array.isArray(raw)) return []

  const asObj = (v: unknown): Record<string, unknown> | null =>
    v && typeof v === 'object' ? (v as Record<string, unknown>) : null

  const isNotNull = <T,>(v: T | null): v is T => v !== null

  const asStringArray = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

  const isRelationType = (v: unknown): v is RelationType =>
    typeof v === 'string' &&
    (v === 'related' ||
      v === 'combine' ||
      v === 'improve' ||
      v === 'compare' ||
      v === 'baseline' ||
      v === 'extend' ||
      v === 'cite')

  const normalizeLinks = (v: unknown): PaperLink[] => {
    if (!Array.isArray(v)) return []
    return v
      .map((x) => asObj(x))
      .filter(isNotNull)
      .filter((x) => typeof x.label === 'string' && typeof x.url === 'string')
      .map((x) => ({ label: x.label as string, url: x.url as string }))
  }

  return raw.filter(Boolean).map((c) => {
    const obj = asObj(c) ?? {}

    const relations = (() => {
      const relRaw = obj.relations
      if (Array.isArray(relRaw)) {
        return relRaw
          .map((r) => asObj(r))
          .filter(isNotNull)
          .filter((r) => typeof r.toId === 'string')
          .map((r) => ({
            toId: String(r.toId),
            type: isRelationType(r.type) ? r.type : 'related',
            note: typeof r.note === 'string' ? r.note : undefined,
          }))
      }

      const legacy = asStringArray(obj.relatedPaperIds)
      return legacy.map((id) => ({ toId: id, type: 'related' as const }))
    })()

    return {
      id: String(obj.id ?? ''),
      title: String(obj.title ?? ''),
      topics: asStringArray(obj.topics),
      createdAt: String(obj.createdAt ?? ''),
      updatedAt: String(obj.updatedAt ?? ''),
      year: typeof obj.year === 'number' ? obj.year : undefined,
      authors: typeof obj.authors === 'string' ? obj.authors : '',
      venue: typeof obj.venue === 'string' ? obj.venue : '',
      links: normalizeLinks(obj.links),
      oneSentence: String(obj.oneSentence ?? ''),
      threeMethod: String(obj.threeMethod ?? ''),
      contributions: asStringArray(obj.contributions),
      keyEvidence: String(obj.keyEvidence ?? ''),
      reproduciblePoints: String(obj.reproduciblePoints ?? ''),
      limitations: String(obj.limitations ?? ''),
      relations,
      takeAway: String(obj.takeAway ?? ''),
    } satisfies PaperCard
  })
}

export const loadCards = (): PaperCard[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedCards()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }

    const parsed = JSON.parse(raw) as unknown
    return normalizeCards(parsed)
  } catch {
    return []
  }
}

export const saveCards = (cards: PaperCard[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}

export const mergeImportedCards = (
  current: PaperCard[],
  incoming: PaperCard[]
): PaperCard[] => {
  const byId = new Map<string, PaperCard>()
  for (const c of current) byId.set(c.id, c)
  for (const c of normalizeCards(incoming as unknown)) byId.set(c.id, c)
  return Array.from(byId.values()).sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1
  )
}
