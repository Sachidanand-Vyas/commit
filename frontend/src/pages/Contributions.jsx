import { useState, useEffect } from 'react'
import { format, subWeeks, startOfWeek, addDays } from 'date-fns'
import api from '../api/client'
import ContributionGraph from '../components/ContributionGraph'

export default function Contributions() {
  const [contributions, setContributions] = useState({ build: {}, kill: {} })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [weeksToShow, setWeeksToShow] = useState(12)

  useEffect(() => { loadData() }, [weeksToShow])

  const loadData = async () => {
    try {
      const [contribRes, statsRes] = await Promise.all([
        api.get('/stats/contributions'),
        api.get('/stats/overview'),
      ])
      setContributions(contribRes.data)
      setStats(statsRes.data)
    } catch (err) { console.error('Failed to load data:', err) }
    finally { setLoading(false) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-xs text-zinc-500 tracking-wide">loading...</div></div>
  }

  const today = new Date()

  // Monthly build stats
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  let monthBuildTotal = 0
  let monthBuildDays = 0
  let monthKillTotal = 0
  for (let d = new Date(monthStart); d <= monthEnd; d = addDays(d, 1)) {
    const dateStr = format(d, 'yyyy-MM-dd')
    const bc = contributions.build[dateStr] || 0
    const kc = contributions.kill[dateStr] || 0
    if (bc > 0) { monthBuildTotal += bc; monthBuildDays++ }
    if (kc > 0) monthKillTotal += kc
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-medium text-zinc-100 tracking-tight">contributions</h1>
        <p className="text-xs text-zinc-500 mt-1">your progress over time</p>
      </div>

      {/* Streaks */}
      {stats && (
        <div className="flex gap-6 text-xs text-zinc-500">
          <span>streak: <span className="text-zinc-300 tabular-nums">{stats.current_streak}</span></span>
          <span>best: <span className="text-zinc-300 tabular-nums">{stats.best_streak}</span></span>
        </div>
      )}

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs text-zinc-500 tracking-wide uppercase">{format(today, 'MMMM yyyy')}</h2>
        <div className="flex gap-1">
          {[12, 24, 52].map((w) => (
            <button key={w} onClick={() => setWeeksToShow(w)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${weeksToShow === w ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {w === 12 ? '3mo' : w === 24 ? '6mo' : '1yr'}
            </button>
          ))}
        </div>
      </div>

      {/* BUILD Contributions */}
      <div>
        <h2 className="text-xs text-zinc-500 tracking-wide uppercase mb-3">build contributions</h2>
        <ContributionGraph type="build" data={contributions.build} weeksToShow={weeksToShow} />
      </div>

      {/* KILL Contributions */}
      <div>
        <h2 className="text-xs text-zinc-500 tracking-wide uppercase mb-3">kill contributions</h2>
        <ContributionGraph type="kill" data={contributions.kill} weeksToShow={weeksToShow} />
      </div>

      {/* Monthly Summary */}
      <div>
        <h2 className="text-xs text-zinc-500 tracking-wide uppercase mb-3">this month</h2>
        <div className="bg-zinc-900/50 rounded px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Build activities</span>
            <span className="text-zinc-200 tabular-nums">{monthBuildTotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Build active days</span>
            <span className="text-zinc-200 tabular-nums">{monthBuildDays}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Kill slips</span>
            <span className="text-zinc-200 tabular-nums">{monthKillTotal}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
