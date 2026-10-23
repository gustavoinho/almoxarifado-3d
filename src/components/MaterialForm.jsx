import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { uid } from '../uid'
import { buildIndex } from '../layout'

// Fileiras vazias (sem gaveta) não aparecem como opção de local
const shelvesWithDrawers = (b) => {
  const l = b.shelves.filter((s) => s.drawers.length > 0)
  return l.length ? l : b.shelves
}
const firstShelf = (b) => shelvesWithDrawers(b)[0]
const firstBlock = (c) => c.blocks.find((b) => b.shelves.some((s) => s.drawers.length > 0)) || c.blocks[0]
const locFor = (c, b = firstBlock(c), s = firstShelf(b)) => ({
  c: c.id,
  b: b.id,
  s: s.id,
  d: s.drawers[0]?.id || '',
})

export default function MaterialForm() {
  const { form, cabinets, materials, closeForm, addMaterial, updateMaterial, selectDrawer } = useStore()
  const idx = useMemo(() => buildIndex(cabinets), [cabinets])

  const base =
    form.mode === 'edit'
      ? form.material
      : { codigo: '', nome: '', descricao: '', categoria: '', fornecedor: '', quantidade: 0, observacoes: '', drawerId: form.preset || null }

  const [f, setF] = useState({ ...base })
  const [err, setErr] = useState('')

  const info = f.drawerId ? idx.get(f.drawerId) : null
  const [loc, setLoc] = useState(
    info ? { c: info.cab.id, b: info.blk.id, s: info.sh.id, d: info.dr.id } : locFor(cabinets[0])
  )

  const cab = cabinets.find((c) => c.id === loc.c) || cabinets[0]
  const blk = cab.blocks.find((b) => b.id === loc.b) || firstBlock(cab)
  const sh = blk.shelves.find((s) => s.id === loc.s) || firstShelf(blk)

  const setC = (id) => setLoc(locFor(cabinets.find((x) => x.id === id)))
  const setB = (id) => setLoc(locFor(cab, cab.blocks.find((x) => x.id === id)))
  const setS = (id) => setLoc(locFor(cab, blk, blk.shelves.find((x) => x.id === id)))

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const save = (e) => {
    e.preventDefault()
    if (!f.nome.trim()) return setErr('Informe o nome do material.')
    const code = f.codigo.trim()
    const dup = code && materials.find((m) => m.codigo?.trim() === code && m.id !== f.id)
    if (dup) return setErr(`Já existe o código ${code} (${dup.nome}).`)
    const data = { ...f, nome: f.nome.trim(), codigo: code, quantidade: Number(f.quantidade) || 0, drawerId: loc.d || null }
    if (form.mode === 'edit') updateMaterial(f.id, data)
    else addMaterial({ ...data, id: uid() })
    selectDrawer(loc.d)
    closeForm()
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) closeForm() }}>
      <form className="modal" onSubmit={save}>
        <h2>{form.mode === 'edit' ? 'Editar material' : 'Novo material'}</h2>
        <div className="grid2">
          <label>Nome *<input value={f.nome} onChange={set('nome')} autoFocus /></label>
          <label>Código<input value={f.codigo} onChange={set('codigo')} /></label>
          <label>Categoria<input value={f.categoria} onChange={set('categoria')} /></label>
          <label>Fornecedor<input value={f.fornecedor} onChange={set('fornecedor')} /></label>
          <label>Quantidade<input type="number" min="0" value={f.quantidade} onChange={set('quantidade')} /></label>
          <label>Descrição<input value={f.descricao} onChange={set('descricao')} /></label>
        </div>
        <label>Observações<textarea rows="2" value={f.observacoes} onChange={set('observacoes')} /></label>

        <h3>Localização</h3>
        <div className="grid2">
          <label>Armário
            <select value={cab.id} onChange={(e) => setC(e.target.value)}>
              {cabinets.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Bloco
            <select value={blk.id} onChange={(e) => setB(e.target.value)}>
              {cab.blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label>Fileira
            <select value={sh.id} onChange={(e) => setS(e.target.value)}>
              {shelvesWithDrawers(blk).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>Gaveta
            <select value={loc.d} onChange={(e) => setLoc({ ...loc, d: e.target.value })}>
              {sh.drawers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
        </div>

        {err && <div className="err">{err}</div>}
        <div className="modal-actions">
          <button type="button" onClick={closeForm}>Cancelar</button>
          <button type="submit" className="primary">Salvar</button>
        </div>
      </form>
    </div>
  )
}
