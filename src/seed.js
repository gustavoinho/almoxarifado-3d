import { uid } from './uid'

const drawers = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: uid(), name: `Gaveta ${i + 1}` }))

// Cada bloco tem 4 fileiras:
// 1 = vão vazio no topo | 2 = 30 gavetas (5 linhas x 6 colunas) | 3 e 4 = vãos vazios
const blockShelves = () => [
  { id: uid(), name: 'Fileira 1', drawers: [] },
  { id: uid(), name: 'Fileira 2', drawers: drawers(30) },
  { id: uid(), name: 'Fileira 3', drawers: [] },
  { id: uid(), name: 'Fileira 4', drawers: [] },
]

const blocks = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: uid(),
    name: `Bloco ${i + 1}`,
    shelves: blockShelves(),
  }))

export function createSeed() {
  const cabinets = [
    { id: uid(), name: 'Armário 1 · Gaveteiros', blocks: blocks(6) },
  ]

  // d(bloco, gaveta) -> id da gaveta (fileira 2 de cada bloco)
  const d = (b, k) => cabinets[0].blocks[b].shelves[1].drawers[k].id

  const materials = [
    { id: uid(), codigo: 'EX-001', nome: 'Disco de serra (exemplo)', descricao: '', categoria: 'Ferramentas', fornecedor: 'Ferramentas Gerais', quantidade: 12, observacoes: 'Material de exemplo, pode apagar', drawerId: d(0, 0) },
    { id: uid(), codigo: 'EX-002', nome: 'Luva de vaqueta (exemplo)', descricao: '', categoria: 'EPI', fornecedor: '', quantidade: 30, observacoes: 'Material de exemplo, pode apagar', drawerId: d(1, 5) },
    { id: uid(), codigo: 'EX-003', nome: 'Fibra verde (exemplo)', descricao: '', categoria: 'Limpeza', fornecedor: '', quantidade: 50, observacoes: 'Material de exemplo, pode apagar', drawerId: d(2, 11) },
  ]
  return { cabinets, materials }
}
