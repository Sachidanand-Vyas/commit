import { useState, useEffect } from 'react'
import api from '../api/client'
import ContributionGraph from '../components/ContributionGraph'

export default function Dashboard() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState({})
  const [stats, setStats] = useState(null)
  const [contributions, setContributions] = useState({ build: {}, kill: {} })
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [habitsRes, statsRes, contribRes] = await Promise.all([
        api.get('/habits'),
        api.get('/stats/overview'),
        api.get('/stats/contributions'),
      ])

      setHabits(habitsRes.data)
      setStats(statsRes.data)
      setContributions(contribRes.data)

      const today = new Date().toISOString().split('T')[0]
      const logsMap = {}
      for (const habit of habitsRes.data) {
        try {
          const logRes = await api.get(`/habits/${habit.id}/logs?date=${today}`)
          if (logRes.data.length > 0) logsMap[habit.id] = logRes.data[0]
        } catch {}
      }
      setLogs(logsMap)
    } catch (err) { console.error('Failed to load data:', err) }
    finally { setLoading(false) }
  }

  const handleCheckIn = async (habitId, completed) => {
    setCheckingIn(habitId)
    try {
      const today = new Date().toISOString().split('T')[0]
      await api.post(`/habits/${habitId}/logs`, { date: today, completed })
      await loadData()
    } catch (err) { console.error('Check-in failed:', err) }
    finally { setCheckingIn(null) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-xs text-zinc-500 tracking-wide">loading...</div></div>
  }

  const buildHabits = habits.filter(h => h.habit_type === 'build')
  const killHabits = habits.filter(h => h.habit_type === 'kill')

  const buildCount = buildHabits.filter(h => logs[h.id]?.completed).length
  const killCount = killHabits.filter(h => logs[h.id]?.completed).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-medium text-zinc-100 tracking-tight">today</h1>
        <p className="text-xs text-zinc-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Streaks */}
      {stats && (stats.current_streak > 0 || stats.best_streak > 0) && (
        <div className="flex gap-6 text-xs text-zinc-500">
          <span>streak: <span className="text-zinc-300 tabular-nums">{stats.current_streak}</span></span>
          <span>best: <span className="text-zinc-300 tabular-nums">{stats.best_streak}</span></span>
        </div>
      )}

      {/* BUILD Habits */}
      {buildHabits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs text-zinc-500 tracking-wide uppercase">build</h2>
            <span className="text-[10px] text-zinc-500 tabular-nums">
              {buildCount} activit{buildCount !== 1 ? 'ies' : 'y'} today
            </span>
          </div>
          <div className="space-y-1">
            {buildHabits.map((habit) => {
              const isChecked = logs[habit.id]?.completed
              const isChecking = checkingIn === habit.id
              return (
                <button
                  key={habit.id}
                  onClick={() => handleCheckIn(habit.id, !isChecked)}
                  disabled={isChecking}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left hover:bg-zinc-900/50 transition-colors disabled:opacity-50"
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${
                    isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                  }`}>
                    {isChecked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${isChecked ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>{habit.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* KILL Habits */}
      {killHabits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs text-zinc-500 tracking-wide uppercase">kill</h2>
            <span className="text-[10px] text-zinc-500 tabular-nums">
              {killCount > 0 ? `${killCount} slip${killCount !== 1 ? 's' : ''} today` : 'clean today'}
            </span>
          </div>
          <div className="space-y-1">
            {killHabits.map((habit) => {
              const isSlipped = logs[habit.id]?.completed
              const isChecking = checkingIn === habit.id
              return (
                <button
                  key={habit.id}
                  onClick={() => handleCheckIn(habit.id, !isSlipped)}
                  disabled={isChecking}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left hover:bg-zinc-900/50 transition-colors disabled:opacity-50"
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${
                    isSlipped ? 'bg-red-500 border-red-500' : 'border-zinc-600'
                  }`}>
                    {isSlipped && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm ${isSlipped ? 'text-red-400' : 'text-zinc-200'}`}>{habit.name}</span>
                    <span className={`text-[10px] ${isSlipped ? 'text-red-400' : 'text-zinc-600'}`}>
                      {isSlipped ? 'slipped' : 'clean'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* BUILD Contributions */}
      <div>
        <h2 className="text-xs text-zinc-500 tracking-wide uppercase mb-3">build contributions</h2>
        <ContributionGraph type="build" data={contributions.build} />
      </div>

      {/* KILL Contributions */}
      {killHabits.length > 0 && (
        <div>
          <h2 className="text-xs text-zinc-500 tracking-wide uppercase mb-3">kill contributions</h2>
          <ContributionGraph type="kill" data={contributions.kill} />
        </div>
      )}

      {/* Empty State */}
      {habits.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-zinc-500 mb-4">no habits yet</p>
          <a href="/habits" className="text-xs text-zinc-300 hover:text-white transition-colors">create your first habit →</a>
        </div>
      )}
    </div>
  )
}
