import type { PaperCard } from './types'
import seedRaw from './seed.json'

const iso = () => new Date().toISOString()

const hashString = (input: string) => {
  let hash = 0
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) | 0
  return String(Math.abs(hash))
}

export const seedSignature = hashString(JSON.stringify(seedRaw))

type SeedCardJson = Omit<PaperCard, 'createdAt' | 'updatedAt'> &
  Partial<Pick<PaperCard, 'createdAt' | 'updatedAt'>>

export const seedCards = (): PaperCard[] => {
  const now = iso()
  const seed = seedRaw as unknown as SeedCardJson[]

  return seed.map((c) => ({
    ...c,
    authors: c.authors ?? '',
    venue: c.venue ?? '',
    links: c.links ?? [],
    year: c.year,
    contributions: c.contributions ?? [],
    relations: c.relations ?? [],
    createdAt: c.createdAt ?? now,
    updatedAt: c.updatedAt ?? c.createdAt ?? now,
  }))
}
