import { useMemo, useState } from 'react'
import type {
  PaperCard,
  PaperDraft,
  PaperLink,
  PaperRelation,
  RelationType,
} from '../papers/types'
import { createEmptyDraft } from '../papers/types'

type Mode = 'view' | 'edit' | 'create'

type FormState = {
  title: string
  topicsText: string
  yearText: string
  authors: string
  venue: string
  linksText: string
  oneSentence: string
  threeMethod: string
  contributionsText: string
  keyEvidence: string
  reproduciblePoints: string
  limitations: string
  takeAway: string
  relations: Array<{ toId: string; type: RelationType; note: string }>
}

const relationTypeOptions: RelationType[] = [
  'related',
  'combine',
  'improve',
  'compare',
  'baseline',
  'extend',
  'cite',
]

const relationTypeLabel = (t: RelationType) => {
  switch (t) {
    case 'combine':
      return '结合'
    case 'improve':
      return '改进'
    case 'compare':
      return '对比'
    case 'baseline':
      return '基线'
    case 'extend':
      return '延续'
    case 'cite':
      return '引用'
    case 'related':
    default:
      return '相关'
  }
}

function RelatedEditor(props: {
  cards: PaperCard[]
  excludedId?: string
  relations: Array<{ toId: string; type: RelationType; note: string }>
  onChange: (next: Array<{ toId: string; type: RelationType; note: string }>) => void
}) {
  const [newToId, setNewToId] = useState('')
  const [newType, setNewType] = useState<RelationType>('related')
  const [newNote, setNewNote] = useState('')

  const options = props.cards
    .filter((c) => c.id !== props.excludedId)
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="field">
      <div className="label">关系（结合/改进/对比/基线…）</div>
      <div className="related-list">
        {props.relations.length ? (
          props.relations.map((r, idx) => (
            <div key={`${r.toId}-${idx}`} className="rel-row">
              <select
                value={r.toId}
                onChange={(e) => {
                  const toId = e.target.value
                  props.onChange(
                    props.relations.map((x, i) => (i === idx ? { ...x, toId } : x))
                  )
                }}
              >
                <option value="">（选择论文）</option>
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <select
                value={r.type}
                onChange={(e) => {
                  const type = e.target.value as RelationType
                  props.onChange(
                    props.relations.map((x, i) => (i === idx ? { ...x, type } : x))
                  )
                }}
              >
                {relationTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {relationTypeLabel(t)}
                  </option>
                ))}
              </select>

              <input
                value={r.note}
                onChange={(e) => {
                  const note = e.target.value
                  props.onChange(
                    props.relations.map((x, i) => (i === idx ? { ...x, note } : x))
                  )
                }}
                placeholder="备注（可选）"
              />

              <button
                className="stack-remove"
                type="button"
                onClick={() =>
                  props.onChange(props.relations.filter((_, i) => i !== idx))
                }
              >
                删除
              </button>
            </div>
          ))
        ) : (
          <div className="muted">—</div>
        )}

        <div className="rel-row">
          <select value={newToId} onChange={(e) => setNewToId(e.target.value)}>
            <option value="">（选择论文）</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as RelationType)}
          >
            {relationTypeOptions.map((t) => (
              <option key={t} value={t}>
                {relationTypeLabel(t)}
              </option>
            ))}
          </select>

          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="备注（可选）"
          />

          <button
            className="btn"
            type="button"
            onClick={() => {
              if (!newToId) return
              props.onChange([
                ...props.relations,
                { toId: newToId, type: newType, note: newNote.trim() },
              ])
              setNewToId('')
              setNewType('related')
              setNewNote('')
            }}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  )
}

const normalizeTopics = (text: string) =>
  Array.from(
    new Set(
      text
        .split(/[,，\n]/g)
        .map((t) => t.trim())
        .filter(Boolean)
    )
  )

const parseLinks = (text: string): PaperLink[] => {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const links: PaperLink[] = []
  for (const line of lines) {
    const [label, url] = line.split(/\s+/)
    if (!url) continue
    links.push({ label: label ?? url, url })
  }
  return links
}

