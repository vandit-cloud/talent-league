import { DollarSign, TrendingUp, BarChart3, Sparkles, Target } from 'lucide-react';

export function Salary() {
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
                  Analytics
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Pro Insights
                </span>
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">Salary Insights</h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Discover real-time salary data, market trends, and compensation insights 
                tailored to your skills, experience, and location.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Content */}
        <div className="px-4 sm:px-0">
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full blur-xl opacity-40"></div>
              <div className="relative h-24 w-24 mx-auto bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-xl">
                <DollarSign className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Get comprehensive salary analysis, compare your compensation with industry standards,
              and make informed career decisions with AI-powered insights.
            </p>
            
            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Market Analysis</h3>
                <p className="text-sm text-gray-600">Real-time salary trends</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Skill Matching</h3>
                <p className="text-sm text-gray-600">Salary by skill set</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Growth Tracking</h3>
                <p className="text-sm text-gray-600">Career progression insights</p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">Advanced salary analytics coming soon!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
