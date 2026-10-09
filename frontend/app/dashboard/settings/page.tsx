'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sliders, Save, CheckCircle2, Shield, Hash, Bell } from 'lucide-react';
import { GuildSettings, ChannelItem, RoleItem } from '../../../lib/types';
import { api } from '../../../lib/api';
import { NotificationToast, ToastProps } from '../../../components/NotificationToast';

function SettingsContent() {
  const searchParams = useSearchParams();
  const guildId = searchParams.get('guildId');

  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [logChannelId, setLogChannelId] = useState<string>('');
  const [managerRoleId, setManagerRoleId] = useState<string>('');
  const [auditLogEnabled, setAuditLogEnabled] = useState<boolean>(true);

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
    Promise.all([
      api.getSettings(guildId),
      api.getChannels(guildId),
      api.getRoles(guildId),
    ])
      .then(([settingsRes, channelsRes, rolesRes]) => {
        if (!mounted) return;
        setSettings(settingsRes.settings);
        setChannels(channelsRes.channels.filter((c) => c.type === 0 || c.type === 5));
        setRoles(rolesRes.roles.filter((r) => !r.isEveryone));

        setLogChannelId(settingsRes.settings.logChannelId || '');
        setManagerRoleId(settingsRes.settings.managerRoleId || '');
        setAuditLogEnabled(settingsRes.settings.auditLogEnabled);

        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        showToast('error', err.message || 'Failed to load settings');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [guildId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildId) return;

    try {
      setSaving(true);
      await api.updateSettings(guildId, {
        logChannelId: logChannelId || null,
        managerRoleId: managerRoleId || null,
        auditLogEnabled,
      });
      showToast('success', 'Server configuration saved successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!guildId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-discord-muted">
        Select a server first to configure settings.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <NotificationToast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>

      <div>
        <h1 className="text-2xl font-black text-white">Bot & Server Settings</h1>
        <p className="text-sm text-discord-muted mt-1">
          Configure server-specific logging channels, manager roles, and notification features.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Audit Logging Channel */}
          <div className="bg-discord-dark border border-discord-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-blurple" />
              <div>
                <h3 className="text-base font-bold text-white">Discord Audit Log Channel</h3>
                <p className="text-xs text-discord-muted">
                  Bot will send rich embeds for channel and category changes to this channel.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-2">
                Log Channel
              </label>
              <select
                value={logChannelId}
                onChange={(e) => setLogChannelId(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm"
              >
                <option value="">None (Disabled)</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name} {c.parentName ? `(${c.parentName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={auditLogEnabled}
                  onChange={(e) => setAuditLogEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blurple focus:ring-0 bg-discord-darkest border-discord-border"
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-discord-text">
                  Enable Audit Logging to Discord Channel
                </span>
              </label>
            </div>
          </div>

          {/* Manager Role */}
          <div className="bg-discord-dark border border-discord-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">Authorized Manager Role</h3>
                <p className="text-xs text-discord-muted">
                  Members with this role can run bot commands even without full administrator status.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-2">
                Manager Role
              </label>
              <select
                value={managerRoleId}
                onChange={(e) => setManagerRoleId(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm"
              >
                <option value="">Default (Administrators Only)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    @{r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-blurple hover:bg-blurple-hover active:bg-blurple text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-blurple/20 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Settings...</span>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
