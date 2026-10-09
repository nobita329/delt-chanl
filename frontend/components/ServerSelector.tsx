'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, Plus, Shield } from 'lucide-react';
import { GuildItem } from '../lib/types';
import { api } from '../lib/api';

interface ServerSelectorProps {
  currentGuildId?: string;
  onGuildChange?: (guild: GuildItem) => void;
}

export function ServerSelector({ currentGuildId, onGuildChange }: ServerSelectorProps) {
  const router = useRouter();
  const [guilds, setGuilds] = useState<GuildItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentGuild = guilds.find((g) => g.id === currentGuildId);

  const handleSelectGuild = (guild: GuildItem) => {
    if (!guild.botPresent) {
      window.open(guild.inviteUrl, '_blank');
      return;
    }

    if (onGuildChange) {
      onGuildChange(guild);
    } else {
      router.push(`/dashboard?guildId=${guild.id}`);
    }
    setIsOpen(false);
  };

  const renderIcon = (guild: GuildItem) => {
    if (guild.icon) {
      return (
        <img
          src={guild.icon}
          alt={guild.name}
          className="w-7 h-7 rounded-full object-cover shrink-0"
        />
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-blurple flex items-center justify-center text-white text-xs font-bold shrink-0">
        {guild.name.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-discord-dark hover:bg-discord-surface border border-discord-border text-discord-text hover:text-white transition-colors"
      >
        {currentGuild ? (
          <>
            {renderIcon(currentGuild)}
            <span className="text-sm font-semibold truncate max-w-[140px] sm:max-w-[200px]">
              {currentGuild.name}
            </span>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full bg-discord-surface flex items-center justify-center text-discord-muted">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-discord-muted">Select Server</span>
          </>
        )}
        <ChevronDown className="w-4 h-4 text-discord-muted shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-discord-dark border border-discord-border rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in duration-150">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-discord-muted border-b border-discord-border/50">
            Your Servers ({guilds.length})
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {guilds.map((g) => {
              const isSelected = g.id === currentGuildId;
              return (
                <button
                  key={g.id}
                  onClick={() => handleSelectGuild(g)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-discord-surface transition-colors ${
                    isSelected ? 'bg-discord-surface/50 text-white' : 'text-discord-text'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    {renderIcon(g)}
                    <div className="truncate">
                      <div className="text-sm font-medium truncate">{g.name}</div>
                      <div className="text-[11px] text-discord-muted">
                        {g.botPresent ? (
                          <span className="text-emerald-400">● Bot Connected</span>
                        ) : (
                          <span className="text-amber-400">Click to Invite Bot</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-blurple shrink-0" />}
                </button>
              );
            })}

            {guilds.length === 0 && !loading && (
              <div className="p-4 text-center text-xs text-discord-muted">
                No servers with Manage Guild permission found.
              </div>
            )}
          </div>

          <div className="p-2 border-t border-discord-border/50 bg-discord-darkest/40">
            <button
              onClick={() => router.push('/dashboard/servers')}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold text-discord-text hover:text-white hover:bg-discord-surface transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Manage All Servers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

