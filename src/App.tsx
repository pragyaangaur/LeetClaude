import { useEffect, useState } from 'react'
import { getProblem } from './problems'
import { Home } from './components/Home'
import { Workspace } from './components/Workspace'
import { Settings } from './components/Settings'
import './App.css'

const SOLVED_KEY = 'leetclaude.solved'

function readHash(): string | null {
  const match = window.location.hash.match(/^#\/p\/(.+)$/)
  return match ? match[1] : null
}

export default function App() {
  const [route, setRoute] = useState<string | null>(readHash())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [solved, setSolved] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(SOLVED_KEY) ?? '[]'))
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    const onHash = () => setRoute(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function markSolved(id: string) {
    setSolved((prev) => {
      const next = new Set(prev).add(id)
      localStorage.setItem(SOLVED_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const problem = route ? getProblem(route) : undefined

  return (
    <div className="app">
      <nav className="topbar">
        <a className="brand" href="#/">
          leet<span>claude</span>
        </a>
        <div className="topbar-right">
          <span className="muted small">{solved.size} solved</span>
          <button className="btn ghost" onClick={() => setSettingsOpen(true)}>
            Assistant setup
          </button>
        </div>
      </nav>

      {problem ? (
        <Workspace
          key={problem.id}
          problem={problem}
          onBack={() => (window.location.hash = '#/')}
          onOpenSettings={() => setSettingsOpen(true)}
          onSolved={markSolved}
        />
      ) : (
        <Home solved={solved} onOpen={(id) => (window.location.hash = `#/p/${id}`)} />
      )}

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
