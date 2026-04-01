import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutGrid, 
  FileText, 
  Award, 
  BarChart3, 
  Briefcase, 
  User, 
  Bell, 
  LogOut, 
  Sparkles,
  Brain,
  Search,
  PlusCircle
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function CandidateLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { path: '/resume-upload', label: 'Resume', icon: FileText },
    { path: '/assessments', label: 'Assessments', icon: Award },
    { path: '/exam-results', label: 'Results', icon: BarChart3 },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const quickAction = location.pathname === '/resume-upload'
    ? { label: 'Start Assessment', action: () => navigate('/assessments') }
    : { label: 'Upload Resume', action: () => navigate('/resume-upload') };
  const pageTitle =
    location.pathname === '/profile'
      ? 'Profile'
      : menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="app-shell relative flex h-screen overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl blob blob-delay-1"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl blob blob-delay-2"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl blob blob-delay-3"></div>
      </div>

      {/* Sidebar */}
      <aside className="app-sidebar app-sidebar-collapsible flex h-screen w-64 flex-shrink-0 flex-col overflow-y-auto border-r md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-[6.25rem] md:overflow-hidden md:hover:w-72">
        {/* Logo Section */}
        <div className="sticky top-0 z-10 border-b border-white/20 px-4 py-6 backdrop-blur-xl">
          <div
            className="sidebar-justify flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
            title="TalentLeague"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative h-10 w-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="sidebar-reveal min-w-0">
              <span className="text-xl font-bold gradient-text">TalentLeague</span>
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <span className="app-muted text-[10px] uppercase tracking-wider">Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={item.label}
                className={`w-full relative inline-flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-white shadow-lg shadow-indigo-500/30'
                    : 'app-ghost-button'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl"></span>
                )}
                <span className="sidebar-justify relative flex w-full items-center gap-3">
                  <Icon className={`h-6 w-6 shrink-0 ${isActive ? 'text-white' : ''}`} />
                  <span className="sidebar-reveal">{item.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-white/20 p-4 space-y-2">
          {/* User Info */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            title="Open profile"
            className="app-panel w-full p-3 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="sidebar-justify flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name || 'Profile'} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="sidebar-reveal flex-1 min-w-0">
                <p className="app-title text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="app-muted text-xs truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="sidebar-justify w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="sidebar-reveal">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden md:pl-[6.25rem]">
        {/* Top Header */}
        <header className="app-header sticky top-0 z-20 border-b px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="app-title text-xl font-semibold">
                {pageTitle}
              </h1>
              <p className="app-muted text-sm">Welcome back, {user?.name || 'User'}!</p>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={quickAction.action}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <PlusCircle className="h-4 w-4" />
                {quickAction.label}
              </button>
              <ThemeToggle />
              {/* Notifications */}
              <button className="app-icon-button relative rounded-xl p-2.5 group">
                <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse"></span>
              </button>
              
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="app-muted h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="app-input pl-10 pr-4 py-2 rounded-xl transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
