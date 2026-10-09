export interface UserProfile {
  id: string;
  username: string;
  discriminator: string;
  globalName?: string;
  avatar?: string;
  avatarUrl: string;
}

export interface GuildItem {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  botPresent: boolean;
  inviteUrl: string;
}

export interface GuildOverview {
  id: string;
  name: string;
  icon: string | null;
  banner: string | null;
  memberCount: number;
  ownerId: string;
  botPermissions: {
    canManage: boolean;
    missing: string[];
    hasAdmin: boolean;
  };
  stats: {
    totalChannels: number;
    categoryCount: number;
    textCount: number;
    voiceCount: number;
    announcementCount: number;
    forumCount: number;
    roleCount: number;
  };
}

export interface CategoryItem {
  id: string;
  name: string;
  position: number;
  rawPosition: number;
  channels: {
    id: string;
    name: string;
    type: number;
    typeName: string;
    position: number;
  }[];
}

export interface ChannelItem {
  id: string;
  name: string;
  type: number;
  typeName: string;
  parentId: string | null;
  parentName: string | null;
  position: number;
  topic: string | null;
  nsfw: boolean;
  rateLimitPerUser: number;
  bitrate: number | null;
  userLimit: number | null;
  isLocked: boolean;
}

export interface RoleItem {
  id: string;
  name: string;
  color: string;
  position: number;
  isEveryone: boolean;
  memberCount: number;
}

export interface PermissionOverwrite {
  id: string;
  type: 'role' | 'member';
  name: string;
  allow: string[];
  deny: string[];
}

export interface AuditLogItem {
  id: string;
  guildId: string;
  action: string;
  targetId: string | null;
  targetName: string | null;
  executorId: string;
  executorTag: string;
  source: 'WEB_PANEL' | 'DISCORD_BOT';
  details: string | null;
  createdAt: string;
}

export interface GuildSettings {
  guildId: string;
  prefix: string;
  logChannelId: string | null;
  managerRoleId: string | null;
  auditLogEnabled: boolean;
}

