'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, ExternalLink } from 'lucide-react';
import { UserProfile, GuildItem } from '../lib/types';
import { ServerSelector } from './ServerSelector';
import { api } from '../lib/api';

interface NavbarProps {
  user: UserProfile | null;
  currentGuildId?: string;
  onGuildChange?: (guild: GuildItem) => void;
}

export function Navbar({ user, currentGuildId, onGuildChange }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  return (
    <header className="h-16 px-6 bg-discord-dark border-b border-discord-border flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <ServerSelector currentGuildId={currentGuildId} onGuildChange={onGuildChange} />
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-discord-surface/50 border border-discord-border/60 py-1.5 px-3 rounded-full">
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-xs font-semibold text-white">
                {user.globalName || user.username}
              </span>
              <span className="text-[10px] text-discord-muted hidden sm:inline">
                #{user.discriminator === '0' ? user.username : user.discriminator}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-discord-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <a
            href="http://localhost:5000/api/auth/login"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blurple hover:bg-blurple-hover text-white transition-colors"
          >
            Login with Discord
          </a>
        )}
      </div>
    </header>
  );
}

