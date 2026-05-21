import type { PaperCard } from './types'
import seedRaw from './seed.json'

const iso = () => new Date().toISOString()

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
