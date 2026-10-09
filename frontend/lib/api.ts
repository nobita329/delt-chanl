import {
  UserProfile,
  GuildItem,
  GuildOverview,
  CategoryItem,
  ChannelItem,
  RoleItem,
  PermissionOverwrite,
  AuditLogItem,
  GuildSettings,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  getMe: () => request<{ user: UserProfile }>('/auth/user'),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  // Guilds
  getGuilds: () => request<{ guilds: GuildItem[] }>('/guilds'),
  getGuildOverview: (guildId: string) => request<{ overview: GuildOverview }>(`/guilds/${guildId}`),

  // Categories
  getCategories: (guildId: string) =>
    request<{ categories: CategoryItem[] }>(`/guilds/${guildId}/categories`),
  createCategory: (guildId: string, data: { name: string; position?: number }) =>
    request<{ category: CategoryItem }>(`/guilds/${guildId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  editCategory: (guildId: string, categoryId: string, data: { name?: string; position?: number }) =>
    request<{ category: CategoryItem }>(`/guilds/${guildId}/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (guildId: string, categoryId: string, deleteChannels: boolean = true) =>
    request<{ success: boolean; deletedChannels?: string[] }>(
      `/guilds/${guildId}/categories/${categoryId}?deleteChannels=${deleteChannels}`,
      {
        method: 'DELETE',
      }
    ),
  moveCategory: (guildId: string, categoryId: string, position: number) =>
    request<{ category: CategoryItem }>(`/guilds/${guildId}/categories/${categoryId}/move`, {
      method: 'POST',
      body: JSON.stringify({ position }),
    }),

  // Channels
  getChannels: (guildId: string) =>
    request<{ channels: ChannelItem[] }>(`/guilds/${guildId}/channels`),
  createChannel: (
    guildId: string,
    data: {
      name: string;
      type: number;
      parentId?: string | null;
      topic?: string;
      slowmode?: number;
      nsfw?: boolean;
      bitrate?: number;
      userLimit?: number;
    }
  ) =>
    request<{ channel: ChannelItem }>(`/guilds/${guildId}/channels`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  editChannel: (
    guildId: string,
    channelId: string,
    data: {
      name?: string;
      topic?: string | null;
      parentId?: string | null;
      slowmode?: number;
      nsfw?: boolean;
      position?: number;
      bitrate?: number;
      userLimit?: number;
    }
  ) =>
    request<{ channel: ChannelItem }>(`/guilds/${guildId}/channels/${channelId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteChannel: (guildId: string, channelId: string) =>
    request<{ success: boolean }>(`/guilds/${guildId}/channels/${channelId}`, {
      method: 'DELETE',
    }),
  cloneChannel: (guildId: string, channelId: string, name?: string) =>
    request<{ channel: ChannelItem }>(`/guilds/${guildId}/channels/${channelId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  moveChannel: (guildId: string, channelId: string, data: { position?: number; parentId?: string | null }) =>
    request<{ success: boolean }>(`/guilds/${guildId}/channels/${channelId}/move`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  lockChannel: (guildId: string, channelId: string, reason?: string) =>
    request<{ success: boolean; channelId: string; isLocked: boolean }>(
      `/guilds/${guildId}/channels/${channelId}/lock`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    ),
  unlockChannel: (guildId: string, channelId: string) =>
    request<{ success: boolean; channelId: string; isLocked: boolean }>(
      `/guilds/${guildId}/channels/${channelId}/unlock`,
      { method: 'POST' }
    ),

  // Permissions & Roles
  getRoles: (guildId: string) =>
    request<{ roles: RoleItem[] }>(`/guilds/${guildId}/permissions/roles`),
  getChannelPermissions: (guildId: string, channelId: string) =>
    request<{ overwrites: PermissionOverwrite[] }>(
      `/guilds/${guildId}/permissions/channels/${channelId}`
    ),
  setChannelPermission: (
    guildId: string,
    channelId: string,
    data: { targetId: string; allow: string[]; deny: string[] }
  ) =>
    request<{ success: boolean }>(`/guilds/${guildId}/permissions/channels/${channelId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Audit Logs
  getAuditLogs: (guildId: string, params: { page?: number; limit?: number; action?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', params.page.toString());
    if (params.limit) q.set('limit', params.limit.toString());
    if (params.action) q.set('action', params.action);
    if (params.search) q.set('search', params.search);
    return request<{ logs: AuditLogItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/guilds/${guildId}/audit-logs?${q.toString()}`
    );
  },

  // Settings
  getSettings: (guildId: string) =>
    request<{ settings: GuildSettings }>(`/guilds/${guildId}/settings`),
  updateSettings: (guildId: string, data: Partial<GuildSettings>) =>
    request<{ settings: GuildSettings }>(`/guilds/${guildId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

