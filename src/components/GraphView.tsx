import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { PaperCard, RelationType } from '../papers/types'

type GraphNode = {
  id: string
  name: string
  topics: string[]
}

type GraphLink = {
  source: string
  target: string
  type: RelationType
}

const hashToColor = (input: string) => {
  let hash = 0
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) | 0
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 70% 55%)`
}

const randomOnSphere = (radius: number) => {
  const u = Math.random()
  const v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi) * Math.sin(theta)
  const z = radius * Math.cos(phi)
  return { x, y, z }
}

export function GraphView(props: {
  cards: PaperCard[]
  activeTopic: string
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(
    undefined
  )
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [callout, setCallout] = useState<{
    x: number
    y: number
    title: string
    oneSentence: string
  } | null>(null)

  const graphData = useMemo(() => {
    const filtered = props.cards.filter((c) => c.topics.includes(props.activeTopic))
    const idSet = new Set(filtered.map((c) => c.id))

    const nodes: Array<GraphNode & { x?: number; y?: number; z?: number }> = filtered.map(
      (c) => {
        const pos = randomOnSphere(120)
        return { id: c.id, name: c.title, topics: c.topics, ...pos }
      }
    )

    const links: GraphLink[] = []
    for (const c of filtered) {
      for (const rel of c.relations) {
        if (idSet.has(rel.toId))
          links.push({ source: c.id, target: rel.toId, type: rel.type })
      }
    }

    return { nodes, links }
  }, [props.cards, props.activeTopic])

  useEffect(() => {
    let raf = 0

    const tick = () => {
      const selectedId = props.selectedId
      const fg = fgRef.current
      const wrap = wrapRef.current

      if (!selectedId || !fg || !wrap) {
        if (callout !== null) setCallout(null)
        raf = requestAnimationFrame(tick)
        return
      }

      const node = graphData.nodes.find((n) => (n as GraphNode).id === selectedId) as
        | (GraphNode & { x?: number; y?: number; z?: number })
        | undefined

      const card = props.cards.find((c) => c.id === selectedId)

      if (!node || !card || node.x == null || node.y == null || node.z == null) {
        if (callout !== null) setCallout(null)
        raf = requestAnimationFrame(tick)
        return
      }

      const screen = fg.graph2ScreenCoords(node.x, node.y, node.z)
      const rect = wrap.getBoundingClientRect()
      const padding = 8
      const x = Math.max(padding, Math.min(rect.width - padding, screen.x))
      const y = Math.max(padding, Math.min(rect.height - padding, screen.y))

      setCallout((prev) => {
        if (
          prev &&
          Math.abs(prev.x - x) < 0.5 &&
          Math.abs(prev.y - y) < 0.5 &&
          prev.title === card.title &&
          prev.oneSentence === card.oneSentence
        ) {
          return prev
        }
        return {
          x,
          y,
          title: card.title,
          oneSentence: card.oneSentence,
        }
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedId, props.cards, graphData, props.activeTopic])

  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return

    const scene = fg.scene()
    scene.background = new THREE.Color('#0b1020')

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(130, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x4b6cb7,
        transparent: true,
        opacity: 0.08,
        wireframe: true,
      })
    )
    sphere.name = 'globe-sphere'
    scene.add(sphere)

    const controls = fg.controls() as unknown as OrbitControls
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.25

    fg.cameraPosition({ z: 320 })

    return () => {
      const existing = scene.getObjectByName('globe-sphere')
      if (existing) scene.remove(existing)
    }
  }, [props.activeTopic])

  const relationColor = (t: RelationType) => {
    switch (t) {
      case 'combine':
        return 'rgba(34,197,94,0.45)'
      case 'improve':
        return 'rgba(249,115,22,0.55)'
      case 'compare':
        return 'rgba(59,130,246,0.55)'
      case 'baseline':
        return 'rgba(148,163,184,0.55)'
      case 'extend':
        return 'rgba(168,85,247,0.55)'
      case 'cite':
        return 'rgba(236,72,153,0.55)'
      case 'related':
      default:
        return 'rgba(255,255,255,0.25)'
    }
  }

  return (
    <div
      ref={wrapRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel={(n) => (n as GraphNode).name}
        nodeColor={(n) => {
          const node = n as GraphNode
          const base = node.topics[0] ?? props.activeTopic
          return node.id === props.selectedId ? '#ffffff' : hashToColor(base)
        }}
        linkColor={(l) => relationColor((l as GraphLink).type)}
        linkWidth={(l) => {
          const link = l as GraphLink
          return link.source === props.selectedId || link.target === props.selectedId ? 2 : 1
        }}
        linkDirectionalArrowLength={(l) => {
          const t = (l as GraphLink).type
          return t === 'improve' || t === 'extend' || t === 'cite' ? 6 : 0
        }}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(n) => props.onSelect((n as GraphNode).id)}
        onBackgroundClick={() => props.onSelect(null)}
        enableNodeDrag
        d3VelocityDecay={0.35}
      />
      {callout ? (
        <div
          className="node-callout"
          style={{
            left: callout.x,
            top: callout.y,
          }}
        >
          <div className="node-callout-title">{callout.title}</div>
          <div className="node-callout-body">{callout.oneSentence || '—'}</div>
        </div>
      ) : null}
    </div>
  )
}
