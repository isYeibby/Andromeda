import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'MAINFRAME' },
  { path: '/radar', label: 'RADAR' },
  { path: '/archive', label: 'ARCHIVE' },
];

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
    setIsDark(!isDark);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 fui-panel border-b border-accent-cyan/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-2 h-2 bg-accent-fuchsia animate-pulse-glow" />
            <span className="font-display font-bold text-lg tracking-wider text-glow-fuchsia">
              VIBE<span className="text-accent-cyan">_</span>SYNC
            </span>
          </NavLink>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-[11px] font-mono tracking-[0.15em] transition-all duration-300 relative
                  ${isActive
                    ? 'text-accent-cyan text-glow-cyan'
                    : 'text-slate-400 hover:text-accent-fuchsia'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">{`// ${label}`}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-cyan to-transparent" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-accent-amber transition-colors"
              title={isDark ? 'Switch to NERV mode' : 'Switch to NeoTokyo mode'}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* User */}
            {user && (
              <div className="flex items-center gap-2">
                {user.images?.[0]?.url ? (
                  <img
                    src={user.images[0].url}
                    alt={user.display_name}
                    className="w-7 h-7 clip-angular-sm object-cover border border-accent-cyan/30"
                  />
                ) : (
                  <div className="w-7 h-7 clip-angular-sm bg-slate-mid flex items-center justify-center text-[10px] font-mono text-accent-cyan border border-accent-cyan/30">
                    {user.display_name?.[0] || '?'}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="text-[10px] font-mono tracking-wider text-slate-500 hover:text-accent-red transition-colors"
                >
                  [DISCONNECT]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
