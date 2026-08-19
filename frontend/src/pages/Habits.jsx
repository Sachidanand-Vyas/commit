import { useState, useEffect } from 'react'
import api from '../api/client'

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    habit_type: 'build',
    target_frequency: 7,
    target_amount: '',
  })

  useEffect(() => { loadHabits() }, [])

  const loadHabits = async () => {
    try {
      const response = await api.get('/habits')
      setHabits(response.data)
    } catch (err) { console.error('Failed to load habits:', err) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...formData, target_amount: formData.target_amount || null }
      if (editingHabit) { await api.put('/habits/' + editingHabit.id, data) }
      else { await api.post('/habits', data) }
      setShowForm(false); setEditingHabit(null); resetForm(); await loadHabits()
    } catch (err) { console.error('Failed to save habit:', err) }
  }

  const handleEdit = (habit) => {
    setFormData({ name: habit.name, habit_type: habit.habit_type, target_frequency: habit.target_frequency, target_amount: habit.target_amount || '' })
    setEditingHabit(habit); setShowForm(true)
  }

  const handleDeactivate = async (habitId) => {
    try { await api.put('/habits/' + habitId, { is_active: false }); await loadHabits() }
    catch (err) { console.error('Failed:', err) }
  }

  const handleDelete = async (habitId) => {
    if (!confirm('Delete this habit?')) return
    try { await api.delete('/habits/' + habitId); await loadHabits() }
    catch (err) { console.error('Failed:', err) }
  }

  const resetForm = () => { setFormData({ name: '', habit_type: 'build', target_frequency: 7, target_amount: '' }) }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-xs text-zinc-500">loading...</div></div>

  const activeHabits = habits.filter(h => h.is_active)
  const inactiveHabits = habits.filter(h => !h.is_active)
  const buildHabits = activeHabits.filter(h => h.habit_type === 'build')
  const killHabits = activeHabits.filter(h => h.habit_type === 'kill')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-zinc-100 tracking-tight">habits</h1>
          <p className="text-xs text-zinc-500 mt-1">build good habits, kill bad ones</p>
        </div>
        <button onClick={() => { resetForm(); setEditingHabit(null); setShowForm(true) }} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition-colors">+ new</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-lg w-full max-w-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-100">{editingHabit ? 'edit habit' : 'new habit'}</h3>
              <button onClick={() => { setShowForm(false); setEditingHabit(null) }} className="text-zinc-500 hover:text-zinc-300">x</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500" placeholder="e.g., morning run" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData({ ...formData, habit_type: 'build' })} className={"px-3 py-2 rounded text-sm " + (formData.habit_type === 'build' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-zinc-800 text-zinc-400 border border-zinc-700")}>build</button>
                  <button type="button" onClick={() => setFormData({ ...formData, habit_type: 'kill' })} className={"px-3 py-2 rounded text-sm " + (formData.habit_type === 'kill' ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-zinc-800 text-zinc-400 border border-zinc-700")}>kill</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">target frequency (times per week)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5,6,7].map((f) => (
                    <button key={f} type="button" onClick={() => setFormData({ ...formData, target_frequency: f })} className={"flex-1 py-2 rounded text-sm " + (formData.target_frequency === f ? "bg-zinc-100 text-zinc-900 font-medium" : "bg-zinc-800 text-zinc-400 border border-zinc-700")}>{f}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">target amount (optional)</label>
                <input type="text" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500" placeholder="e.g., 2 hours/session" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingHabit(null) }} className="flex-1 px-3 py-2 rounded text-sm text-zinc-400 bg-zinc-800">cancel</button>
                <button type="submit" className="flex-1 px-3 py-2 rounded text-sm font-medium bg-zinc-100 text-zinc-900">{editingHabit ? 'save' : 'create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {buildHabits.length > 0 && (
        <div>
          <h2 className="text-xs text-zinc-500 uppercase mb-3">build</h2>
          <div className="space-y-2">
            {buildHabits.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1"><div className="text-sm text-zinc-200">{h.name}</div><div className="text-[10px] text-zinc-500">{h.target_frequency}x/week{h.target_amount && (' - ' + h.target_amount)}</div></div>
                <div className="flex gap-1"><button onClick={() => handleEdit(h)} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1">edit</button><button onClick={() => handleDeactivate(h.id)} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1">pause</button><button onClick={() => handleDelete(h.id)} className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1">delete</button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {killHabits.length > 0 && (
        <div>
          <h2 className="text-xs text-zinc-500 uppercase mb-3">kill</h2>
          <div className="space-y-2">
            {killHabits.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="flex-1"><div className="text-sm text-zinc-200">{h.name}</div><div className="text-[10px] text-zinc-500">{h.target_frequency}x/week{h.target_amount && (' - ' + h.target_amount)}</div></div>
                <div className="flex gap-1"><button onClick={() => handleEdit(h)} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1">edit</button><button onClick={() => handleDeactivate(h.id)} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1">pause</button><button onClick={() => handleDelete(h.id)} className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1">delete</button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactiveHabits.length > 0 && (
        <div>
          <h2 className="text-xs text-zinc-500 uppercase mb-3">paused</h2>
          <div className="space-y-2">
            {inactiveHabits.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3 bg-zinc-900/30 border border-zinc-800/50 rounded opacity-60">
                <div className={'w-2 h-2 rounded-full ' + (h.habit_type === 'build' ? 'bg-emerald-500' : 'bg-red-500')} />
                <div className="flex-1"><div className="text-sm text-zinc-400">{h.name}</div><div className="text-[10px] text-zinc-600">{h.habit_type} - {h.target_frequency}x/week</div></div>
                <button onClick={async () => { await api.put('/habits/' + h.id, { is_active: true }); await loadHabits() }} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1">resume</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {habits.length === 0 && <div className="text-center py-12"><p className="text-sm text-zinc-500 mb-2">no habits yet</p><p className="text-xs text-zinc-600">create your first habit to start tracking</p></div>}
    </div>
  )
}
