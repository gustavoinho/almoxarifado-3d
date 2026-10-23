import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls, Edges, Html, Text } from '@react-three/drei'
import { useStore } from '../store'
import { boxFor, indexPath, shelfLayout, CAB_H, CAB_D, FRAME } from '../layout'

const noRay = () => null

const COLORS = {
  wall: '#6f757b',
  floor: '#c3c8cd',
  frame: '#4a5057',      // laterais, topo e rodapé (cinza escuro)
  body: '#c4c9cd',       // frente do cabeçalho
  board: '#b9bfc4',      // prateleiras
  back: '#9ea5ab',       // fundo interno
  filler: '#6d747a',     // fundo atrás das gavetas (linhas entre gavetas)
  drawer: '#d6d9dc',
  drawerHover: '#f2f5f6',
  handle: '#4f565c',
  edge: '#8f979d',
  selected: '#1596b5',
  text: '#2b3036',
}

function Panel({ position, size, color, roughness = 0.65 }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.05} />
    </mesh>
  )
}

function Drawer({ box, drawer, number, count, onPick }) {
  const [hover, setHover] = useState(false)
  const [w, h] = box.size
  const front = CAB_D / 2

  return (
    <group
      position={box.center}
      onClick={(e) => {
        e.stopPropagation()
        onPick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Frente da gaveta */}
      <mesh position={[0, 0, front - 0.03]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.012, h - 0.012, 0.06]} />
        <meshStandardMaterial
          color={hover ? COLORS.drawerHover : COLORS.drawer}
          roughness={0.5}
          metalness={0.08}
        />
        <Edges color={hover ? COLORS.selected : COLORS.edge} threshold={20} />
      </mesh>

      {/* Número da gaveta */}
      <Text
        position={[0, h * 0.24, front + 0.004]}
        fontSize={Math.min(w, h) * 0.26}
        color={COLORS.text}
        anchorX="center"
        anchorY="middle"
        raycast={noRay}
      >
        {number}
      </Text>

      {/* Puxador */}
      <mesh position={[0, -h * 0.16, front + 0.012]} castShadow>
        <boxGeometry args={[w * 0.42, 0.026, 0.03]} />
        <meshStandardMaterial
          color={hover ? '#278ca5' : COLORS.handle}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>

      {/* Indicador de gaveta ocupada */}
      {count > 0 && (
        <mesh position={[w * 0.36, h * 0.36, front + 0.01]} raycast={noRay}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial
            color="#38966c"
            emissive="#174d36"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {hover && (
        <Html
          position={[0, h / 2 + 0.08, front + 0.08]}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="tip">
            {drawer.name} · {count} {count === 1 ? 'item' : 'itens'}
          </div>
        </Html>
      )}
    </group>
  )
}

function Block({ cabinets, ci, bi, counts }) {
  const select = useStore((s) => s.select)
  const cab = cabinets[ci]
  const blk = cab.blocks[bi]

  const blockBox = boxFor(cabinets, ci, bi)
  const bx = blockBox.center[0]
  const bw = blockBox.size[0]
  const layout = shelfLayout(blk)

  return (
    <group position={[bx, 0, 0]}>
      {/* Laterais */}
      <Panel position={[-bw / 2 + 0.03, CAB_H / 2, 0]} size={[0.06, CAB_H, CAB_D]} color={COLORS.frame} />
      <Panel position={[bw / 2 - 0.03, CAB_H / 2, 0]} size={[0.06, CAB_H, CAB_D]} color={COLORS.frame} />

      {/* Fundo */}
      <Panel
        position={[0, CAB_H / 2, -CAB_D / 2 + 0.02]}
        size={[bw - 0.1, CAB_H, 0.04]}
        color={COLORS.back}
      />

      {/* Tampo */}
      <Panel position={[0, CAB_H - 0.02, 0]} size={[bw, 0.04, CAB_D]} color={COLORS.frame} />

      {/* Cabeçalho frontal (onde fica a etiqueta) */}
      <Panel
        position={[0, CAB_H - 0.12, CAB_D / 2 - 0.02]}
        size={[bw - 0.1, 0.2, 0.04]}
        color={COLORS.body}
      />
      <mesh position={[-bw / 2 + 0.42, CAB_H - 0.12, CAB_D / 2 + 0.006]} raycast={noRay}>
        <boxGeometry args={[0.56, 0.13, 0.01]} />
        <meshStandardMaterial color="#111417" roughness={0.6} />
      </mesh>
      <Text
        position={[-bw / 2 + 0.42, CAB_H - 0.12, CAB_D / 2 + 0.016]}
        fontSize={0.07}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        raycast={noRay}
      >
        {blk.name.toUpperCase()}
      </Text>

      {/* Rodapé */}
      <Panel
        position={[0, 0.05, CAB_D / 2 - 0.02]}
        size={[bw - 0.1, 0.1, 0.04]}
        color={COLORS.frame}
      />

      {/* Prateleira de baixo */}
      <Panel
        position={[0, 0.12, 0]}
        size={[bw - 0.1, 0.04, CAB_D - 0.04]}
        color={COLORS.board}
      />

      {/* Prateleiras entre as fileiras */}
      {layout.slice(0, -1).map((L, si) => (
        <Panel
          key={`board-${blk.shelves[si].id}`}
          position={[0, L.top - L.h, 0]}
          size={[bw - 0.1, 0.04, CAB_D - 0.04]}
          color={COLORS.board}
        />
      ))}

      {/* Fileiras com gavetas */}
      {blk.shelves.map((sh, si) => {
        if (sh.drawers.length === 0) return null
        const L = layout[si]

        return (
          <group key={sh.id}>
            {/* Fundo atrás das gavetas, cria as linhas finas entre elas */}
            <Panel
              position={[0, L.top - L.h / 2, -0.05]}
              size={[bw - 2 * FRAME, L.h, CAB_D - 0.1]}
              color={COLORS.filler}
            />

            {sh.drawers.map((drawer, di) => {
              const box = boxFor(cabinets, ci, bi, si, di)
              return (
                <Drawer
                  key={drawer.id}
                  box={{ ...box, center: [box.center[0] - bx, box.center[1], 0] }}
                  drawer={drawer}
                  number={di + 1}
                  count={counts[drawer.id] || 0}
                  onPick={() =>
                    select({
                      cabinetId: cab.id,
                      blockId: blk.id,
                      shelfId: sh.id,
                      drawerId: drawer.id,
                    })
                  }
                />
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

function Cabinet({ ci, counts }) {
  const cabinets = useStore((s) => s.cabinets)
  const select = useStore((s) => s.select)
  const cab = cabinets[ci]
  const cabBox = boxFor(cabinets, ci)

  return (
    <group>
      {cab.blocks.map((blk, bi) => (
        <Block key={blk.id} cabinets={cabinets} ci={ci} bi={bi} counts={counts} />
      ))}

      {/* Rótulo flutuante do armário */}
      <Html
        position={[cabBox.center[0], CAB_H + 0.9, 0]}
        center
        zIndexRange={[5, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            className="cab-label"
            onClick={() => select({ cabinetId: cab.id })}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              background: 'rgba(18,48,64,0.9)',
              border: '1px solid #2bd4f5',
              borderRadius: 6,
              boxShadow: '0 0 14px rgba(43,212,245,0.45)',
              color: '#fff',
              padding: '10px 30px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <strong style={{ display: 'block', fontSize: 22 }}>Gaveteiro</strong>
            <span style={{ fontSize: 14, opacity: 0.85 }}>{cab.name}</span>
          </button>
          <div style={{ width: 1, height: 38, background: '#2bd4f5' }} />
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#2bd4f5' }} />
        </div>
      </Html>
    </group>
  )
}

function SelectionBox() {
  const sel = useStore((s) => s.sel)
  const cabinets = useStore((s) => s.cabinets)
  const mat = useRef()

  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.opacity = 0.18 + Math.sin(clock.elapsedTime * 3) * 0.06
    }
  })

  const p = indexPath(cabinets, sel)
  if (p.ci < 0) return null

  const box = boxFor(cabinets, p.ci, p.bi, p.si, p.di)

  return (
    <group position={box.center} raycast={noRay}>
      <mesh position={[0, 0, 0.02]} raycast={noRay}>
        <boxGeometry
          args={[box.size[0] + 0.03, box.size[1] + 0.03, box.size[2] + 0.04]}
        />
        <meshBasicMaterial
          ref={mat}
          color={COLORS.selected}
          transparent
          depthWrite={false}
        />
        <Edges color={COLORS.selected} />
      </mesh>
    </group>
  )
}

const HOME_VIEW = [-1.5, 1.9, 12.5, 0, 1.5, 0]

function CameraRig() {
  const ref = useRef()
  const sel = useStore((s) => s.sel)

  useEffect(() => {
    const ctrl = ref.current
    if (!ctrl) return

    const { cabinets } = useStore.getState()
    const p = indexPath(cabinets, sel)

    if (p.ci < 0) {
      ctrl.setLookAt(...HOME_VIEW, true)
      return
    }

    const box = boxFor(cabinets, p.ci, p.bi, p.si, p.di)
    const [cx, cy, cz] = box.center

    // Gaveta: aproxima bastante. Bloco/armário: afasta mais.
    const distance =
      p.di >= 0
        ? Math.max(box.size[0], box.size[1] * 0.9) * 1.5 + 1.6
        : p.bi >= 0
          ? 5
          : 12.5

    ctrl.setLookAt(cx, cy + 0.1, cz + distance, cx, cy, cz, true)
  }, [sel])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1}
      maxDistance={18}
      maxPolarAngle={Math.PI * 0.49}
      minPolarAngle={0.12}
      dollySpeed={0.6}
      smoothTime={0.35}
    />
  )
}

function Environment() {
  return (
    <>
      <color attach="background" args={[COLORS.wall]} />

      <ambientLight intensity={1.0} />
      <hemisphereLight skyColor="#ffffff" groundColor="#9aa2a9" intensity={0.9} />

      <directionalLight
        position={[3, 9, 10]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[-6, 5, 6]} intensity={0.5} color="#ffffff" />

      {/* Parede ao fundo */}
      <mesh position={[0, 6, -CAB_D / 2 - 0.1]} receiveShadow>
        <planeGeometry args={[80, 24]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.95} />
      </mesh>

      {/* Piso polido */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.28} metalness={0.12} />
      </mesh>
    </>
  )
}

export default function Scene() {
  const cabinets = useStore((s) => s.cabinets)
  const materials = useStore((s) => s.materials)

  const counts = useMemo(() => {
    const result = {}
    materials.forEach((material) => {
      if (material.drawerId) {
        result[material.drawerId] = (result[material.drawerId] || 0) + 1
      }
    })
    return result
  }, [materials])

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: [HOME_VIEW[0], HOME_VIEW[1], HOME_VIEW[2]],
        fov: 42,
        near: 0.1,
        far: 100,
      }}
      gl={{ antialias: true }}
    >
      <Environment />

      {cabinets.map((cabinet, index) => (
        <Cabinet key={cabinet.id} ci={index} counts={counts} />
      ))}

      <SelectionBox />
      <CameraRig />
    </Canvas>
  )
}
