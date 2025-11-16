import React from 'react';
import type { BookmarkNode, BookmarkItem, FolderItem } from '../types';
import BookmarkCard from './BookmarkCard';
import BookmarkFolder from './BookmarkFolder';

type VisibleFields = {
  url: boolean;
  tags: boolean;
  keyword: boolean;
  folder: boolean;
  dateAdded: boolean;
};

interface BookmarkListProps {
  nodes: BookmarkNode[];
  viewMode: 'grid' | 'list' | 'enhanced-list';
  zoomIndex: number;
  gridConfig: string;
  visibleFields: VisibleFields;
  depth?: number;
  parentTitle?: string;
  onEdit: (bookmark: BookmarkItem) => void;
  onDelete: (id: string) => void;
  onViewSafetyReport: (bookmark: BookmarkItem) => void;
  onHoverStart: (url: string, element: HTMLElement) => void;
  onHoverEnd: () => void;
}

const BookmarkList: React.FC<BookmarkListProps> = (props) => {
  const { nodes, viewMode, gridConfig, depth = 0 } = props;

  if (nodes.length === 0) {
      if (depth === 0) { // Only show the main message at the top level
          return (
              <div className="text-center py-10 text-slate-600 dark:text-slate-500">
                  <p>No bookmarks found matching your criteria.</p>
              </div>
          );
      }
      return null; // Don't render anything for empty folders
  }
  
  // Special rendering logic for grid view to handle folders correctly
  if (viewMode === 'grid') {
    const folders = nodes.filter(node => node.type === 'folder') as FolderItem[];
    const bookmarks = nodes.filter(node => node.type === 'bookmark') as BookmarkItem[];
    
    return (
      <div className="flex flex-col gap-6">
        {/* Render all folders first, each taking full width */}
        {folders.map(folder => (
            <BookmarkFolder key={folder.id} {...props} folder={folder} depth={depth} />
        ))}
        {/* Then render all bookmarks in a grid below the folders */}
        {bookmarks.length > 0 && (
            <div className={`grid ${gridConfig} gap-6`}>
                {bookmarks.map(bookmark => (
                    <BookmarkCard
                        key={bookmark.id}
                        {...props}
                        bookmark={bookmark}
                        depth={depth}
                        parentTitle={props.parentTitle}
                        onEdit={() => props.onEdit(bookmark)}
                        onDelete={() => props.onDelete(bookmark.id)}
                        onViewSafetyReport={() => props.onViewSafetyReport(bookmark)}
                        onHoverStart={(e) => props.onHoverStart(bookmark.url, e.currentTarget)}
                        onHoverEnd={props.onHoverEnd}
                    />
                ))}
            </div>
        )}
      </div>
    );
  }

  // Default rendering for list and enhanced-list views
  const containerClasses = `flex flex-col ${depth > 0 ? 'gap-2' : 'gap-3'}`;

  return (
    <div className={containerClasses}>
      {nodes.map(node => {
        if (node.type === 'folder') {
          return <BookmarkFolder key={node.id} {...props} folder={node} depth={depth} />;
        }
        if (node.type === 'bookmark') {
          return (
            <BookmarkCard
              key={node.id}
              {...props}
              bookmark={node}
              depth={depth}
              parentTitle={props.parentTitle}
              onEdit={() => props.onEdit(node)}
              onDelete={() => props.onDelete(node.id)}
              onViewSafetyReport={() => props.onViewSafetyReport(node)}
              onHoverStart={(e) => props.onHoverStart(node.url, e.currentTarget)}
              onHoverEnd={props.onHoverEnd}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default BookmarkList;