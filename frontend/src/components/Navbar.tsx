import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, LogOut, User, Home, FileText, Award, BarChart3, Settings, Bell, Search, Sparkles } from 'lucide-react';

export function Navbar() {
  const { user, logout, viewRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems =
    viewRole === 'recruiter'
      ? [
          { path: '/recruiter/dashboard', label: 'Dashboard', icon: Home },
          { path: '/recruiter/assessments/add', label: 'Assessments', icon: Award },
          { path: '/recruiter/candidates', label: 'Candidates', icon: User }
        ]
      : [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/resume-upload', label: 'Resume', icon: FileText },
          { path: '/assessments', label: 'Assessment', icon: Award },
          { path: '/exam-results', label: 'Results', icon: BarChart3 },
          { path: '/jobs', label: 'Jobs', icon: Search }
        ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center group cursor-pointer" onClick={() => navigate(viewRole === 'recruiter' ? '/recruiter/dashboard' : '/dashboard')}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <div className="relative h-10 w-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <span className="text-xl font-bold gradient-text">TalentLeague</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                    {viewRole === 'recruiter' ? 'Recruiter' : 'Candidate'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Pro</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'text-white shadow-lg shadow-indigo-500/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl"></span>
                    )}
                    <span className="relative flex items-center">
                      <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-white' : ''}`} />
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all duration-200 group">
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse"></span>
            </button>
            
            {/* Settings */}
            <button className="p-2.5 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all duration-200 group">
              <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3 hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group"
                title="Logout"
              >
                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
