import { useEffect } from 'react'
import { useStore } from './store'
import Scene from './components/Scene'
import SceneOverlay from './components/SceneOverlay'
import TopBar from './components/TopBar'
import SidePanel from './components/SidePanel'
import ListView from './components/ListView'
import MaterialForm from './components/MaterialForm'
import StructureEditor from './components/StructureEditor'

export default function App() {
  const view = useStore((s) => s.view)
  const form = useStore((s) => s.form)
  const structureOpen = useStore((s) => s.structureOpen)

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (e.key === 'Escape') {
        const st = useStore.getState()
        if (st.form) st.closeForm()
        else if (st.structureOpen) st.setStructureOpen(false)
        else st.clearSel()
      }
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault()
        document.getElementById('search')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <TopBar />
      <main className="main">
        {view === '3d' ? (
          <>
            <div className="scene">
              <Scene />
              <SceneOverlay />
            </div>
            <SidePanel />
          </>
        ) : (
          <ListView />
        )}
      </main>
      {form && <MaterialForm />}
      {structureOpen && <StructureEditor />}
    </div>
  )
}
