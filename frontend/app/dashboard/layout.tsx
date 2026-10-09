'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { UserProfile, GuildItem } from '../../lib/types';
import { api } from '../../lib/api';

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guildParam = searchParams.get('guildId');

  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentGuildId, setCurrentGuildId] = useState<string | undefined>(guildParam || undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const { user: userData } = await api.getMe();
        if (!mounted) return;
        setUser(userData);

        // Fetch accessible guilds
        const { guilds } = await api.getGuilds();
        if (!mounted) return;

        // If no guild in query, select first bot-connected guild or first guild
        if (!guildParam && guilds.length > 0) {
          const firstWithBot = guilds.find((g) => g.botPresent) || guilds[0];
          setCurrentGuildId(firstWithBot.id);
        } else if (guildParam) {
          setCurrentGuildId(guildParam);
        }

        setLoading(false);
      } catch (err) {
        if (mounted) {
          router.push('/login');
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [router, guildParam]);

  const handleGuildChange = (guild: GuildItem) => {
    setCurrentGuildId(guild.id);
    router.push(`/dashboard?guildId=${guild.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darkest flex">
      <Sidebar currentGuildId={currentGuildId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          user={user}
          currentGuildId={currentGuildId}
          onGuildChange={handleGuildChange}
        />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
