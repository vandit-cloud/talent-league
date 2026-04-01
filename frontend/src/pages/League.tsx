import { Trophy, Sparkles, Target, Zap } from 'lucide-react';

export function League() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl blob blob-delay-1"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl blob blob-delay-2"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl blob blob-delay-3"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-8 fade-in-up">
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                  Competition
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Elite Level
                </span>
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">Talent League</h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Compete with top talent, climb the rankings, and unlock exclusive opportunities.
                The ultimate platform for showcasing your skills and earning recognition.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Content */}
        <div className="px-4 sm:px-0">
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-40"></div>
              <div className="relative h-24 w-24 mx-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              We're building an exciting competitive platform where you can showcase your skills, 
              compete with other professionals, and get noticed by top companies.
            </p>
            
            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Tournaments</h3>
                <p className="text-sm text-gray-600">Compete in skill-based challenges</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Leaderboards</h3>
                <p className="text-sm text-gray-600">Climb the global rankings</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Rewards</h3>
                <p className="text-sm text-gray-600">Earn prizes and recognition</p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-center gap-2 text-indigo-700">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">Stay tuned for updates!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
