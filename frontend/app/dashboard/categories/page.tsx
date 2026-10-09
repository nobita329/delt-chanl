'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Hash,
  Volume2,
  ArrowUpDown,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { CategoryItem } from '../../../lib/types';
import { api } from '../../../lib/api';
import { CategoryModal } from '../../../components/CategoryModal';
import { ChannelModal } from '../../../components/ChannelModal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { NotificationToast, ToastProps } from '../../../components/NotificationToast';

function CategoriesContent() {
  const searchParams = useSearchParams();
  const guildId = searchParams.get('guildId');

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & Dialogs
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add channel to category modal
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [targetCategoryForChannel, setTargetCategoryForChannel] = useState<string | null>(null);

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

  const loadCategories = async () => {
    if (!guildId) return;
    try {
      const res = await api.getCategories(guildId);
      setCategories(res.categories);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [guildId]);

  const handleCreateOrEditCategory = async (data: { name: string; position?: number }) => {
    if (!guildId) return;
    if (editingCategory) {
      await api.editCategory(guildId, editingCategory.id, data);
      showToast('success', `Category "${data.name}" updated successfully!`);
    } else {
      await api.createCategory(guildId, data);
      showToast('success', `Category "${data.name}" created successfully!`);
    }
    await loadCategories();
  };

  const handleDeleteCategory = async () => {
    if (!guildId || !deletingCategory) return;
    try {
      setDeleteLoading(true);
      const childCount = deletingCategory.channels.length;
      await api.deleteCategory(guildId, deletingCategory.id, true);
      showToast('success', `Deleted category "${deletingCategory.name}" and ${childCount} channel(s)!`);
      setIsDeleteOpen(false);
      setDeletingCategory(null);
      await loadCategories();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete category');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateChannelInCategory = async (data: any) => {
    if (!guildId) return;
    await api.createChannel(guildId, {
      ...data,
      parentId: targetCategoryForChannel,
    });
    showToast('success', `Channel "#${data.name}" created!`);
    await loadCategories();
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!guildId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-discord-muted">
        Select a server first to manage categories.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast notifications container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <NotificationToast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Category Manager</h1>
          <p className="text-sm text-discord-muted mt-1">
            Organize sections and manage channels nested under each category.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-discord-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-discord-dark border border-discord-border focus:border-blurple focus:outline-none text-white text-xs"
            />
          </div>

          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-blurple hover:bg-blurple-hover active:bg-blurple text-white font-semibold text-xs transition-colors flex items-center gap-2 shrink-0 shadow-md shadow-blurple/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Categories Grid / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-discord-dark border border-discord-border rounded-xl p-12 text-center">
          <FolderTree className="w-12 h-12 text-discord-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-white mb-1">No Categories Found</h3>
          <p className="text-xs text-discord-muted mb-4">
            {search ? 'No categories matched your search.' : 'This server does not have any categories yet.'}
          </p>
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-blurple hover:bg-blurple-hover text-white text-xs font-semibold"
          >
            Create Your First Category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-discord-dark border border-discord-border rounded-xl overflow-hidden shadow-sm hover:border-discord-hover transition-colors"
            >
              {/* Category Header */}
              <div className="p-4 bg-discord-surface/30 border-b border-discord-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-blurple/10 text-blurple shrink-0">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white truncate uppercase tracking-wider">
                        {cat.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-discord-surface text-discord-muted">
                        Pos: {cat.position}
                      </span>
                    </div>
                    <span className="text-[11px] text-discord-muted font-mono">
                      ID: {cat.id} • {cat.channels.length} Channels
                    </span>
                  </div>
                </div>

                {/* Category Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setTargetCategoryForChannel(cat.id);
                      setIsChannelModalOpen(true);
                    }}
                    title="Add Channel to Category"
                    className="p-1.5 rounded-lg bg-discord-surface hover:bg-discord-hover text-discord-muted hover:text-white transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsCategoryModalOpen(true);
                    }}
                    title="Edit Category"
                    className="p-1.5 rounded-lg bg-discord-surface hover:bg-discord-hover text-discord-muted hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingCategory(cat);
                      setIsDeleteOpen(true);
                    }}
                    title="Delete Category"
                    className="p-1.5 rounded-lg bg-discord-surface hover:bg-rose-500/20 text-discord-muted hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Nested Channels List */}
              <div className="p-4">
                {cat.channels.length === 0 ? (
                  <div className="text-xs text-discord-muted py-2 italic flex items-center justify-between">
                    <span>No channels inside this category.</span>
                    <button
                      onClick={() => {
                        setTargetCategoryForChannel(cat.id);
                        setIsChannelModalOpen(true);
                      }}
                      className="text-blurple hover:underline text-xs not-italic font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Channel
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {cat.channels.map((ch) => {
                      const isVoice = ch.type === 2;
                      return (
                        <div
                          key={ch.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-discord-darkest/60 border border-discord-border/50 text-xs text-discord-text"
                        >
                          {isVoice ? (
                            <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <Hash className="w-4 h-4 text-discord-muted shrink-0" />
                          )}
                          <span className="font-medium truncate">{ch.name}</span>
                          <span className="text-[10px] text-discord-muted ml-auto font-mono">
                            #{ch.position}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Create/Edit Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCreateOrEditCategory}
      />

      {/* Quick Channel Create in Category Modal */}
      <ChannelModal
        isOpen={isChannelModalOpen}
        categories={categories}
        defaultCategoryId={targetCategoryForChannel}
        onClose={() => setIsChannelModalOpen(false)}
        onSubmit={handleCreateChannelInCategory}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Category & All Channels"
        message={`Are you sure you want to delete category "${deletingCategory?.name}"?\n⚠️ All ${deletingCategory?.channels.length || 0} channel(s) inside this category will also be permanently deleted!`}
        confirmLabel={`Delete Category & ${deletingCategory?.channels.length || 0} Channel(s)`}
        isLoading={deleteLoading}
        onConfirm={handleDeleteCategory}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Categories...</span>
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
