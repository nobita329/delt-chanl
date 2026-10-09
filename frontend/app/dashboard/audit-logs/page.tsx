'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { History, Search, Filter, ChevronLeft, ChevronRight, User, Terminal } from 'lucide-react';
import { AuditLogItem } from '../../../lib/types';
import { api } from '../../../lib/api';

function AuditLogsContent() {
  const searchParams = useSearchParams();
  const guildId = searchParams.get('guildId');

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    if (!guildId) return;
    setLoading(true);
    try {
      const res = await api.getAuditLogs(guildId, {
        page,
        limit: 15,
        action: actionFilter || undefined,
        search: search || undefined,
      });
      setLogs(res.logs);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [guildId, page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const getActionBadge = (action: string) => {
    if (action.includes('DELETE')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (action.includes('CREATE')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (action.includes('LOCK')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    return 'bg-blurple/10 text-blurple border-blurple/20';
  };

  if (!guildId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-discord-muted">
        Select a server first to view audit logs.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Management Audit Logs</h1>
        <p className="text-sm text-discord-muted mt-1">
          Complete, persistent activity log of server management actions performed via the Bot and Web Panel.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-discord-dark border border-discord-border rounded-xl p-4 flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-discord-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by target or executor..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-discord-muted" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-xs"
          >
            <option value="">All Actions</option>
            <option value="CHANNEL_CREATE">Channel Create</option>
            <option value="CHANNEL_DELETE">Channel Delete</option>
            <option value="CHANNEL_EDIT">Channel Edit</option>
            <option value="CHANNEL_CLONE">Channel Clone</option>
            <option value="CHANNEL_LOCK">Channel Lock</option>
            <option value="CHANNEL_UNLOCK">Channel Unlock</option>
            <option value="CATEGORY_CREATE">Category Create</option>
            <option value="CATEGORY_DELETE">Category Delete</option>
            <option value="CATEGORY_EDIT">Category Edit</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-4 py-1.5 rounded-lg bg-discord-surface hover:bg-discord-hover text-white text-xs font-semibold transition-colors"
        >
          Search
        </button>
      </form>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Fetching logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-discord-dark border border-discord-border rounded-xl p-12 text-center">
          <History className="w-12 h-12 text-discord-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-white mb-1">No Audit Logs Found</h3>
          <p className="text-xs text-discord-muted">
            {search || actionFilter
              ? 'No records match your active search filters.'
              : 'Audit actions will appear here as you manage channels and categories.'}
          </p>
        </div>
      ) : (
        <div className="bg-discord-dark border border-discord-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-discord-surface/40 text-discord-muted uppercase tracking-wider font-semibold border-b border-discord-border">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Executor</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-discord-border/50 text-discord-text">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-discord-surface/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-white">
                      {log.targetName || log.targetId || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-discord-muted" />
                        <span className="font-medium text-white">{log.executorTag}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-discord-surface text-discord-muted text-[10px] font-mono font-semibold">
                        {log.source}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-discord-muted">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="p-4 border-t border-discord-border flex items-center justify-between text-xs text-discord-muted">
            <span>
              Showing {logs.length} of {totalCount} total events
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-discord-surface hover:bg-discord-hover text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-discord-surface hover:bg-discord-hover text-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Audit Logs...</span>
        </div>
      }
    >
      <AuditLogsContent />
    </Suspense>
  );
}
