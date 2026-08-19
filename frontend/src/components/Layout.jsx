import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '□' },
  { path: '/contributions', label: 'Contributions', icon: '▦' },
  { path: '/habits', label: 'Habits', icon: '+' },
  { path: '/review', label: 'Review', icon: '◎' },
]

export default function Layout({ children, onLogout }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="text-sm font-medium tracking-tight text-zinc-100 hover:text-white transition-colors">
            commit
          </NavLink>
          <button
            onClick={onLogout}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            log out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around h-14">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 px-3 transition-colors ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`
                }
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="text-[10px] tracking-wide uppercase">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
