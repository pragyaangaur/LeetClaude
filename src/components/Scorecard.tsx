import type { Problem, Scorecard as Card } from '../types'
import { grade } from '../scoring'
import { Markdown } from './Markdown'

interface Props {
  card: Card
  problem: Problem
  solved: boolean
  onClose: () => void
}

const AXES: { key: keyof Card; label: string; hint: string }[] = [
  { key: 'correctness', label: 'Correctness', hint: 'visible and hidden tests' },
  { key: 'verification', label: 'Verification', hint: 'did you check before you claimed' },
  { key: 'independence', label: 'Authorship', hint: 'typed versus pasted' },
  { key: 'efficiency', label: 'Efficiency', hint: 'cost of getting there' },
]

export function Scorecard({ card, problem, solved, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="score-head">
          <div>
            <div className="muted small">Signal report</div>
            <h2>{grade(card.overall)}</h2>
          </div>
          <div className="score-ring">
            <span>{card.overall}</span>
          </div>
        </div>

        <div className="axes">
          {AXES.map((axis) => (
            <div key={axis.key} className="axis">
              <div className="axis-head">
                <span>{axis.label}</span>
                <b>{card[axis.key] as number}</b>
              </div>
              <div className="bar">
                <i style={{ width: `${card[axis.key] as number}%` }} />
              </div>
              <div className="muted small">{axis.hint}</div>
            </div>
          ))}
        </div>

        {card.notes.length > 0 && (
          <ul className="notes">
            {card.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}

        {solved && problem.postmortem && (
          <div className="postmortem">
            <h3>What the defect actually was</h3>
            <Markdown source={problem.postmortem} />
          </div>
        )}

        <div className="modal-actions">
          <button className="btn primary" onClick={onClose}>
            Back to the problem
          </button>
        </div>
      </div>
    </div>
  )
}
