// ---------- Medidas (unidades do three.js) ----------
export const COLS = 6            // colunas de gavetas por bloco
export const BLOCK_W = 1.65      // largura fixa de cada bloco
export const CAB_H = 3.1
export const CAB_D = 0.9
export const FRAME = 0.09        // espessura lateral útil de cada bloco
const GAP = 1.5                  // espaço entre armários (se houver mais de um)

// Alturas relativas das fileiras (são normalizadas para caber em CAB_H)
const ROW_H = 0.34               // altura de uma linha de gavetas
const TOP_H = 0.5                // fileira vazia do topo
const EMPTY_H = 0.45             // fileiras vazias da base

export const norm = (s = '') =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const cabW = (cab) => cab.blocks.length * BLOCK_W

// Posição X do centro do armário i (armários ficam lado a lado, centralizados)
export function cabX(cabinets, i) {
  const total =
    cabinets.reduce((a, c) => a + cabW(c), 0) + GAP * (cabinets.length - 1)
  let x = -total / 2
  for (let k = 0; k < i; k++) x += cabW(cabinets[k]) + GAP
  return x + cabW(cabinets[i]) / 2
}

// Posição vertical de cada fileira (shelf) de um bloco.
// Fileira com gavetas = linhas de 6; fileira sem gavetas = vão vazio.
export function shelfLayout(blk) {
  const raw = blk.shelves.map((sh, si) =>
    sh.drawers.length > 0
      ? Math.ceil(sh.drawers.length / COLS) * ROW_H
      : si === 0
        ? TOP_H
        : EMPTY_H
  )
  const total = raw.reduce((a, b) => a + b, 0) || 1
  const k = CAB_H / total
  let top = CAB_H
  return blk.shelves.map((sh, si) => {
    const h = raw[si] * k
    const item = { top, h, rows: Math.max(1, Math.ceil(sh.drawers.length / COLS)) }
    top -= h
    return item
  })
}

// Caixa 3D (centro e tamanho) de um armário, bloco, fileira ou gaveta
export function boxFor(cabinets, ci, bi = -1, si = -1, di = -1) {
  const cab = cabinets[ci]
  let x = cabX(cabinets, ci)
  let y = CAB_H / 2
  let w = cabW(cab)
  let h = CAB_H

  if (bi >= 0) {
    x = x - w / 2 + BLOCK_W * (bi + 0.5)
    w = BLOCK_W
    const blk = cab.blocks[bi]

    if (si >= 0) {
      const L = shelfLayout(blk)[si]
      y = L.top - L.h / 2
      h = L.h

      if (di >= 0) {
        const dw = (BLOCK_W - 2 * FRAME) / COLS
        const rowH = L.h / L.rows
        const row = Math.floor(di / COLS)
        const col = di % COLS
        x = x - BLOCK_W / 2 + FRAME + dw * (col + 0.5)
        y = L.top - rowH * (row + 0.5)
        w = dw
        h = rowH
      }
    }
  }
  return { center: [x, y, 0], size: [w, h, CAB_D] }
}

// Converte os ids da seleção em índices
export function indexPath(cabinets, sel) {
  const r = { ci: -1, bi: -1, si: -1, di: -1 }
  if (!sel?.cabinetId) return r
  r.ci = cabinets.findIndex((c) => c.id === sel.cabinetId)
  if (r.ci < 0 || !sel.blockId) return r
  const cab = cabinets[r.ci]
  r.bi = cab.blocks.findIndex((b) => b.id === sel.blockId)
  if (r.bi < 0 || !sel.shelfId) return r
  const blk = cab.blocks[r.bi]
  r.si = blk.shelves.findIndex((s) => s.id === sel.shelfId)
  if (r.si < 0 || !sel.drawerId) return r
  r.di = blk.shelves[r.si].drawers.findIndex((d) => d.id === sel.drawerId)
  return r
}

// Mapa drawerId -> localização completa (nomes e código tipo A1-B2-P3-G1)
export function buildIndex(cabinets) {
  const map = new Map()
  cabinets.forEach((cab, ci) =>
    cab.blocks.forEach((blk, bi) =>
      blk.shelves.forEach((sh, si) =>
        sh.drawers.forEach((dr, di) => {
          map.set(dr.id, {
            cab, blk, sh, dr, ci, bi, si, di,
            code: `A${ci + 1}-B${bi + 1}-P${si + 1}-G${di + 1}`,
            label: `${cab.name} › ${blk.name} › ${sh.name} › ${dr.name}`,
          })
        })
      )
    )
  )
  return map
}

export const findDrawer = (cabinets, id) => buildIndex(cabinets).get(id) || null

// Formata data/hora ISO para o padrão brasileiro: 23/10/2026 14:35
export const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''