const draftToForm = (draft: PaperDraft, allCards: PaperCard[]): FormState => ({
  title: draft.title,
  topicsText: draft.topics.join(', '),
  yearText: draft.year ? String(draft.year) : '',
  authors: draft.authors ?? '',
  venue: draft.venue ?? '',
  linksText: (draft.links ?? []).map((l) => `${l.label} ${l.url}`).join('\n'),
  oneSentence: draft.oneSentence,
  threeMethod: draft.threeMethod,
  contributionsText: draft.contributions.join('\n'),
  keyEvidence: draft.keyEvidence,
  reproduciblePoints: draft.reproduciblePoints,
  limitations: draft.limitations,
  takeAway: draft.takeAway,
  relations: draft.relations
    .filter((r) => allCards.some((c) => c.id === r.toId))
    .map((r) => ({
      toId: r.toId,
      type: r.type,
      note: r.note ?? '',
    })),
})

const cardToDraft = (card: PaperCard): PaperDraft => ({
  title: card.title,
  topics: card.topics,
  year: card.year,
  authors: card.authors,
  venue: card.venue,
  links: card.links ?? [],
  oneSentence: card.oneSentence,
  threeMethod: card.threeMethod,
  contributions: card.contributions,
  keyEvidence: card.keyEvidence,
  reproduciblePoints: card.reproduciblePoints,
  limitations: card.limitations,
  relations: card.relations,
  takeAway: card.takeAway,
})

const formToDraft = (form: FormState): PaperDraft => ({
  title: form.title.trim(),
  topics: normalizeTopics(form.topicsText),
  year: /^\d{4}$/.test(form.yearText.trim())
    ? Number(form.yearText.trim())
    : undefined,
  authors: form.authors.trim(),
  venue: form.venue.trim(),
  links: parseLinks(form.linksText),
  oneSentence: form.oneSentence.trim(),
  threeMethod: form.threeMethod.trim(),
  contributions: form.contributionsText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean),
  keyEvidence: form.keyEvidence.trim(),
  reproduciblePoints: form.reproduciblePoints.trim(),
  limitations: form.limitations.trim(),
  relations: form.relations
    .filter((r) => r.toId)
    .map(
      (r): PaperRelation => ({
        toId: r.toId,
        type: r.type,
        note: r.note.trim() ? r.note.trim() : undefined,
      })
    ),
  takeAway: form.takeAway.trim(),
})

function PaperCardDetail(props: {
  card: PaperCard
  byId: Map<string, PaperCard>
  onSelect: (id: string) => void
}) {
  const c = props.card
  const relations = c.relations
    .map((r) => ({ ...r, title: props.byId.get(r.toId)?.title ?? r.toId }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title))

  return (
    <div className="card">
      <div className="card-title">{c.title}</div>
      <div className="card-sub">
        {(c.year ? String(c.year) : '—') + ' · ' + (c.venue ?? '—') + ' · ' + (c.authors ?? '—')}
      </div>

      <div className="section">
        <div className="section-title">一句话</div>
        <div className="section-text">{c.oneSentence || '—'}</div>
      </div>
      <div className="section">
        <div className="section-title">三句话方法</div>
        <div className="section-text">{c.threeMethod || '—'}</div>
      </div>
      <div className="section">
        <div className="section-title">核心贡献</div>
        <ul className="section-list">
          {c.contributions.length ? c.contributions.map((x, i) => <li key={i}>{x}</li>) : <li>—</li>}
        </ul>
      </div>
      <div className="section">
        <div className="section-title">关键证据</div>
        <div className="section-text">{c.keyEvidence || '—'}</div>
      </div>
      <div className="section">
        <div className="section-title">可复核点</div>
        <div className="section-text">{c.reproduciblePoints || '—'}</div>
      </div>
      <div className="section">
        <div className="section-title">局限/坑</div>
        <div className="section-text">{c.limitations || '—'}</div>
      </div>
      <div className="section">
        <div className="section-title">给我用</div>
        <div className="section-text">{c.takeAway || '—'}</div>
      </div>
      <div className="section">
        <div className="section-title">关系</div>
        <div className="related-view">
          {relations.length ? (
            relations.map((r, i) => (
              <button
                key={`${r.toId}-${i}`}
                className="pill"
                title={r.note ? `${relationTypeLabel(r.type)}｜${r.note}` : relationTypeLabel(r.type)}
                onClick={() => props.onSelect(r.toId)}
              >
                {relationTypeLabel(r.type) + ' · ' + r.title}
              </button>
            ))
          ) : (
            <span className="muted">—</span>
          )}
        </div>
      </div>
      <div className="section">
        <div className="section-title">链接</div>
        <div className="related-view">
          {c.links?.length ? (
            c.links.map((l, i) => (
              <a key={i} className="pill" href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))
          ) : (
            <span className="muted">—</span>
          )}
        </div>
      </div>
    </div>
  )
}

