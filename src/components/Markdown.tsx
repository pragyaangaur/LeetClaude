import { Fragment, type ReactNode } from 'react'

/**
 * A deliberately small markdown subset — enough for problem statements
 * (headings, fenced code, inline code, bold, blockquotes, lists) and nothing more.
 */
export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = []
  const lines = source.split('\n')
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const body: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++])
      i++
      blocks.push(
        <pre key={key++} className="md-code">
          <code>{body.join('\n')}</code>
        </pre>,
      )
      continue
    }

    if (line.startsWith('> ')) {
      const body: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) body.push(lines[i++].slice(2))
      blocks.push(
        <blockquote key={key++} className="md-quote">
          {inline(body.join(' '))}
        </blockquote>,
      )
      continue
    }

    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) items.push(lines[i++].slice(2))
      blocks.push(
        <ul key={key++} className="md-list">
          {items.map((item, n) => (
            <li key={n}>{inline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (line.startsWith('#')) {
      const level = line.match(/^#+/)![0].length
      const Tag = (level >= 3 ? 'h4' : 'h3') as 'h3' | 'h4'
      blocks.push(
        <Tag key={key++} className="md-heading">
          {inline(line.replace(/^#+\s*/, ''))}
        </Tag>,
      )
      i++
      continue
    }

    if (!line.trim()) {
      i++
      continue
    }

    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^[#>`]|^[-*] /.test(lines[i])) para.push(lines[i++])
    blocks.push(
      <p key={key++} className="md-p">
        {inline(para.join(' '))}
      </p>,
    )
  }

  return <>{blocks}</>
}

/** Handles `code` and **bold** within a line. */
function inline(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return parts.map((part, n) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return <code key={n}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
      return <strong key={n}>{part.slice(2, -2)}</strong>
    }
    return <Fragment key={n}>{part}</Fragment>
  })
}
