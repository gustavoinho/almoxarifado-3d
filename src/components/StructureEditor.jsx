import { useStore } from '../store'
import { uid } from '../uid'

const newDrawer = (n) => ({ id: uid(), name: `Gaveta ${n}` })
const newShelf = (n, drawers = 0) => ({
  id: uid(),
  name: `Fileira ${n}`,
  drawers: Array.from({ length: drawers }, (_, i) => newDrawer(i + 1)),
})
// Bloco novo = mesmo padrão dos demais: vazia, 30 gavetas, vazia, vazia
const newBlock = (n) => ({
  id: uid(),
  name: `Bloco ${n}`,
  shelves: [newShelf(1), newShelf(2, 30), newShelf(3), newShelf(4)],
})

export default function StructureEditor() {
  const { cabinets, materials, updateCabinets: update, setStructureOpen } = useStore()
  const close = () => setStructureOpen(false)

  const confirmRemove = (ids) => {
    const n = materials.filter((m) => ids.includes(m.drawerId)).length
    return n === 0 || confirm(`${n} material(is) ficarão sem localização. Continuar?`)
  }
  const idsOfBlock = (b) => b.shelves.flatMap((s) => s.drawers.map((d) => d.id))
  const idsOfShelf = (s) => s.drawers.map((d) => d.id)

  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="modal wide">
        <h2>Estrutura do almoxarifado</h2>
        <p className="meta">
          Cada bloco tem fileiras: as sem gavetas aparecem como vãos vazios e a fileira com gavetas
          mostra 6 colunas. Renomeie, adicione ou remova conforme o local real. As alterações valem na hora.
        </p>

        {cabinets.map((c, ci) => (
          <section className="st-cab" key={c.id}>
            <div className="row">
              <input className="grow" value={c.name} onChange={(e) => update((cs) => { cs[ci].name = e.target.value })} />
              <button onClick={() => update((cs) => cs[ci].blocks.push(newBlock(cs[ci].blocks.length + 1)))}>+ Bloco</button>
            </div>

            {c.blocks.map((b, bi) => (
              <div className="st-block" key={b.id}>
                <div className="row">
                  <input className="grow" value={b.name} onChange={(e) => update((cs) => { cs[ci].blocks[bi].name = e.target.value })} />
                  <button onClick={() => update((cs) => cs[ci].blocks[bi].shelves.push(newShelf(cs[ci].blocks[bi].shelves.length + 1)))}>+ Fileira</button>
                  <button
                    disabled={c.blocks.length === 1}
                    onClick={() => { if (confirmRemove(idsOfBlock(b))) update((cs) => cs[ci].blocks.splice(bi, 1)) }}
                  >Remover</button>
                </div>

                {b.shelves.map((s, si) => (
                  <div className="st-shelf" key={s.id}>
                    <div className="row">
                      <input className="grow" value={s.name} onChange={(e) => update((cs) => { cs[ci].blocks[bi].shelves[si].name = e.target.value })} />
                      <small>{s.drawers.length === 0 ? 'vazia' : `${s.drawers.length} gavetas`}</small>
                      <button onClick={() => update((cs) => cs[ci].blocks[bi].shelves[si].drawers.push(newDrawer(cs[ci].blocks[bi].shelves[si].drawers.length + 1)))}>+ Gaveta</button>
                      <button
                        disabled={b.shelves.length === 1}
                        onClick={() => { if (confirmRemove(idsOfShelf(s))) update((cs) => cs[ci].blocks[bi].shelves.splice(si, 1)) }}
                      >Remover</button>
                    </div>
                    <div className="chips">
                      {s.drawers.map((d, di) => (
                        <span className="chip" key={d.id}>
                          <input value={d.name} onChange={(e) => update((cs) => { cs[ci].blocks[bi].shelves[si].drawers[di].name = e.target.value })} />
                          <button
                            onClick={() => { if (confirmRemove([d.id])) update((cs) => cs[ci].blocks[bi].shelves[si].drawers.splice(di, 1)) }}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        ))}

        <div className="modal-actions">
          <button className="primary" onClick={close}>Concluir</button>
        </div>
      </div>
    </div>
  )
}
