
export enum FileType {
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  SUBTITLE = 'SUBTITLE',
  UNKNOWN = 'UNKNOWN'
}

export type StorageLocation = 'LOCAL' | 'CLOUD';

export interface VideoMetadata {
  resolution: '4K' | '1080p' | '720p' | 'SD';
  codec: 'HEVC' | 'H.264' | 'AV1' | 'VP9';
  audioCodec?: 'AAC' | 'AC3' | 'DTS-HD' | 'FLAC';
  hdr?: boolean;
}

export interface CastMember {
  name: string;
  role: string;
  avatar?: string;
}

export interface MediaFile {
  id: string;
  file?: File; // Optional because fetched files won't have the File object immediately
  name: string;
  size: number;
  type: FileType;
  url: string;
  poster?: string; // URL for movie poster
  backdrop?: string; // URL for background fanart
  createdAt: number;
  aiDescription?: string;
  aiTags?: string[];
  duration?: string; // Display string (e.g. "2h 14m")
  totalDuration?: number; // In seconds
  lastPlayedPosition?: number; // In seconds
  storageLocation: StorageLocation;
  metadata?: VideoMetadata;
  isEncrypted?: boolean;

  // Cinema Metadata
  year?: number;
  director?: string;
  rating?: number; // 0-100 (Rotten Tomatoes style)
  cast?: CastMember[];
  plot?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: any;
}

export type ViewMode = 'GRID' | 'LIST' | 'POSTER';

export type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'SIZE_DESC';

export interface AIAnalysisResult {
  description: string;
  tags: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  avatar?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  service: string;
  message: string;
}

export interface Notification {
  id: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
}

export interface SystemStats {
  cpuUsage: number;
  cpuModel?: string;
  ramUsage: number;
  ramTotal: number;
  storageLocalUsed: number;
  storageLocalTotal: number;
  storageCloudUsed: number;
  storageCloudTotal: number;
  uptime: number;
}
