'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, ShieldCheck, Users, Hash, CheckCircle2, Sliders } from 'lucide-react';
import { RoleItem, ChannelItem } from '../../../lib/types';
import { api } from '../../../lib/api';
import { PermissionModal } from '../../../components/PermissionModal';
import { NotificationToast, ToastProps } from '../../../components/NotificationToast';

function PermissionsContent() {
  const searchParams = useSearchParams();
  const guildId = searchParams.get('guildId');

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(null);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  const showToast = (type: 'success' | 'warning' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!guildId) return;

    let mounted = true;
    Promise.all([api.getRoles(guildId), api.getChannels(guildId)])
      .then(([rolesRes, channelsRes]) => {
        if (!mounted) return;
        setRoles(rolesRes.roles);
        setChannels(channelsRes.channels);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        showToast('error', err.message || 'Failed to fetch roles');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [guildId]);

  const handleSavePermissions = async (data: any) => {
    if (!guildId || !selectedChannel) return;
    await api.setChannelPermission(guildId, selectedChannel.id, data);
    showToast('success', `Permissions updated for #${selectedChannel.name}`);
  };

  if (!guildId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-discord-muted">
        Select a server first to manage permissions.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <NotificationToast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>

      <div>
        <h1 className="text-2xl font-black text-white">Permissions & Roles</h1>
        <p className="text-sm text-discord-muted mt-1">
          Review server roles and configure channel permission overwrites.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading permissions...</span>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Roles Hierarchy Column */}
          <div className="lg:col-span-1 bg-discord-dark border border-discord-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blurple" />
              <h2 className="text-base font-bold text-white">Server Roles ({roles.length})</h2>
            </div>
            <p className="text-xs text-discord-muted">
              Higher positions possess greater administrative hierarchy in Discord.
            </p>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-discord-darkest/60 border border-discord-border/50 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: r.color === '#000000' ? '#949ba4' : r.color }}
                    />
                    <span className="font-bold text-discord-heading truncate">
                      {r.isEveryone ? '@everyone' : `@${r.name}`}
                    </span>
                  </div>

                  <span className="text-[11px] text-discord-muted font-mono shrink-0">
                    pos: {r.position}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Permission Overwrites Column */}
          <div className="lg:col-span-2 bg-discord-dark border border-discord-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Channel Permission Overwrites</h2>
            </div>
            <p className="text-xs text-discord-muted">
              Select any channel below to modify role access (View Channel, Send Messages, Connect).
            </p>

            <div className="grid sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {channels.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg bg-discord-darkest/60 border border-discord-border/50 flex items-center justify-between gap-3 hover:border-discord-hover transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Hash className="w-4 h-4 text-discord-muted shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-xs truncate">#{c.name}</div>
                      <div className="text-[10px] text-discord-muted truncate">
                        {c.parentName || 'Uncategorized'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedChannel(c);
                      setIsPermModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-md bg-discord-surface hover:bg-discord-hover text-white text-xs font-semibold shrink-0 transition-colors"
                  >
                    Configure
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedChannel && (
        <PermissionModal
          isOpen={isPermModalOpen}
          channel={selectedChannel}
          roles={roles}
          onClose={() => setIsPermModalOpen(false)}
          onSubmit={handleSavePermissions}
        />
      )}
    </div>
  );
}

export default function PermissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Permissions...</span>
        </div>
      }
    >
      <PermissionsContent />
    </Suspense>
  );
}
