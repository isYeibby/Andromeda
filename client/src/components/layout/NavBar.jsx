import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'TELEMETRY' },
  { path: '/radar', label: 'ANALYTICS' },
  { path: '/archive', label: 'DATA_VAULT' },
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
          {/* Logo — Left */}
          <NavLink to="/dashboard" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-2 h-2 bg-accent-fuchsia animate-pulse-glow" />
            <span className="font-display font-bold text-base sm:text-lg tracking-wider text-glow-fuchsia">
              ANDROMEDA<span className="text-accent-cyan"> //</span><span className="text-slate-400 text-xs sm:text-sm ml-1 font-mono">OS</span>
            </span>
          </NavLink>

          {/* Nav Links — Center */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {navItems.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `px-2 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.1em] sm:tracking-[0.15em] transition-all duration-300 relative
                  ${isActive
                    ? 'text-accent-cyan text-glow-cyan'
                    : 'text-slate-400 hover:text-accent-fuchsia'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">{`[${label}]`}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-cyan to-transparent" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-accent-cyan transition-colors"
              title={isDark ? 'Switch to NERV/Lab mode' : 'Switch to HUD Espacial mode'}
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

            {/* User avatar */}
            {user && (
              <>
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
              </>
            )}

            {/* DISCONNECT button — massive/angular */}
            <button
              id="disconnect-btn"
              onClick={handleLogout}
              className="btn-massive clip-angular-sm text-accent-rose text-[10px] sm:text-[11px] py-1.5 sm:py-2 px-3 sm:px-5"
            >
              [ DISCONNECT ]
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
