'use client';

import React, { useState, useEffect } from 'react';
import { FolderPlus, Edit3, X } from 'lucide-react';
import { CategoryItem } from '../lib/types';

interface CategoryModalProps {
  isOpen: boolean;
  category?: CategoryItem | null;
  onClose: () => void;
  onSubmit: (data: { name: string; position?: number }) => Promise<void>;
}

export function CategoryModal({ isOpen, category, onClose, onSubmit }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setPosition(category.position);
    } else {
      setName('');
      setPosition('');
    }
    setError('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        name: name.trim(),
        position: position === '' ? undefined : Number(position),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-discord-dark border border-discord-border rounded-xl shadow-2xl p-6 text-discord-text">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blurple/10 text-blurple">
              {category ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-discord-heading">
                {category ? 'Edit Category' : 'Create Category'}
              </h3>
              <p className="text-xs text-discord-muted">
                {category ? 'Update category properties' : 'Add a new category to group channels'}
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
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TEXT CHANNELS, COMMUNITY"
              className="w-full px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-discord-muted mb-1.5">
              Position Order (Optional)
            </label>
            <input
              type="number"
              min={0}
              value={position}
              onChange={(e) => setPosition(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="Leave empty for default position"
              className="w-full px-3.5 py-2.5 rounded-lg bg-discord-darkest border border-discord-border focus:border-blurple focus:outline-none text-white text-sm transition-colors"
            />
            <p className="text-[11px] text-discord-muted mt-1">
              Lower numbers appear higher in the channel sidebar.
            </p>
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
              {category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

