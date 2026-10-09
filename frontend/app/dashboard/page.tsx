'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FolderTree,
  Hash,
  Volume2,
  Users,
  ShieldCheck,
  Rocket,
  Clock,
  PlusCircle,
  ExternalLink,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { GuildOverview, AuditLogItem } from '../../lib/types';
import { api } from '../../lib/api';

function DashboardOverviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guildId = searchParams.get('guildId');

  const [overview, setOverview] = useState<GuildOverview | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getGuildOverview(guildId),
      api.getAuditLogs(guildId, { limit: 5 }),
    ])
      .then(([overviewRes, logsRes]) => {
        if (!mounted) return;
        setOverview(overviewRes.overview);
        setRecentLogs(logsRes.logs);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [guildId]);

  if (!guildId) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-discord-surface flex items-center justify-center mx-auto mb-4 text-discord-muted">
          <FolderTree className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Server Selected</h2>
        <p className="text-sm text-discord-muted mb-6">
          Please select a server from the top menu or browse all accessible servers.
        </p>
        <button
          onClick={() => router.push('/dashboard/servers')}
          className="px-5 py-2.5 rounded-lg bg-blurple hover:bg-blurple-hover text-white text-sm font-semibold transition-colors"
        >
          View Servers
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
        <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Fetching server statistics...</span>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-discord-dark p-8 rounded-2xl border border-discord-border">
        <h3 className="text-lg font-bold text-rose-400 mb-2">Failed to load server</h3>
        <p className="text-sm text-discord-muted mb-6">{error || 'Server not found'}</p>
        <button
          onClick={() => router.push('/dashboard/servers')}
          className="px-5 py-2.5 rounded-lg bg-discord-surface hover:bg-discord-hover text-white text-sm font-semibold transition-colors"
        >
          Return to Servers
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Server Header Banner */}
      <div className="relative rounded-2xl bg-discord-dark border border-discord-border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          {overview.icon ? (
            <img
              src={overview.icon}
              alt={overview.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-discord-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blurple flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {overview.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-black text-white">{overview.name}</h1>
            <p className="text-xs text-discord-muted font-mono mt-0.5">ID: {overview.id}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-discord-muted">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-discord-muted" />
                {overview.memberCount} Members
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Bot Ready
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => router.push(`/dashboard/categories?guildId=${guildId}`)}
            className="px-4 py-2 rounded-lg bg-discord-surface hover:bg-discord-hover border border-discord-border text-discord-text hover:text-white text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <FolderTree className="w-4 h-4 text-blurple" />
            <span>Manage Categories</span>
          </button>
          <button
            onClick={() => router.push(`/dashboard/channels?guildId=${guildId}`)}
            className="px-4 py-2 rounded-lg bg-blurple hover:bg-blurple-hover active:bg-blurple text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-md shadow-blurple/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Channels</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-discord-dark border border-discord-border">
          <div className="flex items-center justify-between text-discord-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
            <FolderTree className="w-4 h-4 text-blurple" />
          </div>
          <div className="text-3xl font-black text-white">{overview.stats.categoryCount}</div>
          <div className="text-[11px] text-discord-muted mt-1">Organized sections</div>
        </div>

        <div className="p-5 rounded-xl bg-discord-dark border border-discord-border">
          <div className="flex items-center justify-between text-discord-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Text Channels</span>
            <Hash className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{overview.stats.textCount}</div>
          <div className="text-[11px] text-discord-muted mt-1">Chat & Announcements</div>
        </div>

        <div className="p-5 rounded-xl bg-discord-dark border border-discord-border">
          <div className="flex items-center justify-between text-discord-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Voice Channels</span>
            <Volume2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{overview.stats.voiceCount}</div>
          <div className="text-[11px] text-discord-muted mt-1">Audio & Stage rooms</div>
        </div>

        <div className="p-5 rounded-xl bg-discord-dark border border-discord-border">
          <div className="flex items-center justify-between text-discord-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Channels</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{overview.stats.totalChannels}</div>
          <div className="text-[11px] text-discord-muted mt-1">Across all categories</div>
        </div>
      </div>

      {/* Recent Management Activities */}
      <div className="bg-discord-dark border border-discord-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blurple" />
            <h2 className="text-base font-bold text-white">Recent Management Activity</h2>
          </div>
          <button
            onClick={() => router.push(`/dashboard/audit-logs?guildId=${guildId}`)}
            className="text-xs font-semibold text-blurple hover:text-blurple-light transition-colors flex items-center gap-1"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-discord-muted">
            No management actions recorded yet. Changes made via Web Panel or Bot will show up here.
          </div>
        ) : (
          <div className="divide-y divide-discord-border/50">
            {recentLogs.map((log) => {
              const isDelete = log.action.includes('DELETE');
              const isCreate = log.action.includes('CREATE');

              return (
                <div key={log.id} className="py-3.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${
                        isDelete
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : isCreate
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blurple/10 text-blurple border border-blurple/20'
                      }`}
                    >
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-white">
                      {log.targetName || log.targetId || 'Channel'}
                    </span>
                    <span className="text-xs text-discord-muted hidden sm:inline">
                      by <strong className="text-discord-text">{log.executorTag}</strong>
                    </span>
                  </div>

                  <span className="text-xs text-discord-muted">
                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Dashboard...</span>
        </div>
      }
    >
      <DashboardOverviewContent />
    </Suspense>
  );
}
