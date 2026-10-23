import { useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { buildIndex, norm, fmtDate } from '../layout'

const hay = (m, loc, field) => {
  if (field === 'nome') return [m.nome, m.descricao]
  if (field === 'codigo') return [m.codigo]
  if (field === 'local') return [loc?.label, loc?.code]
  return [m.nome, m.descricao, m.codigo, m.categoria, m.fornecedor, loc?.label, loc?.code]
}

export default function TopBar() {
  const { cabinets, materials, view, ultimaAlteracao, setView, clearSel, selectDrawer, openForm, setStructureOpen, exportData, importData } = useStore()
  const [q, setQ] = useState('')
  const [field, setField] = useState('tudo')
  const fileRef = useRef()
  const idx = useMemo(() => buildIndex(cabinets), [cabinets])

  const results = useMemo(() => {
    const nq = norm(q.trim())
    if (!nq) return []
    return materials
      .map((m) => ({ m, loc: m.drawerId ? idx.get(m.drawerId) : null }))
      .filter(({ m, loc }) => norm(hay(m, loc, field).join(' ')).includes(nq))
      .slice(0, 8)
  }, [q, field, materials, idx])

  const go = (r) => {
    if (r.loc) selectDrawer(r.m.drawerId, true)
    else openForm({ mode: 'edit', material: r.m })
    setQ('')
  }

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((t) => {
      if (!importData(t)) alert('Arquivo de backup inválido.')
    })
    e.target.value = ''
  }

  return (
    <header className="topbar">
      <div className="brand">Almoxarifado 3D</div>

      <div className="search">
        <input
          id="search"
          placeholder="Pesquisar material, código ou local   ( / )"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) go(results[0]) }}
        />
        <select value={field} onChange={(e) => setField(e.target.value)}>
          <option value="tudo">Tudo</option>
          <option value="nome">Nome</option>
          <option value="codigo">Código</option>
          <option value="local">Local</option>
        </select>
        {q.trim() && (
          <div className="results">
            {results.length === 0 && <div className="empty">Nada encontrado</div>}
            {results.map((r) => (
              <button key={r.m.id} onClick={() => go(r)}>
                <b>{r.m.codigo ? `${r.m.codigo} · ` : ''}{r.m.nome}</b>
                <small>{r.loc ? `${r.loc.label}  (${r.loc.code})` : 'Sem localização'} · Qtd: {r.m.quantidade}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="meta" style={{ whiteSpace: 'nowrap', fontSize: 12 }} title="Data e hora da última edição ou adição">
        Última alteração: {ultimaAlteracao ? fmtDate(ultimaAlteracao) : '—'}
      </span>

      <button onClick={clearSel}>Visão geral</button>
      <div className="seg">
        <button className={view === '3d' ? 'on' : ''} onClick={() => setView('3d')}>Holograma</button>
        <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>Lista</button>
      </div>
      <button className="primary" onClick={() => openForm({ mode: 'new' })}>+ Material</button>
      <button onClick={() => setStructureOpen(true)}>Estrutura</button>
      <button onClick={exportData} title="Baixar backup dos dados">Exportar</button>
      <button onClick={() => fileRef.current.click()} title="Restaurar backup">Importar</button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
    </header>
  )
}
