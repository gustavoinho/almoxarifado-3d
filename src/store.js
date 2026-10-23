import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSeed } from './seed'
import { findDrawer } from './layout'

const now = () => new Date().toISOString()

const validDrawerIds = (cabs) =>
  new Set(cabs.flatMap((c) => c.blocks.flatMap((b) => b.shelves.flatMap((s) => s.drawers.map((d) => d.id)))))

export const useStore = create(
  persist(
    (set, get) => ({
      ...createSeed(),
      sel: null,            // { cabinetId, blockId, shelfId, drawerId }
      view: '3d',           // '3d' | 'list'
      form: null,           // { mode: 'new' | 'edit', material?, preset? }
      structureOpen: false,
      ultimaAlteracao: null, // ISO da última edição/adição/remoção

      select: (sel) => set({ sel }),
      clearSel: () => set({ sel: null }),
      selectDrawer: (drawerId, switchTo3d = false) => {
        const f = findDrawer(get().cabinets, drawerId)
        if (!f) return
        set({
          sel: { cabinetId: f.cab.id, blockId: f.blk.id, shelfId: f.sh.id, drawerId },
          ...(switchTo3d ? { view: '3d' } : {}),
        })
      },
      setView: (view) => set({ view }),
      openForm: (form) => set({ form }),
      closeForm: () => set({ form: null }),
      setStructureOpen: (v) => set({ structureOpen: v }),

      addMaterial: (m) =>
        set((s) => {
          const t = now()
          return {
            materials: [...s.materials, { ...m, criadoEm: t, atualizadoEm: t }],
            ultimaAlteracao: t,
          }
        }),
      updateMaterial: (id, patch) =>
        set((s) => {
          const t = now()
          return {
            materials: s.materials.map((m) =>
              m.id === id ? { ...m, ...patch, atualizadoEm: t } : m
            ),
            ultimaAlteracao: t,
          }
        }),
      removeMaterial: (id) =>
        set((s) => ({
          materials: s.materials.filter((m) => m.id !== id),
          ultimaAlteracao: now(),
        })),

      // Edita a estrutura; materiais de gavetas removidas ficam "sem localização"
      updateCabinets: (fn) =>
        set((s) => {
          const cabinets = structuredClone(s.cabinets)
          fn(cabinets)
          const ok = validDrawerIds(cabinets)
          return {
            cabinets,
            materials: s.materials.map((m) =>
              m.drawerId && !ok.has(m.drawerId) ? { ...m, drawerId: null } : m
            ),
            ultimaAlteracao: now(),
          }
        }),

      exportData: () => {
        const { cabinets, materials } = get()
        const blob = new Blob([JSON.stringify({ cabinets, materials }, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `almoxarifado-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(a.href)
      },
      importData: (text) => {
        try {
          const d = JSON.parse(text)
          if (!Array.isArray(d.cabinets) || !Array.isArray(d.materials)) throw new Error()
          set({ cabinets: d.cabinets, materials: d.materials, sel: null, ultimaAlteracao: now() })
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'almoxarifado-3d-v1',
      version: 2,
      // Dados salvos da versão antiga: troca a estrutura pela nova (6 blocos x 30 gavetas)
      // e mantém os materiais, que ficam "sem localização" até você reposicioná-los.
      migrate: (persisted) => ({
        cabinets: createSeed().cabinets,
        materials: (persisted?.materials || []).map((m) => ({ ...m, drawerId: null })),
      }),
      partialize: (s) => ({ cabinets: s.cabinets, materials: s.materials, ultimaAlteracao: s.ultimaAlteracao }),
    }
  )
)
