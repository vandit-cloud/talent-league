import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, Users, ClipboardList, UserPlus, LogOut, Briefcase, Settings, Bell, Sparkles, Brain, PlusCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function RecruiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { path: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { path: '/recruiter/assessments/add', label: 'Assessments', icon: ClipboardList },
    { path: '/recruiter/assessment-management', label: 'Assessment Management', icon: Brain },
    { path: '/recruiter/candidates', label: 'Candidates', icon: Users },
    { path: '/recruiter/add-candidate', label: 'Add Candidate', icon: UserPlus },
    { path: '/recruiter/jobs', label: 'Job Management', icon: Briefcase },
    { path: '/recruiter/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="app-shell h-screen overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl blob blob-delay-1"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl blob blob-delay-2"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl blob blob-delay-3"></div>
      </div>

      <div className="relative flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="app-sidebar app-sidebar-collapsible sticky top-0 hidden h-screen w-72 flex-shrink-0 overflow-y-auto border-r shadow-xl md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-[6.25rem] md:flex-col md:overflow-hidden md:hover:w-72">
          <div className="sticky top-0 z-10 flex h-20 items-center border-b border-white/20 px-4 backdrop-blur-xl">
            <div className="sidebar-justify flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-40"></div>
                <div className="relative h-10 w-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="sidebar-reveal min-w-0">
                <span className="text-lg font-bold gradient-text">Recruiter Portal</span>
                <div className="app-muted flex items-center gap-1 text-xs">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Pro Member
                </div>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {items.map((it) => {
              const Icon = it.icon;
              const active = location.pathname === it.path;
              return (
                <button
                  key={it.path}
                  onClick={() => navigate(it.path)}
                  title={it.label}
                  className={`sidebar-justify w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30' 
                      : 'app-ghost-button hover:shadow-md'
                  }`}
                >
                  <Icon className={`h-6 w-6 shrink-0 ${active ? 'text-white' : 'text-indigo-500'}`} />
                  <span className="sidebar-reveal">{it.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="mt-auto border-t border-white/20 p-4 space-y-3">
            <div className="app-panel px-4 py-3 rounded-xl border">
              <div className="sidebar-justify flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'R'}
                </div>
                <div className="sidebar-reveal min-w-0">
                  <div className="app-muted mb-1 text-xs">Logged in as</div>
                  <div className="app-title text-sm font-medium truncate">{user?.email}</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Logout"
              className="sidebar-justify w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors md:justify-center"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="sidebar-reveal">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden md:pl-[6.25rem]">
          {/* Header */}
          <header className="app-header sticky top-0 z-20 flex h-20 items-center justify-between border-b px-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-lg opacity-30"></div>
                <div className="relative h-12 w-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <div className="app-title font-semibold">TalentLeague</div>
                <div className="app-muted text-sm">AI-Powered Recruitment</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/recruiter/add-candidate')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <PlusCircle className="h-4 w-4" />
                Add Candidate
              </button>
              <ThemeToggle />
              <button className="app-icon-button relative rounded-xl p-2 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="app-panel flex items-center gap-3 rounded-xl border px-4 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'R'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="app-title text-sm font-medium">{user?.name}</div>
                  <div className="app-muted text-xs">Recruiter</div>
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
    </div>
  );
}
