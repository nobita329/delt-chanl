'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Hash,
  Volume2,
  Megaphone,
  MessagesSquare,
  Plus,
  Search,
  Filter,
  Lock,
  Unlock,
  Copy,
  Edit2,
  Trash2,
  Shield,
  FolderTree,
} from 'lucide-react';
import { ChannelItem, CategoryItem, RoleItem } from '../../../lib/types';
import { api } from '../../../lib/api';
import { ChannelModal } from '../../../components/ChannelModal';
import { PermissionModal } from '../../../components/PermissionModal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { NotificationToast, ToastProps } from '../../../components/NotificationToast';

function ChannelsContent() {
  const searchParams = useSearchParams();
  const guildId = searchParams.get('guildId');

  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals & Dialogs
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState<ChannelItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Permissions Modal
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permChannel, setPermChannel] = useState<ChannelItem | null>(null);

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

  const loadData = async () => {
    if (!guildId) return;
    try {
      const [channelsRes, categoriesRes, rolesRes] = await Promise.all([
        api.getChannels(guildId),
        api.getCategories(guildId),
        api.getRoles(guildId),
      ]);
      setChannels(channelsRes.channels);
      setCategories(categoriesRes.categories);
      setRoles(rolesRes.roles);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load channel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [guildId]);

  const handleCreateOrEditChannel = async (data: any) => {
    if (!guildId) return;
    if (editingChannel) {
      await api.editChannel(guildId, editingChannel.id, data);
      showToast('success', `Channel #${data.name} updated!`);
    } else {
      await api.createChannel(guildId, data);
      showToast('success', `Channel #${data.name} created!`);
    }
    await loadData();
  };

  const handleDeleteChannel = async () => {
    if (!guildId || !deletingChannel) return;
    try {
      setDeleteLoading(true);
      await api.deleteChannel(guildId, deletingChannel.id);
      showToast('success', `Deleted #${deletingChannel.name}`);
      setIsDeleteOpen(false);
      setDeletingChannel(null);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete channel');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloneChannel = async (channel: ChannelItem) => {
    if (!guildId) return;
    try {
      await api.cloneChannel(guildId, channel.id);
      showToast('success', `Successfully cloned #${channel.name}`);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to clone channel');
    }
  };

  const handleToggleLock = async (channel: ChannelItem) => {
    if (!guildId) return;
    try {
      if (channel.isLocked) {
        await api.unlockChannel(guildId, channel.id);
        showToast('success', `Unlocked #${channel.name}`);
      } else {
        await api.lockChannel(guildId, channel.id, 'Locked via Discord Web Panel');
        showToast('warning', `Locked #${channel.name}`);
      }
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to toggle lock state');
    }
  };

  const handleSavePermissions = async (data: any) => {
    if (!guildId || !permChannel) return;
    await api.setChannelPermission(guildId, permChannel.id, data);
    showToast('success', `Permissions updated for #${permChannel.name}`);
    await loadData();
  };

  const filteredChannels = channels.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.topic && c.topic.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL'
        ? true
        : categoryFilter === 'UNCATEGORIZED'
        ? !c.parentId
        : c.parentId === categoryFilter;

    const matchesType =
      typeFilter === 'ALL'
        ? true
        : c.type.toString() === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  const getChannelIcon = (type: number) => {
    if (type === 2) return <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />;
    if (type === 5) return <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />;
    if (type === 15) return <MessagesSquare className="w-4 h-4 text-purple-400 shrink-0" />;
    return <Hash className="w-4 h-4 text-discord-muted shrink-0" />;
  };

  if (!guildId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-discord-muted">
        Select a server first to manage channels.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <NotificationToast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Channel Manager</h1>
          <p className="text-sm text-discord-muted mt-1">
            Create, edit, lock, and manage permissions across all text, voice, and announcement channels.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingChannel(null);
            setIsChannelModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-blurple hover:bg-blurple-hover active:bg-blurple text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-md shadow-blurple/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Channel</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-discord-dark border border-discord-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-discord-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-xs"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <FolderTree className="w-3.5 h-3.5 text-discord-muted" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="UNCATEGORIZED">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-discord-muted" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-xs"
          >
            <option value="ALL">All Types</option>
            <option value="0">Text Channels</option>
            <option value="2">Voice Channels</option>
            <option value="5">Announcement Channels</option>
            <option value="15">Forum Channels</option>
          </select>
        </div>
      </div>

      {/* Channels Table / List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading channels...</span>
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="bg-discord-dark border border-discord-border rounded-xl p-12 text-center">
          <Hash className="w-12 h-12 text-discord-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-white mb-1">No Channels Found</h3>
          <p className="text-xs text-discord-muted">
            {search || categoryFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'No channels match your active filters.'
              : 'This server has no channels yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-discord-dark border border-discord-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-discord-surface/40 text-discord-muted uppercase tracking-wider font-semibold border-b border-discord-border">
                <tr>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Properties</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-discord-border/50 text-discord-text">
                {filteredChannels.map((c) => (
                  <tr key={c.id} className="hover:bg-discord-surface/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {getChannelIcon(c.type)}
                        <div>
                          <div className="font-bold text-white text-sm">
                            {c.name}
                          </div>
                          {c.topic && (
                            <div className="text-[11px] text-discord-muted truncate max-w-xs mt-0.5">
                              {c.topic}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-discord-muted">
                      {c.parentName ? (
                        <span className="px-2 py-0.5 rounded bg-discord-surface text-discord-text text-[11px] font-medium">
                          {c.parentName}
                        </span>
                      ) : (
                        <span className="italic opacity-60">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-discord-muted">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {c.rateLimitPerUser > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                            Slowmode: {c.rateLimitPerUser}s
                          </span>
                        )}
                        {c.nsfw && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold">
                            NSFW
                          </span>
                        )}
                        {c.type === 2 && c.bitrate && (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold">
                            {c.bitrate / 1000}k
                          </span>
                        )}
                        {c.type === 2 && c.userLimit && c.userLimit > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-discord-surface text-discord-muted text-[10px] font-semibold">
                            Max {c.userLimit}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.isLocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                          <Unlock className="w-3 h-3" />
                          Open
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleLock(c)}
                          title={c.isLocked ? 'Unlock Channel' : 'Lock Channel'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.isLocked
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                              : 'bg-discord-surface text-discord-muted hover:text-white hover:bg-discord-hover'
                          }`}
                        >
                          {c.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleCloneChannel(c)}
                          title="Clone Channel"
                          className="p-1.5 rounded-lg bg-discord-surface hover:bg-discord-hover text-discord-muted hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setPermChannel(c);
                            setIsPermModalOpen(true);
                          }}
                          title="Manage Role Permissions"
                          className="p-1.5 rounded-lg bg-discord-surface hover:bg-discord-hover text-discord-muted hover:text-blurple transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingChannel(c);
                            setIsChannelModalOpen(true);
                          }}
                          title="Edit Channel"
                          className="p-1.5 rounded-lg bg-discord-surface hover:bg-discord-hover text-discord-muted hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setDeletingChannel(c);
                            setIsDeleteOpen(true);
                          }}
                          title="Delete Channel"
                          className="p-1.5 rounded-lg bg-discord-surface hover:bg-rose-500/20 text-discord-muted hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ChannelModal
        isOpen={isChannelModalOpen}
        channel={editingChannel}
        categories={categories}
        onClose={() => setIsChannelModalOpen(false)}
        onSubmit={handleCreateOrEditChannel}
      />

      {permChannel && (
        <PermissionModal
          isOpen={isPermModalOpen}
          channel={permChannel}
          roles={roles}
          onClose={() => setIsPermModalOpen(false)}
          onSubmit={handleSavePermissions}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Channel"
        message={`Are you sure you want to permanently delete #${deletingChannel?.name}?\nAll messages and uploaded media in this channel will be removed permanently.`}
        confirmLabel="Delete Channel"
        isLoading={deleteLoading}
        onConfirm={handleDeleteChannel}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}

export default function ChannelsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Channels...</span>
        </div>
      }
    >
      <ChannelsContent />
    </Suspense>
  );
}
