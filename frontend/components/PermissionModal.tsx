'use client';

import React, { useState } from 'react';
import { Shield, X, Check, Minus } from 'lucide-react';
import { RoleItem, ChannelItem } from '../lib/types';

interface PermissionModalProps {
  isOpen: boolean;
  channel: ChannelItem;
  roles: RoleItem[];
  onClose: () => void;
  onSubmit: (data: { targetId: string; allow: string[]; deny: string[] }) => Promise<void>;
}

export function PermissionModal({ isOpen, channel, roles, onClose, onSubmit }: PermissionModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const [permissions, setPermissions] = useState<Record<string, 'allow' | 'neutral' | 'deny'>>({
    ViewChannel: 'neutral',
    SendMessages: 'neutral',
    Connect: 'neutral',
    Speak: 'neutral',
    ManageChannels: 'neutral',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const permKeys = [
    { key: 'ViewChannel', label: 'View Channel', desc: 'Allows members to view this channel' },
    { key: 'SendMessages', label: 'Send Messages', desc: 'Allows members to send messages in text channels' },
    { key: 'Connect', label: 'Connect to Voice', desc: 'Allows members to connect to voice channels' },
    { key: 'Speak', label: 'Speak in Voice', desc: 'Allows members to talk in voice channels' },
    { key: 'ManageChannels', label: 'Manage Channel', desc: 'Allows members to edit channel settings' },
  ];

  const handleToggle = (key: string, state: 'allow' | 'neutral' | 'deny') => {
    setPermissions((prev) => ({ ...prev, [key]: state }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) {
      setError('Please select a target role');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const allow: string[] = [];
      const deny: string[] = [];

      Object.entries(permissions).forEach(([perm, state]) => {
        if (state === 'allow') allow.push(perm);
        if (state === 'deny') deny.push(perm);
      });

      await onSubmit({
        targetId: selectedRoleId,
        allow,
        deny,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-discord-dark border border-discord-border rounded-xl shadow-2xl p-6 text-discord-text">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blurple/10 text-blurple">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-discord-heading">
                Permissions: #{channel.name}
              </h3>
              <p className="text-xs text-discord-muted">
                Configure role access and permission overwrites
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-discord-muted hover:text-white hover:bg-discord-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-1.5">
              Target Role
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm transition-colors"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.isEveryone ? '@everyone' : `@${r.name}`}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted">
              Role Permissions
            </label>
            <div className="space-y-2 border border-discord-border rounded-lg p-3 bg-discord-darkest/40">
              {permKeys.map((p) => {
                const current = permissions[p.key] || 'neutral';
                return (
                  <div
                    key={p.key}
                    className="flex items-center justify-between py-2 border-b border-discord-border/40 last:border-0"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{p.label}</div>
                      <div className="text-[11px] text-discord-muted">{p.desc}</div>
                    </div>

                    <div className="flex items-center gap-1 bg-discord-surface p-1 rounded-lg border border-discord-border">
                      <button
                        type="button"
                        onClick={() => handleToggle(p.key, 'deny')}
                        className={`p-1.5 rounded transition-colors ${
                          current === 'deny'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-discord-muted hover:text-white'
                        }`}
                        title="Deny"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(p.key, 'neutral')}
                        className={`p-1.5 rounded transition-colors ${
                          current === 'neutral'
                            ? 'bg-discord-border text-white shadow-sm'
                            : 'text-discord-muted hover:text-white'
                        }`}
                        title="Neutral (Inherit)"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(p.key, 'allow')}
                        className={`p-1.5 rounded transition-colors ${
                          current === 'allow'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-discord-muted hover:text-white'
                        }`}
                        title="Allow"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-discord-muted hover:text-white hover:bg-discord-surface transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-blurple hover:bg-blurple-hover active:bg-blurple text-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Save Permissions
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

