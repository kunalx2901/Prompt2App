import { useState } from 'react'

export default function StatusTimeline({ events }) {
  if (!events || events.length === 0) return null

  const [expanded, setExpanded] = useState(false)
  const MAX = 5
  const showMore = events.length > MAX
  const visible = expanded ? events : events.slice(-MAX)

  return (
    <div className="timeline-card compact">
      <div className="timeline-label">AI activity</div>
      <ul className="timeline-list">
        {visible.map((event, index) => (
          <li key={`${event.event}-${index}`} className="timeline-item">
            <span className="timeline-type">{event.event}</span>
            <span className="timeline-message">{event.message}</span>
          </li>
        ))}
      </ul>
      {showMore && (
        <div className="timeline-footer">
          <button className="link small" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : `Show all (${events.length})`}
          </button>
        </div>
      )}
    </div>
  )
}
