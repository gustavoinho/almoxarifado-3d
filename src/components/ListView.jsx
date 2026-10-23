import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { buildIndex, norm, fmtDate } from '../layout'

export default function ListView() {
  const { cabinets, materials, openForm, removeMaterial, selectDrawer } = useStore()
  const [q, setQ] = useState('')
  const idx = useMemo(() => buildIndex(cabinets), [cabinets])

  const rows = useMemo(() => {
    const nq = norm(q.trim())
    return materials
      .map((m) => ({ m, loc: idx.get(m.drawerId) }))
      .filter(({ m, loc }) =>
        !nq ||
        norm([m.nome, m.codigo, m.descricao, m.categoria, m.fornecedor, loc?.label, loc?.code].join(' ')).includes(nq)
      )
      .sort((a, b) => a.m.nome.localeCompare(b.m.nome))
  }, [q, materials, idx])

  return (
    <div className="listview">
      <div className="list-tools">
        <input placeholder="Filtrar a lista..." value={q} onChange={(e) => setQ(e.target.value)} />
        <span>{rows.length} material(is)</span>
      </div>
      <table>
        <thead>
          <tr><th>Código</th><th>Material</th><th>Categoria</th><th>Qtd</th><th>Local</th><th>Atualizado em</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map(({ m, loc }) => (
            <tr key={m.id}>
              <td>{m.codigo}</td>
              <td><b>{m.nome}</b><div className="meta">{m.fornecedor}</div></td>
              <td>{m.categoria}</td>
              <td>{m.quantidade}</td>
              <td>{loc ? <>{loc.label}<div className="meta">{loc.code}</div></> : 'Sem localização'}</td>
              <td>{fmtDate(m.atualizadoEm) || '—'}</td>
              <td className="acts">
                {loc && <button onClick={() => selectDrawer(m.drawerId, true)}>Ver no 3D</button>}
                <button onClick={() => openForm({ mode: 'edit', material: m })}>Editar</button>
                <button onClick={() => { if (confirm(`Remover "${m.nome}"?`)) removeMaterial(m.id) }}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
