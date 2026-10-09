import React from 'react';
import Link from 'next/link';
import {
  Hash,
  Shield,
  Layers,
  Lock,
  History,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Bot,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const backendLoginUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/auth/login`
    : 'http://localhost:5000/api/auth/login';

  return (
    <div className="min-h-screen bg-discord-darkest text-discord-text flex flex-col selection:bg-blurple selection:text-white">
      {/* Navbar */}
      <header className="border-b border-discord-border/60 bg-discord-dark/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blurple flex items-center justify-center text-white shadow-md shadow-blurple/30">
              <Hash className="w-5 h-5 font-bold" />
            </div>
            <span className="font-extrabold text-white text-base tracking-wide">
              DISCORD SERVER MANAGER
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-discord-heading hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <a
              href={backendLoginUrl}
              className="px-4 py-2 rounded-lg bg-blurple hover:bg-blurple-hover active:bg-blurple text-white text-sm font-semibold transition-all shadow-md shadow-blurple/20 flex items-center gap-2"
            >
              <span>Connect Discord</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 max-w-7xl mx-auto flex-1 flex flex-col justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blurple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-discord-surface/80 border border-discord-border text-xs font-semibold text-blurple">
            <Zap className="w-3.5 h-3.5 text-blurple" />
            <span>discord.js v14 & Next.js Real-Time Management Panel</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Manage Discord Servers <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blurple to-indigo-400">
              Visually & Seamlessly.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-discord-muted leading-relaxed max-w-2xl mx-auto">
            Organize categories, configure channels, lock spam, duplicate layouts, and track
            every administrative modification with persistent SQLite audit logging.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={backendLoginUrl}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blurple hover:bg-blurple-hover active:bg-blurple text-white font-bold text-base transition-all shadow-lg shadow-blurple/25 flex items-center justify-center gap-2.5"
            >
              <span>Login with Discord</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-discord-surface hover:bg-discord-hover active:bg-discord-dark border border-discord-border text-white font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              <span>Open Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 relative z-10">
          <div className="p-6 rounded-2xl bg-discord-dark/70 border border-discord-border/80 hover:border-blurple/40 transition-colors shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-blurple/10 text-blurple flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Category Architecture</h3>
            <p className="text-sm text-discord-muted leading-relaxed">
              Create, reorder, and configure categories with full nested channel inspection and bulk
              reorganization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-discord-dark/70 border border-discord-border/80 hover:border-blurple/40 transition-colors shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Channel Lockdown & Control</h3>
            <p className="text-sm text-discord-muted leading-relaxed">
              Instantly lock or restore permissions on text and voice channels during raids or announcements
              in one click.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-discord-dark/70 border border-discord-border/80 hover:border-blurple/40 transition-colors shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tamper-Proof Audit Trail</h3>
            <p className="text-sm text-discord-muted leading-relaxed">
              SQLite persistent audit log storage records every channel creation, modification, and deletion
              with executor metadata.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-discord-border/60 py-8 px-6 text-center text-xs text-discord-muted">
        <p>© 2026 Discord Server Manager Suite • Production Ready</p>
      </footer>
    </div>
  );
}

