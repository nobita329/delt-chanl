'use client';

import React, { useState, useEffect } from 'react';
import { Hash, Volume2, Megaphone, MessagesSquare, X, PlusCircle, Edit3 } from 'lucide-react';
import { ChannelItem, CategoryItem } from '../lib/types';

interface ChannelModalProps {
  isOpen: boolean;
  channel?: ChannelItem | null;
  categories: CategoryItem[];
  defaultCategoryId?: string | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function ChannelModal({
  isOpen,
  channel,
  categories,
  defaultCategoryId,
  onClose,
  onSubmit,
}: ChannelModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<number>(0); // 0 = Text, 2 = Voice, 5 = Announcement, 15 = Forum
  const [parentId, setParentId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [slowmode, setSlowmode] = useState<number>(0);
  const [nsfw, setNsfw] = useState(false);
  const [bitrate, setBitrate] = useState<number>(64000);
  const [userLimit, setUserLimit] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (channel) {
      setName(channel.name);
      setType(channel.type);
      setParentId(channel.parentId || '');
      setTopic(channel.topic || '');
      setSlowmode(channel.rateLimitPerUser || 0);
      setNsfw(channel.nsfw || false);
      setBitrate(channel.bitrate || 64000);
      setUserLimit(channel.userLimit || 0);
    } else {
      setName('');
      setType(0);
      setParentId(defaultCategoryId || '');
      setTopic('');
      setSlowmode(0);
      setNsfw(false);
      setBitrate(64000);
      setUserLimit(0);
    }
    setError('');
  }, [channel, defaultCategoryId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload: any = {
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        parentId: parentId || null,
        topic: topic.trim() || null,
        slowmode: Number(slowmode),
        nsfw,
      };

      if (!channel) {
        payload.type = Number(type);
      }

      if (type === 2) {
        payload.bitrate = Number(bitrate);
        payload.userLimit = Number(userLimit);
      }

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save channel');
    } finally {
      setLoading(false);
    }
  };

  const channelTypes = [
    { type: 0, label: 'Text', desc: 'Post messages, images, memes', icon: Hash },
    { type: 2, label: 'Voice', desc: 'Hang out together with voice and video', icon: Volume2 },
    { type: 5, label: 'Announcement', desc: 'Post notices to follow across servers', icon: Megaphone },
    { type: 15, label: 'Forum', desc: 'Organized discussions with threads', icon: MessagesSquare },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-discord-dark border border-discord-border rounded-xl shadow-2xl p-6 text-discord-text max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blurple/10 text-blurple">
              {channel ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-discord-heading">
                {channel ? `Edit #${channel.name}` : 'Create Channel'}
              </h3>
              <p className="text-xs text-discord-muted">
                {channel ? 'Modify channel settings and properties' : 'Configure a new server channel'}
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
          {/* Channel Type Selector (Create mode only) */}
          {!channel && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-2">
                Channel Type
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {channelTypes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.type;
                  return (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setType(t.type)}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-blurple bg-blurple/10 text-white'
                          : 'border-discord-border bg-discord-darkest/50 text-discord-muted hover:bg-discord-surface hover:text-discord-text'
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-blurple' : 'text-discord-muted'}`} />
                      <div>
                        <div className="text-sm font-semibold">{t.label}</div>
                        <div className="text-[11px] opacity-75">{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-1.5">
              Channel Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-discord-muted text-sm font-semibold">#</span>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="general-chat"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm transition-colors"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-1.5">
              Category
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm transition-colors"
            >
              <option value="">No Category (Uncategorized)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  📁 {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Topic */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-1.5">
              Channel Topic (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={1024}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm transition-colors resize-none"
            />
          </div>

          {/* Text Channel Settings: Slowmode & NSFW */}
          {(type === 0 || type === 5) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-1.5">
                  Slowmode Delay
                </label>
                <select
                  value={slowmode}
                  onChange={(e) => setSlowmode(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm transition-colors"
                >
                  <option value={0}>Off</option>
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                  <option value={3600}>1 hour</option>
                  <option value={21600}>6 hours</option>
                </select>
              </div>

              <div className="flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nsfw}
                    onChange={(e) => setNsfw(e.target.checked)}
                    className="w-4 h-4 rounded text-blurple focus:ring-0 bg-discord-darkest border-discord-border"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-discord-muted">
                    Age-Restricted (NSFW)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Voice Channel Settings: Bitrate & User Limit */}
          {type === 2 && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-1.5">
                  Bitrate (kbps)
                </label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm transition-colors"
                >
                  <option value={64000}>64 kbps (Standard)</option>
                  <option value={96000}>96 kbps (High)</option>
                  <option value={128000}>128 kbps (Tier 1)</option>
                  <option value={256000}>256 kbps (Tier 2)</option>
                  <option value={384000}>384 kbps (Tier 3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-1.5">
                  User Limit
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={userLimit}
                  onChange={(e) => setUserLimit(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  placeholder="0 for infinite"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm transition-colors"
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-discord-border">
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
              {channel ? 'Save Channel' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

