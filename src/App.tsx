import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GraphView } from './components/GraphView'
import { PaperPanel } from './components/PaperPanel'
import type { PaperCard, PaperDraft } from './papers/types'
import { loadCards, mergeImportedCards, saveCards } from './papers/storage'

function App() {
  const [cards, setCards] = useState<PaperCard[]>(() => loadCards())
  const [activeTopic, setActiveTopic] = useState('安全')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedStackIds, setSelectedStackIds] = useState<string[]>([])
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'create'>('view')
  const [query, setQuery] = useState('')
  const importRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!cards.length) return
    saveCards(cards)
  }, [cards])

  const topics = useMemo(() => {
    const set = new Set<string>()
    for (const c of cards) for (const t of c.topics) set.add(t)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [cards])

  const effectiveTopic = topics.includes(activeTopic)
    ? activeTopic
    : (topics[0] ?? activeTopic)

  const selectCard = (id: string | null) => {
    setSelectedId(id)
    if (!id) return
    setPanelMode('view')
    setSelectedStackIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 50))
  }

  const removeFromStack = (id: string) => {
    setSelectedStackIds((prev) => {
      const next = prev.filter((x) => x !== id)
      setSelectedId((cur) => (cur === id ? (next[0] ?? null) : cur))
      return next
    })
  }

  const clearStack = () => {
    setSelectedStackIds([])
    setSelectedId(null)
    setPanelMode('view')
  }

  const create = (draft: PaperDraft) => {
    const now = new Date().toISOString()
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    const card: PaperCard = {
      id,
      ...draft,
      createdAt: now,
      updatedAt: now,
    }
    setCards((prev) => [card, ...prev])
    selectCard(id)
    if (draft.topics[0]) setActiveTopic(draft.topics[0])
  }

  const update = (id: string, draft: PaperDraft) => {
    const now = new Date().toISOString()
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...draft, updatedAt: now } : c))
    )
  }

  const del = (id: string) => {
    setCards((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({
          ...c,
          relations: c.relations.filter((r) => r.toId !== id),
        }))
    )
    setSelectedStackIds((prev) => prev.filter((x) => x !== id))
    setSelectedId((cur) => (cur === id ? null : cur))
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(cards, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paper-cards-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File) => {
    const text = await file.text()
    const parsed = JSON.parse(text) as unknown
    if (!Array.isArray(parsed)) return
    const incoming = (parsed as unknown[]).filter(Boolean) as PaperCard[]
    setCards((prev) => mergeImportedCards(prev, incoming))
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-title">Paper Globe</div>
          <div className="brand-sub">方向 → 论文节点 → 卡片复盘</div>
        </div>

        <div className="controls">
          <div className="control">
            <div className="control-label">方向</div>
            <select
              value={topics.includes(effectiveTopic) ? effectiveTopic : ''}
              onChange={(e) => setActiveTopic(e.target.value)}
            >
              {topics.length ? null : <option value="">（暂无方向）</option>}
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="control">
            <div className="control-label">自定义方向</div>
            <input
              value={activeTopic}
              onChange={(e) => setActiveTopic(e.target.value)}
              placeholder="例如：安全 / MRL / 过平滑"
            />
          </div>

          <div className="control-row">
            <button className="btn" onClick={() => importRef.current?.click()}>
              导入
            </button>
            <button className="btn" onClick={exportJson}>
              导出
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                void importJson(file)
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </header>

      <main className="main">
        <div className="graph">
          <GraphView
            cards={cards}
            activeTopic={effectiveTopic}
            selectedId={selectedId}
            onSelect={selectCard}
          />
        </div>
        <div className="side">
          <PaperPanel
            cards={cards}
            activeTopic={effectiveTopic}
            selectedId={selectedId}
            selectedStackIds={selectedStackIds}
            mode={panelMode}
            onModeChange={setPanelMode}
            query={query}
            onQueryChange={setQuery}
            onSelect={selectCard}
            onRemoveFromStack={removeFromStack}
            onClearStack={clearStack}
            onCreate={create}
            onUpdate={update}
            onDelete={del}
          />
        </div>
      </main>
    </div>
  )
}

export default App
