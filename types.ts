export interface Bookmark {
  id: string;
  title: string;
  url: string;
  dateAdded?: number;
  tags: string[];
  keyword?: string;
  parentId?: string;
  index?: number;
  status: 'unchecked' | 'checking' | 'live' | 'dead' | 'parked';
  safetyStatus: 'unknown' | 'checking' | 'safe' | 'unsafe';
}

// Represents a bookmark item in the tree
export interface BookmarkItem extends Bookmark {
  type: 'bookmark';
}

// Represents a folder in the tree
export interface FolderItem {
  type: 'folder';
  id: string;
  title: string;
  children: BookmarkNode[];
  dateAdded?: number;
  parentId?: string;
  index?: number;
}

// A node can be either a bookmark or a folder
export type BookmarkNode = BookmarkItem | FolderItem;