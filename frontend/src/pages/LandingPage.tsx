import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  ChevronDown,
  Code2,
  FileSearch,
  Layers,
  MousePointer2,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Zap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

/* ------------------------------------------------------------------ */
/*  Scroll-reveal hook using Intersection Observer                     */
/* ------------------------------------------------------------------ */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ------------------------------------------------------------------ */
/*  Stagger-reveal for children                                        */
/* ------------------------------------------------------------------ */
function RevealGroup({
  children,
  className = '',
  threshold = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}) {
  const { ref, visible } = useReveal(threshold);
  return (
    <div ref={ref} className={`${className} ${visible ? 'reveal-visible' : 'reveal-hidden'}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Counter animation                                                  */
/* ------------------------------------------------------------------ */
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useReveal(0.3);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ================================================================== */
/*  Landing Page                                                       */
/* ================================================================== */
export function LandingPage() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <div className={`landing-scroll ${isDark ? 'dark-landing' : 'light-landing'}`}>
      {/* ============================================================ */}
      {/*  INLINE STYLES for scroll animations                          */}
      {/* ============================================================ */}
      <style>{`
        html { scroll-behavior: smooth; }

        .landing-scroll {
          --accent: #6366f1;
          --accent2: #a855f7;
          --accent3: #ec4899;
        }

        /* Reveal animations */
        .reveal-hidden { opacity: 0; transform: translateY(48px); }
        .reveal-visible {
          opacity: 1; transform: translateY(0);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Stagger children */
        .reveal-visible > .stagger-child { opacity: 0; transform: translateY(32px); animation: staggerIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        .reveal-visible > .stagger-child:nth-child(1) { animation-delay: 0.05s; }
        .reveal-visible > .stagger-child:nth-child(2) { animation-delay: 0.15s; }
        .reveal-visible > .stagger-child:nth-child(3) { animation-delay: 0.25s; }
        .reveal-visible > .stagger-child:nth-child(4) { animation-delay: 0.35s; }
        .reveal-visible > .stagger-child:nth-child(5) { animation-delay: 0.45s; }
        .reveal-visible > .stagger-child:nth-child(6) { animation-delay: 0.55s; }

        @keyframes staggerIn {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Hero scroll indicator bounce */
        @keyframes bounce-scroll {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        .scroll-bounce { animation: bounce-scroll 2s ease-in-out infinite; }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Glow effect */
        .glow-card {
          position: relative;
          overflow: hidden;
        }
        .glow-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2), rgba(236,72,153,0.3));
          z-index: -1;
          opacity: 0;
          transition: opacity 0.4s;
        }
        .glow-card:hover::before { opacity: 1; }

        /* Floating shapes */
        @keyframes float1 { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(20px,-30px) rotate(180deg); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(-25px,20px) rotate(-180deg); } }
        @keyframes float3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(15px,25px); } }
        .float-shape-1 { animation: float1 12s ease-in-out infinite; }
        .float-shape-2 { animation: float2 15s ease-in-out infinite; }
        .float-shape-3 { animation: float3 10s ease-in-out infinite; }

        /* Pulse ring */
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .pulse-ring::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: inherit;
          border: 2px solid rgba(99,102,241,0.4);
          animation: pulse-ring 2s ease-out infinite;
        }

        /* Navbar blur */
        .nav-blur {
          backdrop-filter: blur(20px) saturate(1.8);
          -webkit-backdrop-filter: blur(20px) saturate(1.8);
        }

        /* Section divider */
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.3) 50%, transparent 100%);
        }
      `}</style>

      {/* ============================================================ */}
      {/*  NAVBAR                                                       */}
      {/* ============================================================ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 nav-blur ${isDark ? 'bg-slate-950/70 border-b border-white/5' : 'bg-white/70 border-b border-slate-200/50'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>TalentLeague</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate('/login')}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-xl hover:shadow-indigo-500/30"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/*  SECTION 1 — HERO                                             */}
      {/* ============================================================ */}
      <section className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 ${isDark
        ? 'bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.1),_transparent_50%)] bg-slate-950'
        : 'bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.1),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.06),_transparent_50%)] bg-white'
      }`}>
        {/* Floating shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`float-shape-1 absolute left-[10%] top-[20%] h-72 w-72 rounded-full ${isDark ? 'bg-indigo-500/5' : 'bg-indigo-500/[0.03]'} blur-3xl`} />
          <div className={`float-shape-2 absolute right-[15%] top-[30%] h-96 w-96 rounded-full ${isDark ? 'bg-purple-500/5' : 'bg-purple-500/[0.03]'} blur-3xl`} />
          <div className={`float-shape-3 absolute bottom-[20%] left-[30%] h-80 w-80 rounded-full ${isDark ? 'bg-pink-500/5' : 'bg-pink-500/[0.03]'} blur-3xl`} />
        </div>

        {/* Grid lines */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.15]">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <RevealGroup>
            <div className="stagger-child mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/20">
              <Sparkles className="h-4 w-4" />
              AI-powered hiring and assessment platform
            </div>
          </RevealGroup>

          <RevealGroup>
            <h1 className={`stagger-child mt-4 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Hiring is <span className="gradient-text">broken.</span>
              <br />
              We're fixing it.
            </h1>
          </RevealGroup>

          <RevealGroup>
            <p className={`stagger-child mx-auto mt-8 max-w-2xl text-lg leading-relaxed sm:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Resumes lie. Interviews are biased. TalentLeague uses AI-driven assessments, proctored exams, and verified skill validation to match real talent with real jobs.
            </p>
          </RevealGroup>

          {/* CTA buttons are in the bottom CTA section, not here — keeping hero clean */}
        </div>

        {/* Scroll indicator */}
        <button onClick={scrollToNext} className="absolute bottom-10 z-10 flex flex-col items-center gap-2 scroll-bounce cursor-pointer">
          <span className={`text-xs font-medium uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Scroll</span>
          <ChevronDown className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
        </button>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 2 — STATS                                            */}
      {/* ============================================================ */}
      <section className={`relative py-28 px-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="section-divider absolute top-0 left-0 right-0" />
        <div className="mx-auto max-w-6xl">
          <RevealGroup className="text-center mb-16">
            <p className="stagger-child text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">The problem</p>
            <h2 className={`stagger-child mt-4 text-4xl font-bold sm:text-5xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Traditional hiring fails everyone
            </h2>
          </RevealGroup>

          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: 72, suffix: '%', label: 'of resumes contain exaggerations', icon: FileSearch },
              { value: 85, suffix: '%', label: 'of hiring managers rely on gut feeling', icon: Users },
              { value: 40, suffix: '%', label: 'of new hires fail within 18 months', icon: TrendingUp },
              { value: 17, suffix: 'K', label: 'average cost of one bad hire (USD)', icon: Target },
            ].map((stat, i) => (
              <div
                key={i}
                className={`stagger-child glow-card relative rounded-3xl border p-8 text-center transition-all hover:translate-y-[-4px] ${isDark
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-slate-200 bg-white shadow-sm hover:shadow-lg'
                }`}
              >
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
                  <stat.icon className="h-7 w-7 text-indigo-500" />
                </div>
                <p className={`text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stat.suffix === 'K' && '$'}<AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{stat.label}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 3 — WHAT IF                                          */}
      {/* ============================================================ */}
      <section className={`relative py-28 px-6 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="section-divider absolute top-0 left-0 right-0" />
        <div className="mx-auto max-w-4xl text-center">
          <RevealGroup>
            <h2 className={`stagger-child text-4xl font-bold sm:text-5xl lg:text-6xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              What if you could <span className="gradient-text">actually know?</span>
            </h2>
            <p className={`stagger-child mx-auto mt-8 max-w-2xl text-lg leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              What if every candidate was tested on real skills? What if resumes were verified against actual performance? What if hiring decisions were backed by data, not luck?
            </p>
          </RevealGroup>

          <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-3">
            {[
              { icon: Shield, title: 'Verified Skills', desc: 'AI-proctored assessments reveal actual ability, not memorized answers' },
              { icon: Zap, title: 'Instant Matching', desc: 'Resume analysis + exam scores = precise candidate-job fit scoring' },
              { icon: ShieldCheck, title: 'Anti-Cheating', desc: 'Face detection, tab monitoring, and behavioral analysis in real-time' },
            ].map((card, i) => (
              <div
                key={i}
                className={`stagger-child glow-card rounded-3xl border p-7 text-left transition-all hover:translate-y-[-4px] ${isDark
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-slate-200 bg-slate-50/50 hover:shadow-lg'
                }`}
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{card.desc}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 4 — HOW IT WORKS                                     */}
      {/* ============================================================ */}
      <section className={`relative py-28 px-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="section-divider absolute top-0 left-0 right-0" />
        <div className="mx-auto max-w-6xl">
          <RevealGroup className="text-center mb-16">
            <p className="stagger-child text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">How it works</p>
            <h2 className={`stagger-child mt-4 text-4xl font-bold sm:text-5xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Three steps to smarter hiring
            </h2>
          </RevealGroup>

          <RevealGroup className="grid gap-8 lg:grid-cols-3">
            {[
              {
                step: '01',
                icon: UserRound,
                title: 'Upload & Analyze',
                desc: 'Candidates upload their resume. Our AI extracts skills, validates claims, and creates a candidate profile in seconds.',
                color: 'from-indigo-500 to-blue-600',
              },
              {
                step: '02',
                icon: Code2,
                title: 'Assess & Verify',
                desc: 'AI generates personalized MCQ + coding tests based on resume claims. Proctored with face detection and behavioral monitoring.',
                color: 'from-purple-500 to-violet-600',
              },
              {
                step: '03',
                icon: Target,
                title: 'Match & Hire',
                desc: 'Verified scores, league rankings, and skill-match analysis help recruiters find the best candidates — backed by real data.',
                color: 'from-pink-500 to-rose-600',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`stagger-child group glow-card relative rounded-3xl border p-8 transition-all hover:translate-y-[-6px] ${isDark
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-slate-200 bg-white shadow-sm hover:shadow-xl'
                }`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className={`text-6xl font-black tracking-tighter ${isDark ? 'text-white/[0.06]' : 'text-slate-100'} group-hover:text-indigo-500/20 transition-colors`}>
                    {item.step}
                  </span>
                  <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg pulse-ring`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 5 — ASSESSMENT TYPES                                 */}
      {/* ============================================================ */}
      <section className={`relative py-28 px-6 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="section-divider absolute top-0 left-0 right-0" />
        <div className="mx-auto max-w-6xl">
          <RevealGroup className="text-center mb-16">
            <p className="stagger-child text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">Assessment types</p>
            <h2 className={`stagger-child mt-4 text-4xl font-bold sm:text-5xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              More than just MCQs
            </h2>
            <p className={`stagger-child mx-auto mt-4 max-w-xl text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Multi-phase assessments that test real ability across different formats.
            </p>
          </RevealGroup>

          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Layers,
                title: 'Adaptive MCQs',
                desc: 'Questions auto-adjust difficulty based on candidate performance. No two tests are the same.',
                tag: 'Phase 1',
              },
              {
                icon: Code2,
                title: 'Coding Challenges',
                desc: 'Syntax correction, logic debugging, and function writing — personalized from resume data.',
                tag: 'Phase 2',
              },
              {
                icon: FileSearch,
                title: 'Resume Verification',
                desc: 'AI cross-references resume claims against exam performance. Exaggeration scores exposed.',
                tag: 'AI Engine',
              },
              {
                icon: Shield,
                title: 'Live Proctoring',
                desc: 'Face detection, gaze tracking, tab switch monitoring, and audio anomaly detection.',
                tag: 'Security',
              },
              {
                icon: TrendingUp,
                title: 'League Rankings',
                desc: 'Candidates ranked Bronze to Diamond based on verified ability scores. No self-reported skills.',
                tag: 'Ranking',
              },
              {
                icon: MousePointer2,
                title: 'Behavioral Analysis',
                desc: 'Typing dynamics, response timing, and copy-paste detection for cheat likelihood scoring.',
                tag: 'Anti-Cheat',
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`stagger-child glow-card rounded-3xl border p-7 transition-all hover:translate-y-[-4px] ${isDark
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-slate-200 bg-slate-50/50 hover:shadow-lg'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
                    <card.icon className="h-6 w-6 text-indigo-500" />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-white/5 text-slate-400 ring-1 ring-white/10' : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100'}`}>
                    {card.tag}
                  </span>
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{card.desc}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 6 — CTA                                              */}
      {/* ============================================================ */}
      <section className={`relative py-32 px-6 overflow-hidden ${isDark
        ? 'bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.12),_transparent_60%)] bg-slate-950'
        : 'bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.06),_transparent_60%)] bg-slate-50'
      }`}>
        <div className="section-divider absolute top-0 left-0 right-0" />
        <div className="mx-auto max-w-3xl text-center">
          <RevealGroup>
            <h2 className={`stagger-child text-4xl font-bold sm:text-5xl lg:text-6xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Ready to hire with <span className="gradient-text">certainty?</span>
            </h2>
            <p className={`stagger-child mx-auto mt-6 max-w-xl text-lg leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Join TalentLeague today. Whether you're a candidate looking to prove your skills or a recruiter searching for verified talent.
            </p>
          </RevealGroup>

          <RevealGroup className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="stagger-child group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-10 py-5 text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 transition-all hover:translate-y-[-2px] hover:shadow-indigo-500/40"
            >
              <UserRound className="h-5 w-5" />
              Sign up as Candidate
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate('/recruiter-signup')}
              className={`stagger-child group flex items-center gap-2 rounded-2xl border px-10 py-5 text-base font-semibold transition-all hover:translate-y-[-2px] ${isDark
                ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50 shadow-lg'
              }`}
            >
              <BriefcaseBusiness className="h-5 w-5" />
              Register as Recruiter
            </button>
          </RevealGroup>

          <RevealGroup className="mt-8">
            <button
              onClick={() => navigate('/login')}
              className={`stagger-child text-sm font-medium transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Already have an account? Sign in
            </button>
          </RevealGroup>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className={`py-12 px-6 ${isDark ? 'bg-slate-950 border-t border-white/5' : 'bg-white border-t border-slate-200'}`}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>TalentLeague</span>
          </div>
          <div className="flex items-center gap-8">
            {['Candidate Signup', 'Recruiter Signup', 'Sign In'].map((item) => (
              <button
                key={item}
                onClick={() => navigate(item === 'Sign In' ? '/login' : item.includes('Recruiter') ? '/recruiter-signup' : '/signup')}
                className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            &copy; {new Date().getFullYear()} TalentLeague. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