const formatCardText = (card: PaperCard, byId: Map<string, PaperCard>) => {
  const lines: string[] = []
  lines.push(`标题：${card.title}`)
  lines.push(
    `年份：${card.year ? String(card.year) : '—'}｜会议：${card.venue ?? '—'}｜作者：${card.authors ?? '—'}`
  )
  lines.push(`方向：${card.topics.join(', ') || '—'}`)
  lines.push('')
  lines.push('一句话：')
  lines.push(card.oneSentence || '—')
  lines.push('')
  lines.push('三句话方法：')
  lines.push(card.threeMethod || '—')
  lines.push('')
  lines.push('核心贡献：')
  if (card.contributions.length) {
    for (const x of card.contributions) lines.push(`- ${x}`)
  } else {
    lines.push('—')
  }
  lines.push('')
  lines.push('关键证据：')
  lines.push(card.keyEvidence || '—')
  lines.push('')
  lines.push('可复核点：')
  lines.push(card.reproduciblePoints || '—')
  lines.push('')
  lines.push('局限/坑：')
  lines.push(card.limitations || '—')
  lines.push('')
  lines.push('给我用：')
  lines.push(card.takeAway || '—')
  lines.push('')
  lines.push('关系：')
  if (card.relations.length) {
    for (const r of card.relations) {
      const t = byId.get(r.toId)?.title ?? r.toId
      const label = relationTypeLabel(r.type)
      const note = r.note ? `（${r.note}）` : ''
      lines.push(`- ${label}：${t}${note}`)
    }
  } else {
    lines.push('—')
  }
  lines.push('')
  lines.push('链接：')
  if (card.links?.length) {
    for (const l of card.links) lines.push(`- ${l.label} ${l.url}`)
  } else {
    lines.push('—')
  }
  return lines.join('\n')
}

