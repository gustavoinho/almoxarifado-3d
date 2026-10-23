import { useStore } from '../store'
import { indexPath } from '../layout'

const panel = {
  background: 'rgba(18,40,56,0.88)',
  border: '1px solid rgba(43,212,245,0.55)',
  borderRadius: 8,
  boxShadow: '0 0 14px rgba(43,212,245,0.25)',
  color: '#fff',
  fontFamily: 'inherit',
}

const Row = ({ icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
    <span style={{ width: 22, textAlign: 'center', fontSize: 18 }}>{icon}</span>
    <span style={{ fontSize: 14 }}>{children}</span>
  </div>
)

// Legenda de controles (canto inferior esquerdo) e cartão da gaveta selecionada (canto inferior direito)
export default function SceneOverlay() {
  const cabinets = useStore((s) => s.cabinets)
  const materials = useStore((s) => s.materials)
  const sel = useStore((s) => s.sel)

  const p = indexPath(cabinets, sel)
  const blk = cabinets[p.ci]?.blocks[p.bi]
  const dr = blk?.shelves[p.si]?.drawers[p.di]
  const n = dr ? materials.filter((m) => m.drawerId === dr.id).length : 0

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ ...panel, position: 'absolute', left: 16, bottom: 16, padding: '8px 22px 8px 16px' }}>
        <Row icon="🖱️">Clique para selecionar</Row>
        <Row icon="⚙️">Roda do mouse para zoom</Row>
        <Row icon="✋">Arraste para rotacionar</Row>
      </div>

      {dr && (
        <div style={{ ...panel, position: 'absolute', right: 16, bottom: 16, padding: '12px 22px', minWidth: 190 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{dr.name}</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{blk.name} · Gaveteiro</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 2 }}>
            {n} {n === 1 ? 'item' : 'itens'}
          </div>
        </div>
      )}
    </div>
  )
}
