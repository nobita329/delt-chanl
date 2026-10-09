'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Server, ExternalLink, ShieldCheck, Plus, Search, Crown } from 'lucide-react';
import { GuildItem } from '../../../lib/types';
import { api } from '../../../lib/api';

export default function ServersPage() {
  const router = useRouter();
  const [guilds, setGuilds] = useState<GuildItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .getGuilds()
      .then((res) => {
        if (mounted) {
          setGuilds(res.guilds);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = guilds.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Your Discord Servers</h1>
          <p className="text-sm text-discord-muted mt-1">
            Servers where you possess Manage Server or Administrator permissions.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-discord-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search servers..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-discord-dark border border-discord-border focus:border-blurple focus:outline-none text-white text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading server list...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-discord-dark border border-discord-border rounded-xl p-12 text-center">
          <Server className="w-12 h-12 text-discord-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-white mb-1">No Servers Found</h3>
          <p className="text-xs text-discord-muted">
            {search ? 'No servers match your search filter.' : 'You do not have Manage Server permissions in any server.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="bg-discord-dark border border-discord-border rounded-2xl p-6 flex flex-col justify-between hover:border-discord-hover transition-all shadow-md group"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  {g.icon ? (
                    <img
                      src={g.icon}
                      alt={g.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow border border-discord-border"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-blurple flex items-center justify-center text-white text-lg font-bold shadow">
                      {g.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {g.botPresent ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                      Needs Bot
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white truncate">{g.name}</h3>
                  {g.owner && (
                    <span title="Server Owner">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-discord-muted font-mono mb-4">ID: {g.id}</p>
              </div>

              <div className="pt-4 border-t border-discord-border/50">
                {g.botPresent ? (
                  <button
                    onClick={() => router.push(`/dashboard?guildId=${g.id}`)}
                    className="w-full py-2.5 rounded-lg bg-blurple hover:bg-blurple-hover active:bg-blurple text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Manage Server</span>
                  </button>
                ) : (
                  <a
                    href={g.inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-lg bg-discord-surface hover:bg-discord-hover border border-discord-border text-discord-text hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-blurple" />
                    <span>Invite Bot</span>
                    <ExternalLink className="w-3 h-3 text-discord-muted ml-0.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

