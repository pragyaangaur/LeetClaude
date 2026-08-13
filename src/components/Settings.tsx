import { useState } from 'react'
import { getApiKey, getModel, MODELS, setApiKey, setModel, type ModelId } from '../ai/client'

export function Settings({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState(getApiKey())
  const [model, setModelState] = useState<ModelId>(getModel())

  function save() {
    setApiKey(key.trim())
    setModel(model)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Assistant setup</h2>
        <p className="muted">
          LeetClaude talks to the Anthropic API directly from this browser tab. Your key is stored in
          this browser's localStorage and sent to <code>api.anthropic.com</code> and nowhere else. That
          is fine for practising on your own machine and wrong for anything you would call production.
        </p>

        <label className="field">
          <span>API key</span>
          <input
            type="password"
            value={key}
            placeholder="sk-ant-..."
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>Model</span>
          <div className="model-choices">
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`model-choice ${model === m.id ? 'is-active' : ''}`}
                onClick={() => setModelState(m.id)}
              >
                <strong>{m.label}</strong>
                <span>{m.note}</span>
              </button>
            ))}
          </div>
        </label>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
