import React, { useState } from 'react';
import type { FolderItem, BookmarkNode, BookmarkItem } from '../types';
import BookmarkList from './BookmarkList';
import { FolderIcon, ChevronRightIcon } from './Icons';

type VisibleFields = {
  url: boolean;
  tags: boolean;
  keyword: boolean;
  folder: boolean;
  dateAdded: boolean;
};

interface BookmarkFolderProps {
  folder: FolderItem;
  viewMode: 'grid' | 'list' | 'enhanced-list';
  zoomIndex: number;
  gridConfig: string;
  depth: number;
  visibleFields: VisibleFields;
  onEdit: (bookmark: BookmarkItem) => void;
  onDelete: (id: string) => void;
  onViewSafetyReport: (bookmark: BookmarkItem) => void;
  onHoverStart: (url: string, element: HTMLElement) => void;
  onHoverEnd: () => void;
}

const BookmarkFolder: React.FC<BookmarkFolderProps> = (props) => {
  const { folder, viewMode, depth } = props;
  const [isExpanded, setIsExpanded] = useState(true);
  const indentationStyle = { paddingLeft: `${depth * 1.5}rem` };

  return (
    <div className="w-full">
      <div 
        className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
        onClick={() => setIsExpanded(!isExpanded)}
        style={viewMode !== 'grid' ? indentationStyle : {}}
      >
        <ChevronRightIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        <FolderIcon className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3" />
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 truncate">{folder.title}</h2>
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-500">({folder.children.length})</span>
      </div>
      {isExpanded && (
        <div className="mt-2">
            <BookmarkList {...props} nodes={folder.children} depth={depth + 1} parentTitle={folder.title} />
        </div>
      )}
    </div>
  );
};

export default BookmarkFolder;