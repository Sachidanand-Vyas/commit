import { useState, useEffect } from 'react'
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import api from '../api/client'

export default function Review() {
  const [stats, setStats] = useState(null)
  const [monthStats, setMonthStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, monthRes] = await Promise.all([
        api.get('/stats/overview'),
        api.get('/stats/monthly?month=' + format(selectedMonth, 'yyyy-MM')),
      ])
      setStats(statsRes.data)
      setMonthStats(monthRes.data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const goToPrevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1))
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-xs text-zinc-500">loading...</div></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-medium text-zinc-100 tracking-tight">review</h1>
        <p className="text-xs text-zinc-500 mt-1">your consistency over time</p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <button onClick={goToPrevMonth} className="text-xs text-zinc-500 hover:text-zinc-300">&larr; prev</button>
        <h2 className="text-sm font-medium text-zinc-200">{format(selectedMonth, 'MMMM yyyy')}</h2>
        <div className="w-12" />
      </div>

      {/* Overall Stats */}
      {stats && (
        <div>
          <h3 className="text-xs text-zinc-500 uppercase mb-3">overall</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/50 rounded px-3 py-3">
              <div className="text-xl font-medium text-zinc-100 tabular-nums">{stats.current_streak}</div>
              <div className="text-[10px] text-zinc-500 uppercase mt-1">current streak</div>
            </div>
            <div className="bg-zinc-900/50 rounded px-3 py-3">
              <div className="text-xl font-medium text-zinc-100 tabular-nums">{stats.best_streak}</div>
              <div className="text-[10px] text-zinc-500 uppercase mt-1">best streak</div>
            </div>
            <div className="bg-zinc-900/50 rounded px-3 py-3">
              <div className="text-xl font-medium text-zinc-100 tabular-nums">{stats.total_completions}</div>
              <div className="text-[10px] text-zinc-500 uppercase mt-1">total completions</div>
            </div>
            <div className="bg-zinc-900/50 rounded px-3 py-3">
              <div className="text-xl font-medium text-zinc-100 tabular-nums">{stats.active_days}</div>
              <div className="text-[10px] text-zinc-500 uppercase mt-1">active days</div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Stats */}
      {monthStats && (
        <div>
          <h3 className="text-xs text-zinc-500 uppercase mb-3">{format(selectedMonth, 'MMMM')}</h3>
          <div className="bg-zinc-900/50 rounded px-4 py-3 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Build consistency</span>
              <span className="text-zinc-200 tabular-nums">{monthStats.build_consistency}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Kill consistency</span>
              <span className="text-zinc-200 tabular-nums">{monthStats.kill_consistency}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Active days</span>
              <span className="text-zinc-200 tabular-nums">{monthStats.active_days}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Total completions</span>
              <span className="text-zinc-200 tabular-nums">{monthStats.total_completions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Best day</span>
              <span className="text-zinc-200">{monthStats.best_day || '-'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Habit Breakdown */}
      {monthStats && monthStats.habits && monthStats.habits.length > 0 && (
        <div>
          <h3 className="text-xs text-zinc-500 uppercase mb-3">habit breakdown</h3>
          <div className="space-y-2">
            {monthStats.habits.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded">
                <div className={'w-2 h-2 rounded-full ' + (h.habit_type === 'build' ? 'bg-emerald-500' : 'bg-red-500')} />
                <div className="flex-1">
                  <div className="text-sm text-zinc-200">{h.name}</div>
                  <div className="text-[10px] text-zinc-500">{h.habit_type} - {h.target_frequency}x/week</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-200 tabular-nums">{h.completions}/{h.possible}</div>
                  <div className="text-[10px] text-zinc-500">{h.consistency}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison */}
      {monthStats && monthStats.prev_month && (
        <div>
          <h3 className="text-xs text-zinc-500 uppercase mb-3">vs last month</h3>
          <div className="bg-zinc-900/50 rounded px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Consistency change</span>
              <span className={monthStats.build_consistency_change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {monthStats.build_consistency_change >= 0 ? '+' : ''}{monthStats.build_consistency_change}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Active days change</span>
              <span className={monthStats.active_days_change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {monthStats.active_days_change >= 0 ? '+' : ''}{monthStats.active_days_change}
              </span>
            </div>
          </div>
        </div>
      )}

      {stats && stats.total_completions === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-zinc-500 mb-2">no data yet</p>
          <p className="text-xs text-zinc-600">complete some habits to see your review</p>
        </div>
      )}
    </div>
  )
}