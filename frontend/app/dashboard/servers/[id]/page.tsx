'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ServerRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params?.id as string;

  useEffect(() => {
    if (serverId) {
      router.replace(`/dashboard?guildId=${serverId}`);
    } else {
      router.replace('/dashboard/servers');
    }
  }, [serverId, router]);

  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
      <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium">Navigating to server overview...</span>
    </div>
  );
}