export function PaperPanel(props: {
  cards: PaperCard[]
  activeTopic: string
  selectedId: string | null
  selectedStackIds: string[]
  query: string
  onQueryChange: (q: string) => void
  onSelect: (id: string | null) => void
  onRemoveFromStack: (id: string) => void
  onClearStack: () => void
  onCreate: (draft: PaperDraft) => void
  onUpdate: (id: string, draft: PaperDraft) => void
  onDelete: (id: string) => void
}) {
  const [mode, setMode] = useState<Mode>('view')
  const [openStackIds, setOpenStackIds] = useState<Set<string>>(() => new Set())
  const selected = useMemo(
    () => props.cards.find((c) => c.id === props.selectedId) ?? null,
    [props.cards, props.selectedId]
  )

  const filtered = useMemo(() => {
    const base = props.cards.filter((c) => c.topics.includes(props.activeTopic))
    const q = props.query.trim().toLowerCase()
    if (!q) return base
    return base.filter((c) => {
      const inTitle = c.title.toLowerCase().includes(q)
      const inAuthors = (c.authors ?? '').toLowerCase().includes(q)
      const inVenue = (c.venue ?? '').toLowerCase().includes(q)
      return inTitle || inAuthors || inVenue
    })
  }, [props.cards, props.activeTopic, props.query])

  const [form, setForm] = useState<FormState>(() =>
    draftToForm(createEmptyDraft([props.activeTopic]), props.cards)
  )

  const startCreate = () => {
    setMode('create')
    const draft = createEmptyDraft([props.activeTopic])
    setForm(draftToForm(draft, props.cards))
    props.onSelect(null)
  }

  const startEdit = () => {
    if (!selected) return
    setMode('edit')
    setForm(draftToForm(cardToDraft(selected), props.cards))
  }

  const cancel = () => {
    setMode('view')
    if (selected) setForm(draftToForm(cardToDraft(selected), props.cards))
  }

  const save = () => {
    const draft = formToDraft(form)
    if (!draft.title) return

    if (mode === 'create') {
      props.onCreate(draft)
      setMode('view')
      return
    }

    if (mode === 'edit' && selected) {
      props.onUpdate(selected.id, draft)
      setMode('view')
    }
  }

  const deleteSelected = () => {
    if (!selected) return
    props.onDelete(selected.id)
    setMode('view')
  }

  const visibleCards = useMemo(() => {
    const byId = new Map(props.cards.map((c) => [c.id, c]))
    return { byId }
  }, [props.cards])

  const stackedForTopic = useMemo(() => {
    return props.selectedStackIds
      .map((id) => visibleCards.byId.get(id))
      .filter((c): c is PaperCard => Boolean(c))
      .filter((c) => c.topics.includes(props.activeTopic))
  }, [props.selectedStackIds, visibleCards.byId, props.activeTopic])

  const selectedText = useMemo(() => {
    if (!selected) return ''
    return formatCardText(selected, visibleCards.byId)
  }, [selected, visibleCards.byId])

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">论文卡片库</div>
        <div className="panel-actions">
          <button className="btn" onClick={startCreate}>
            新建
          </button>
          {selected && mode === 'view' ? (
            <button className="btn" onClick={startEdit}>
              编辑
            </button>
          ) : null}
          {selected && mode !== 'create' ? (
            <button className="btn danger" onClick={deleteSelected}>
              删除
            </button>
          ) : null}
        </div>
      </div>

      <div className="panel-search">
        <input
          value={props.query}
          onChange={(e) => props.onQueryChange(e.target.value)}
          placeholder="搜索标题 / 作者 / 会议"
        />
      </div>

      <div className="panel-body">
        <div className="list">
          {filtered.length ? (
            filtered.map((c) => (
              <button
                key={c.id}
                className={`list-item ${props.selectedId === c.id ? 'active' : ''}`}
                onClick={() => {
                  props.onSelect(c.id)
                  setMode('view')
                }}
              >
                <div className="list-title">{c.title}</div>
                <div className="list-meta">
                  {(c.year ? String(c.year) : '—') + ' · ' + (c.venue ?? '—')}
                </div>
              </button>
            ))
          ) : (
            <div className="empty">这个方向还没有卡片</div>
          )}
        </div>

        <div className="content">
          {mode === 'view' ? (
            <div className="stack">
              <div className="stack-header">
                <div className="stack-title">已选卡片（可叠加）</div>
                <div className="stack-actions">
                  <button className="btn ghost" onClick={props.onClearStack}>
                    清空
                  </button>
                </div>
              </div>

              {selected ? (
                <div className="detail-textbox">
                  <div className="detail-textbox-title">论文详情（文本）</div>
                  <textarea
                    className="detail-textarea"
                    readOnly
                    value={selectedText}
                    rows={10}
                  />
                </div>
              ) : null}

              {stackedForTopic.length ? (
                <div className="stack-list">
                  {stackedForTopic.map((c) => {
                    const open = openStackIds.has(c.id) || props.selectedId === c.id
                    return (
                      <details
                        key={c.id}
                        className={`stack-item ${props.selectedId === c.id ? 'active' : ''}`}
                        open={open}
                        onToggle={(e) => {
                          const el = e.currentTarget
                          setOpenStackIds((prev) => {
                            const next = new Set(prev)
                            if (el.open) next.add(c.id)
                            else next.delete(c.id)
                            return next
                          })
                        }}
                      >
                        <summary
                          className="stack-summary"
                          onClick={() => {
                            props.onSelect(c.id)
                            setMode('view')
                          }}
                        >
                          <div className="stack-summary-main">
                            <div className="stack-summary-title">{c.title}</div>
                            <div className="stack-summary-meta">
                              {(c.year ? String(c.year) : '—') + ' · ' + (c.venue ?? '—')}
                            </div>
                          </div>
                          <button
                            className="stack-remove"
                            onClick={(ev) => {
                              ev.preventDefault()
                              ev.stopPropagation()
                              props.onRemoveFromStack(c.id)
                            }}
                            type="button"
                          >
                            移除
                          </button>
                        </summary>
                        <div className="stack-body">
                          <PaperCardDetail
                            card={c}
                            byId={visibleCards.byId}
                            onSelect={(id) => props.onSelect(id)}
                          />
                        </div>
                      </details>
                    )
                  })}
                </div>
              ) : selected ? (
                <PaperCardDetail
                  card={selected}
                  byId={visibleCards.byId}
                  onSelect={(id) => props.onSelect(id)}
                />
              ) : (
                <div className="empty-hint">
                  <div>左边点一个节点，右侧会把卡片叠加起来。</div>
                </div>
              )}
            </div>
          ) : null}

          {mode !== 'view' ? (
            <div className="editor">
              <div className="editor-title">
                {mode === 'create' ? '新建卡片' : '编辑卡片'}
              </div>
              <div className="field">
                <div className="label">标题</div>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="grid2">
                <div className="field">
                  <div className="label">方向/主题（逗号分隔）</div>
                  <input
                    value={form.topicsText}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, topicsText: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <div className="label">年份</div>
                  <input
                    value={form.yearText}
                    onChange={(e) => setForm((p) => ({ ...p, yearText: e.target.value }))}
                    placeholder="2026"
                  />
                </div>
              </div>
              <div className="grid2">
                <div className="field">
                  <div className="label">作者</div>
                  <input
                    value={form.authors}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, authors: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <div className="label">会议/期刊</div>
                  <input
                    value={form.venue}
                    onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
                  />
                </div>
              </div>
              <div className="field">
                <div className="label">链接（每行：label url）</div>
                <textarea
                  rows={3}
                  value={form.linksText}
                  onChange={(e) => setForm((p) => ({ ...p, linksText: e.target.value }))}
                />
              </div>
              <div className="field">
                <div className="label">一句话</div>
                <textarea
                  rows={2}
                  value={form.oneSentence}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, oneSentence: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <div className="label">三句话方法</div>
                <textarea
                  rows={3}
                  value={form.threeMethod}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, threeMethod: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <div className="label">核心贡献（每行一条）</div>
                <textarea
                  rows={3}
                  value={form.contributionsText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contributionsText: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <div className="label">关键证据</div>
                <textarea
                  rows={3}
                  value={form.keyEvidence}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, keyEvidence: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <div className="label">可复核点</div>
                <textarea
                  rows={3}
                  value={form.reproduciblePoints}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reproduciblePoints: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <div className="label">局限/坑</div>
                <textarea
                  rows={3}
                  value={form.limitations}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, limitations: e.target.value }))
                  }
                />
              </div>
              <RelatedEditor
                cards={props.cards}
                excludedId={selected?.id}
                relations={form.relations}
                onChange={(next) => setForm((p) => ({ ...p, relations: next }))}
              />
              <div className="field">
                <div className="label">给我用</div>
                <textarea
                  rows={2}
                  value={form.takeAway}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, takeAway: e.target.value }))
                  }
                />
              </div>
              <div className="editor-actions">
                <button className="btn" onClick={save}>
                  保存
                </button>
                <button className="btn ghost" onClick={cancel}>
                  取消
                </button>
              </div>
            </div>
          ) : null}

          {mode === 'view' ? null : null}
        </div>
      </div>
    </div>
  )
}
