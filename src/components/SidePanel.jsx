import { useMemo } from 'react'
import { useStore } from '../store'
import { buildIndex, indexPath } from '../layout'

function MatCard({ m, loc, showLoc }) {
  const openForm = useStore((s) => s.openForm)
  const updateMaterial = useStore((s) => s.updateMaterial)
  const removeMaterial = useStore((s) => s.removeMaterial)
  const setQty = (q) => updateMaterial(m.id, { quantidade: Math.max(0, q) })
  return (
    <div className="mat">
      <div className="mat-head">
        <b>{m.nome}</b>
        {m.codigo && <span className="code">{m.codigo}</span>}
      </div>
      <div className="meta">
        {[m.categoria, m.fornecedor].filter(Boolean).join(' · ')}
        {showLoc && <div>{loc ? `${loc.blk.name} · ${loc.dr.name} (${loc.code})` : 'Sem localização'}</div>}
        {m.observacoes && <div>{m.observacoes}</div>}
      </div>
      <div className="mat-actions">
        <div className="qty">
          <button onClick={() => setQty((m.quantidade || 0) - 1)}>−</button>
          <span>{m.quantidade}</span>
          <button onClick={() => setQty((m.quantidade || 0) + 1)}>+</button>
        </div>
        <button onClick={() => openForm({ mode: 'edit', material: m })}>Editar</button>
        <button onClick={() => { if (confirm(`Remover "${m.nome}"?`)) removeMaterial(m.id) }}>Remover</button>
      </div>
    </div>
  )
}

// Primeira gaveta de um bloco (ignora fileiras vazias)
const firstDrawer = (b) => b?.shelves.find((s) => s.drawers.length > 0)?.drawers[0]?.id

export default function SidePanel() {
  const cabinets = useStore((s) => s.cabinets)
  const materials = useStore((s) => s.materials)
  const sel = useStore((s) => s.sel)
  const select = useStore((s) => s.select)
  const clearSel = useStore((s) => s.clearSel)
  const openForm = useStore((s) => s.openForm)

  const idx = useMemo(() => buildIndex(cabinets), [cabinets])
  const counts = useMemo(() => {
    const c = {}
    materials.forEach((m) => { if (m.drawerId) c[m.drawerId] = (c[m.drawerId] || 0) + 1 })
    return c
  }, [materials])

  const p = indexPath(cabinets, sel)
  const cab = cabinets[p.ci]
  const blk = cab?.blocks[p.bi]
  const sh = blk?.shelves[p.si]
  const dr = sh?.drawers[p.di]
  const level = dr ? 'drawer' : sh ? 'shelf' : blk ? 'block' : cab ? 'cabinet' : 'root'

  const dcount = (d) => counts[d.id] || 0
  const shCount = (s) => s.drawers.reduce((a, d) => a + dcount(d), 0)
  const bCount = (b) => b.shelves.reduce((a, s) => a + shCount(s), 0)
  const cCount = (c) => c.blocks.reduce((a, b) => a + bCount(b), 0)

  const scoped = useMemo(
    () =>
      materials.filter((m) => {
        const i = idx.get(m.drawerId)
        if (level === 'root') return !i
        if (!i || i.cab.id !== cab.id) return false
        if (blk && i.blk.id !== blk.id) return false
        if (sh && i.sh.id !== sh.id) return false
        if (dr && i.dr.id !== dr.id) return false
        return true
      }),
    [materials, idx, level, cab, blk, sh, dr]
  )

  let kids = []
  let kidsTitle = ''
  if (level === 'root') {
    kidsTitle = 'Armários'
    kids = cabinets.map((c) => ({ id: c.id, name: c.name, n: cCount(c), go: () => select({ cabinetId: c.id }) }))
  } else if (level === 'cabinet') {
    kidsTitle = 'Blocos'
    kids = cab.blocks.map((b) => ({ id: b.id, name: b.name, n: bCount(b), go: () => select({ cabinetId: cab.id, blockId: b.id }) }))
  } else if (level === 'block') {
    // Mostra direto as gavetas do bloco (1 a 30); as fileiras vazias não aparecem
    kidsTitle = 'Gavetas'
    kids = blk.shelves.flatMap((s) =>
      s.drawers.map((d) => ({
        id: d.id,
        name: d.name,
        n: dcount(d),
        go: () => select({ cabinetId: cab.id, blockId: blk.id, shelfId: s.id, drawerId: d.id }),
      }))
    )
  } else if (level === 'shelf') {
    kidsTitle = 'Gavetas'
    kids = sh.drawers.map((d) => ({ id: d.id, name: d.name, n: dcount(d), go: () => select({ cabinetId: cab.id, blockId: blk.id, shelfId: sh.id, drawerId: d.id }) }))
  }

  const crumbs = [
    ['Visão geral', clearSel],
    cab && [cab.name, () => select({ cabinetId: cab.id })],
    blk && [blk.name, () => select({ cabinetId: cab.id, blockId: blk.id })],
    level === 'shelf' && [sh.name, () => select({ cabinetId: cab.id, blockId: blk.id, shelfId: sh.id })],
    dr && [dr.name, () => select({ cabinetId: cab.id, blockId: blk.id, shelfId: sh.id, drawerId: dr.id })],
  ].filter(Boolean)

  const presetDrawer =
    dr?.id ?? sh?.drawers[0]?.id ?? firstDrawer(blk) ?? cab?.blocks.map(firstDrawer).find(Boolean)

  const title = dr?.name ?? sh?.name ?? blk?.name ?? cab?.name ?? 'Almoxarifado'
  const code = dr ? idx.get(dr.id)?.code : null

  return (
    <aside className="side">
      <div className="crumbs">
        {crumbs.map(([label, fn], i) => (
          <button key={i} onClick={fn}>{label}</button>
        ))}
      </div>

      <h2>{title} {code && <span className="code">{code}</span>}</h2>

      {kids.length > 0 && (
        <>
          <h3>{kidsTitle}</h3>
          <div className="kids">
            {kids.map((k) => (
              <button key={k.id} onClick={k.go}>
                {k.name}<small>{k.n} {k.n === 1 ? 'material' : 'materiais'}</small>
              </button>
            ))}
          </div>
        </>
      )}

      <h3>
        {level === 'root' ? 'Sem localização' : 'Materiais neste local'} ({scoped.length})
      </h3>
      {level !== 'root' && (
        <button className="primary full" onClick={() => openForm({ mode: 'new', preset: presetDrawer })}>
          + Adicionar material aqui
        </button>
      )}
      {scoped.length === 0 && <div className="empty">Nenhum material.</div>}
      {scoped.map((m) => (
        <MatCard key={m.id} m={m} loc={idx.get(m.drawerId)} showLoc={level !== 'drawer'} />
      ))}
    </aside>
  )
}
