import type { Mode, Problem } from '../types'
import { modeMeta, problems } from '../problems'

interface Props {
  solved: Set<string>
  onOpen: (id: string) => void
}

const ORDER: Mode[] = ['classic', 'bughunt', 'promptgolf']

export function Home({ solved, onOpen }: Props) {
  return (
    <div className="home">
      <section className="hero">
        <h1>
          LeetCode assumed you were alone.
          <br />
          <span className="accent">You are not alone anymore.</span>
        </h1>
        <p>
          Interviews and online assessments have stopped pretending the assistant isn't there. Once
          it's allowed in the room, memorising a two-pointer trick stops being the thing under test.
          What gets tested is whether you can specify a problem precisely, catch a confident model
          being wrong, and know the difference between code that passes and code that works.
        </p>
        <p className="muted">
          Every submission returns a signal report, not a checkmark: correctness, whether you
          verified before you claimed, how much of the answer you actually authored, and what it
          cost you to get there.
        </p>
      </section>

      {ORDER.map((mode) => (
        <section key={mode} className="mode-section">
          <div className="mode-head">
            <span className={`mode-chip ${mode}`}>{modeMeta[mode].label}</span>
            <h2>{modeMeta[mode].tagline}</h2>
            <p className="muted">{modeMeta[mode].blurb}</p>
          </div>

          <div className="cards">
            {problems
              .filter((p) => p.mode === mode)
              .map((p) => (
                <Card key={p.id} problem={p} solved={solved.has(p.id)} onOpen={onOpen} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Card({
  problem,
  solved,
  onOpen,
}: {
  problem: Problem
  solved: boolean
  onOpen: (id: string) => void
}) {
  return (
    <button className={`card ${solved ? 'is-solved' : ''}`} onClick={() => onOpen(problem.id)}>
      <div className="card-top">
        <h3>{problem.title}</h3>
        <span className={`diff ${problem.difficulty}`}>{problem.difficulty}</span>
      </div>
      <p>{problem.blurb}</p>
      <div className="card-foot">
        <div className="tags">
          {problem.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
        {solved && <span className="solved-mark">solved</span>}
      </div>
    </button>
  )
}
