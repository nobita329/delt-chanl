'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  FolderTree,
  Hash,
  ShieldAlert,
  History,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  currentGuildId?: string | null;
}

export function Sidebar({ currentGuildId }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const guildParam = searchParams.get('guildId') || currentGuildId;

  const buildHref = (path: string) => {
    return guildParam ? `${path}?guildId=${guildParam}` : path;
  };

  const navLinks = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Servers', href: '/dashboard/servers', icon: Server },
    { label: 'Categories', href: '/dashboard/categories', icon: FolderTree },
    { label: 'Channels', href: '/dashboard/channels', icon: Hash },
    { label: 'Permissions', href: '/dashboard/permissions', icon: ShieldAlert },
    { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: History },
    { label: 'Settings', href: '/dashboard/settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-discord-darker border-r border-discord-border flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-discord-border">
        <div className="w-9 h-9 rounded-xl bg-blurple flex items-center justify-center text-white shadow-lg shadow-blurple/20">
          <Hash className="w-5 h-5 font-bold" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">V-PANEL BOT</h1>
          <p className="text-[10px] text-discord-muted uppercase tracking-wider font-semibold">
            Server Manager
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-discord-muted">
          Management
        </div>

        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const targetUrl = buildHref(item.href);

          return (
            <a
              key={item.label}
              href={targetUrl}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blurple text-white font-semibold shadow-sm'
                  : 'text-discord-muted hover:text-discord-heading hover:bg-discord-surface'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-discord-muted'}`} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-discord-border bg-discord-darkest/30">
        <div className="rounded-lg bg-discord-surface/40 p-3 border border-discord-border/50 text-xs text-discord-muted">
          <div className="flex items-center justify-between text-discord-text font-semibold mb-1">
            <span>Bot Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
          <p className="text-[11px] text-discord-muted">discord.js v14 Gateway connected</p>
        </div>
      </div>
    </aside>
  );
}

