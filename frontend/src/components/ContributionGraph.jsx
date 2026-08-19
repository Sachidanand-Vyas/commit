import { useState, useEffect } from 'react'
import { format, subWeeks, startOfWeek, addDays } from 'date-fns'
import api from '../api/client'

const GREEN_LEVELS = [
  { min: 0, max: 0, color: 'bg-zinc-900' },
  { min: 1, max: 2, color: 'bg-emerald-950' },
  { min: 2, max: 3, color: 'bg-emerald-900' },
  { min: 3, max: 4, color: 'bg-emerald-700' },
  { min: 4, max: 5, color: 'bg-emerald-500' },
  { min: 5, max: 999, color: 'bg-emerald-400' },
]

const RED_LEVELS = [
  { min: 0, max: 0, color: 'bg-zinc-900' },
  { min: 1, max: 2, color: 'bg-red-950' },
  { min: 2, max: 3, color: 'bg-red-900' },
  { min: 3, max: 4, color: 'bg-red-700' },
  { min: 4, max: 5, color: 'bg-red-500' },
  { min: 5, max: 999, color: 'bg-red-400' },
]

function getLevel(count, type) {
  const levels = type === 'kill' ? RED_LEVELS : GREEN_LEVELS
  if (count === 0) return levels[0]
  for (const level of levels) {
    if (count >= level.min && count < level.max) return level
  }
  return levels[levels.length - 1]
}

export default function ContributionGraph({ type = 'build', data = {}, weeksToShow = 12, showLegend = true }) {
  const [tooltip, setTooltip] = useState(null)
  const levels = type === 'kill' ? RED_LEVELS : GREEN_LEVELS

  const weeks = []
  const today = new Date()
  const startDate = subWeeks(startOfWeek(today, { weekStartsOn: 0 }), weeksToShow - 1)

  for (let week = 0; week < weeksToShow; week++) {
    const weekStart = addDays(startDate, week * 7)
    const days = []
    for (let day = 0; day < 7; day++) {
      const date = addDays(weekStart, day)
      const dateStr = format(date, 'yyyy-MM-dd')
      const count = data[dateStr] || 0
      const level = getLevel(count, type)
      days.push({ date: dateStr, displayDate: format(date, 'MMM d, yyyy'), level, count })
    }
    weeks.push(days)
  }

  return (
    <div className="relative">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${day.level.color} cursor-default`}
                onMouseEnter={(e) => {
                  const rect = e.target.getBoundingClientRect()
                  setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, day })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {showLegend && (
        <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500">
          <span>less</span>
          {levels.map((level, idx) => (
            <div key={idx} className={`w-3 h-3 rounded-sm ${level.color}`} />
          ))}
          <span>more</span>
        </div>
      )}

      {tooltip && (
        <div
          className="fixed z-50 bg-zinc-800 text-zinc-100 text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="font-medium">{tooltip.day.displayDate}</div>
          <div className="text-zinc-400">
            {tooltip.day.count > 0
              ? `${tooltip.day.count} ${type === 'kill' ? 'slip' : 'activit'}${tooltip.day.count !== 1 ? (type === 'kill' ? 's' : 'ies') : (type === 'kill' ? '' : 'y')}`
              : 'No activity'}
          </div>
        </div>
      )}
    </div>
  )
}
