import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { BookmarkNode, BookmarkItem, Bookmark } from './types';
import { getAllBookmarks, updateBookmark, deleteBookmark, checkLinkStatus, checkLinkSafety } from './services/bookmarkService';
import EditModal from './components/EditModal';
import SitePreview from './components/SitePreview';
import BookmarkList from './components/BookmarkList';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import VirusTotalModal from './components/VirusTotalModal';
import UndoToast from './components/UndoToast';
import { SearchIcon, LoaderIcon, GridIcon, ListIcon, ZoomInIcon, ZoomOutIcon, EnhancedListIcon, FilterIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, ShieldAlertIcon, XIcon, MenuIcon, SunIcon, MoonIcon, ColumnsIcon } from './components/Icons';


const gridClassMap: { [key: number]: string } = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
};
const columnOptions = Object.keys(gridClassMap).map(Number);
const listZoomLevels = 4;

type FilterType = 'live' | 'dead' | 'safe' | 'unsafe';
type VisibleField = 'url' | 'tags' | 'keyword' | 'folder' | 'dateAdded';
type Theme = 'light' | 'dark';


export default function App() {
  const [bookmarkTree, setBookmarkTree] = useState<BookmarkNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<BookmarkItem | null>(null);
  const [viewingSafetyReport, setViewingSafetyReport] = useState<BookmarkItem | null>(null);
  const [undoableDeletion, setUndoableDeletion] = useState<BookmarkItem | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'enhanced-list'>('grid');
  const [zoomIndex, setZoomIndex] = useState(1);
  const [gridColumnCount, setGridColumnCount] = useState(5);
  const [hoveredBookmark, setHoveredBookmark] = useState<{ url: string; element: HTMLElement } | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isDisplayMenuVisible, setIsDisplayMenuVisible] = useState(false);
  const [isColumnMenuVisible, setIsColumnMenuVisible] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [visibleFields, setVisibleFields] = useState({
    url: true,
    tags: false,
    keyword: false,
    folder: false,
    dateAdded: false,
  });

  const displayMenuRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Initial State Loading from localStorage ---
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    // Grid column count
    const savedColumnCount = localStorage.getItem('gridColumnCount');
    if (savedColumnCount && columnOptions.includes(Number(savedColumnCount))) {
        setGridColumnCount(Number(savedColumnCount));
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
      localStorage.setItem('gridColumnCount', String(gridColumnCount));
  }, [gridColumnCount]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const loadBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTree = await getAllBookmarks();
      setBookmarkTree(fetchedTree);
      setInitialLoadComplete(true);
    } catch (err) {
      console.error("Error loading bookmarks:", err);
      setError("Failed to load bookmarks. Make sure the extension has permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (displayMenuRef.current && !displayMenuRef.current.contains(event.target as Node)) {
        setIsDisplayMenuVisible(false);
      }
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Recursive state updaters for the tree structure ---
  const updateNodeStatus = (nodes: BookmarkNode[], id: string, status: Bookmark['status']): BookmarkNode[] => {
    return nodes.map(node => {
      if (node.id === id && node.type === 'bookmark') {
        return { ...node, status };
      }
      if (node.type === 'folder') {
        return { ...node, children: updateNodeStatus(node.children, id, status) };
      }
      return node;
    });
  };

  const updateNodeSafetyStatus = (nodes: BookmarkNode[], id: string, safetyStatus: Bookmark['safetyStatus']): BookmarkNode[] => {
     return nodes.map(node => {
      if (node.id === id && node.type === 'bookmark') {
        return { ...node, safetyStatus };
      }
      if (node.type === 'folder') {
        return { ...node, children: updateNodeSafetyStatus(node.children, id, safetyStatus) };
      }
      return node;
    });
  };
  
  // --- Effects for checking status and safety ---
  useEffect(() => {
    if (!initialLoadComplete) return;

    const bookmarksToCheck: BookmarkItem[] = [];
    const traverse = (nodes: BookmarkNode[]) => {
        nodes.forEach(node => {
            if (node.type === 'bookmark' && node.status === 'unchecked') bookmarksToCheck.push(node);
            if (node.type === 'folder') traverse(node.children);
        });
    };
    traverse(bookmarkTree);
    
    const checkAllLinks = async () => {
        for (const bookmark of bookmarksToCheck) {
            setBookmarkTree(prev => updateNodeStatus(prev, bookmark.id, 'checking'));
            const status = await checkLinkStatus(bookmark.url);
            setBookmarkTree(prev => updateNodeStatus(prev, bookmark.id, status));
        }
    };
    checkAllLinks();
  }, [initialLoadComplete, bookmarkTree]);
  
  useEffect(() => {
    if (!initialLoadComplete) return;
    
    const bookmarksToScan: BookmarkItem[] = [];
    const traverse = (nodes: BookmarkNode[]) => {
        nodes.forEach(node => {
            if (node.type === 'bookmark' && node.safetyStatus === 'unknown') bookmarksToScan.push(node);
            if (node.type === 'folder') traverse(node.children);
        });
    };
    traverse(bookmarkTree);

    const checkAllLinksSafety = async () => {
      for (const bookmark of bookmarksToScan) {
        setBookmarkTree(prev => updateNodeSafetyStatus(prev, bookmark.id, 'checking'));
        const safetyStatus = await checkLinkSafety(bookmark.url);
        setBookmarkTree(prev => updateNodeSafetyStatus(prev, bookmark.id, safetyStatus));
      }
    };
    checkAllLinksSafety();
  }, [initialLoadComplete, bookmarkTree]);
  

  const filteredAndSearchedTree = useMemo(() => {
    const filterPredicate = (bookmark: BookmarkItem): boolean => {
      if (!activeFilter) return true;
      switch (activeFilter) {
        case 'live': return bookmark.status === 'live';
        case 'dead': return bookmark.status === 'dead' || bookmark.status === 'parked';
        case 'safe': return bookmark.safetyStatus === 'safe';
        case 'unsafe': return bookmark.safetyStatus === 'unsafe';
        default: return true;
      }
    };

    const searchPredicate = (bookmark: BookmarkItem): boolean => {
        if (!searchTerm) return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return bookmark.title.toLowerCase().includes(lowercasedTerm) ||
               bookmark.url.toLowerCase().includes(lowercasedTerm) ||
               (bookmark.keyword && bookmark.keyword.toLowerCase().includes(lowercasedTerm)) ||
               bookmark.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm));
    };

    const recursiveFilter = (nodes: BookmarkNode[]): BookmarkNode[] => {
      return nodes.reduce((acc, node) => {
        if (node.type === 'bookmark') {
          // Hide bookmark if it's pending deletion
          if (undoableDeletion && node.id === undoableDeletion.id) {
            return acc;
          }
          if (filterPredicate(node) && searchPredicate(node)) {
            acc.push(node);
          }
        } else if (node.type === 'folder') {
          const filteredChildren = recursiveFilter(node.children);
          if (filteredChildren.length > 0) {
            acc.push({ ...node, children: filteredChildren });
          }
        }
        return acc;
      }, [] as BookmarkNode[]);
    };

    return recursiveFilter(bookmarkTree);
  }, [bookmarkTree, searchTerm, activeFilter, undoableDeletion]);
  
  
  const handleEdit = (bookmark: BookmarkItem) => {
    setEditingBookmark(bookmark);
  };
  
  // --- Deletion Logic with Undo ---
  const findBookmarkById = (nodes: BookmarkNode[], id: string): BookmarkItem | null => {
    for (const node of nodes) {
      if (node.type === 'bookmark' && node.id === id) return node;
      if (node.type === 'folder') {
        const found = findBookmarkById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  const handleDelete = (id: string) => {
    const bookmarkToDelete = findBookmarkById(bookmarkTree, id);
    if (bookmarkToDelete) {
      setDeletingBookmark(bookmarkToDelete);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBookmark) return;
    setUndoableDeletion(deletingBookmark);
    setDeletingBookmark(null);
  };
  
  const handleDeletionTimeout = useCallback(async () => {
    if (!undoableDeletion) return;
    
    const idToDelete = undoableDeletion.id;
    setUndoableDeletion(null);

    try {
      await deleteBookmark(idToDelete);
      const removeBookmarkFromTree = (nodes: BookmarkNode[], id: string): BookmarkNode[] => {
        return nodes.filter(node => node.id !== id).map(node => {
          if (node.type === 'folder') {
            return { ...node, children: removeBookmarkFromTree(node.children, id) };
          }
          return node;
        });
      };
      setBookmarkTree(prevTree => removeBookmarkFromTree(prevTree, idToDelete));
    } catch (err) {
      console.error("Error deleting bookmark from API:", err);
      setError("Failed to delete bookmark. It may reappear on next refresh.");
    }
  }, [undoableDeletion]);

  const handleUndoDelete = () => {
    if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
    }
    setUndoableDeletion(null);
  };

  const handleViewSafetyReport = (bookmark: BookmarkItem) => {
    setViewingSafetyReport(bookmark);
  };

  const handleConfirmViewSafetyReport = () => {
    if (!viewingSafetyReport) return;
    try {
      const hostname = new URL(viewingSafetyReport.url).hostname;
      const url = `https://www.virustotal.com/gui/domain/${hostname}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error("Could not parse URL to get hostname:", viewingSafetyReport.url);
      setError("Could not generate safety report link due to an invalid URL.");
    }
    setViewingSafetyReport(null);
  };


  const handleSave = async (id: string, title: string, url: string, tags: string[], keyword?: string) => {
    try {
      const updatedBm = await updateBookmark(id, { title, url, tags, keyword });
      const updateNodeInTree = (nodes: BookmarkNode[]): BookmarkNode[] => {
        return nodes.map(node => {
          if (node.type === 'bookmark' && node.id === id) {
            return { ...node, ...updatedBm };
          }
          if (node.type === 'folder') {
            return { ...node, children: updateNodeInTree(node.children) };
          }
          return node;
        });
      };
      setBookmarkTree(prevTree => updateNodeInTree(prevTree));
      setEditingBookmark(null);
    } catch (err) {
      console.error("Error updating bookmark:", err);
      setError("Failed to update bookmark.");
    }
  };
  
  const toggleFilter = (filter: FilterType) => {
    setActiveFilter(prev => prev === filter ? null : filter);
  };
  
  const handleFieldVisibilityChange = (field: VisibleField) => {
    setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
  };


  const filterButtons: { key: FilterType, label: string, icon: React.FC<any> }[] = [
    { key: 'live', label: 'Live Links', icon: CheckCircleIcon },
    { key: 'dead', label: 'Dead Links', icon: XCircleIcon },
    { key: 'safe', label: 'Safe Links', icon: ShieldCheckIcon },
    { key: 'unsafe', label: 'Unsafe Links', icon: ShieldAlertIcon },
  ];

  const displayFields: { key: VisibleField, label: string }[] = [
    { key: 'url', label: 'Show URL' },
    { key: 'tags', label: 'Show Tags' },
    { key: 'keyword', label: 'Show Keyword' },
    { key: 'folder', label: 'Show Folder' },
    { key: 'dateAdded', label: 'Show Date Added' },
  ];


  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Bookmark Manager Zero</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">A modern interface for your native Firefox bookmarks.</p>
        </header>

        <div className="sticky top-0 z-20 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm py-4 mb-6">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by title, url, tag, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full py-3 pl-12 pr-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              aria-label="Search bookmarks"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
          
           <div className="flex flex-wrap items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <div className="relative" ref={displayMenuRef}>
                    <button 
                      onClick={() => setIsDisplayMenuVisible(prev => !prev)} 
                      className="px-4 py-2 text-sm rounded-full flex items-center gap-2 transition bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                      aria-expanded={isDisplayMenuVisible}
                    >
                      <MenuIcon className="w-4 h-4" />
                      <span>Display</span>
                    </button>
                    {isDisplayMenuVisible && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl p-2 z-30">
                        <p className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Show Fields</p>
                        {displayFields.map(({ key, label }) => (
                          <label key={key} className="flex items-center w-full px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={visibleFields[key]}
                              onChange={() => handleFieldVisibilityChange(key)}
                              className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="ml-3">{label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                </div>
                <button 
                  onClick={() => setIsFilterVisible(prev => !prev)} 
                  className={`px-4 py-2 text-sm rounded-full flex items-center gap-2 transition relative ${activeFilter ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'}`}
                  aria-expanded={isFilterVisible}
                >
                  <FilterIcon className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-300 rounded-full border-2 border-slate-100 dark:border-slate-900"></span>}
                </button>
             </div>

            <div className="flex items-center justify-end space-x-2">
              <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition" title="Toggle Theme">
                  {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
              </button>
              <span className="border-l border-slate-300 dark:border-slate-700 h-6 mx-2"></span>

              <div className="flex items-center space-x-1 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-full">
                {/* View Mode Buttons */}
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full transition ${viewMode === 'grid' ? 'bg-blue-500 text-white shadow' : 'hover:bg-white/60 dark:hover:bg-black/20 text-slate-700 dark:text-slate-300'}`} title="Grid View">
                  <GridIcon className="h-5 w-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-full transition ${viewMode === 'list' ? 'bg-blue-500 text-white shadow' : 'hover:bg-white/60 dark:hover:bg-black/20 text-slate-700 dark:text-slate-300'}`} title="List View">
                  <ListIcon className="h-5 w-5" />
                </button>
                <button onClick={() => setViewMode('enhanced-list')} className={`p-2 rounded-full transition ${viewMode === 'enhanced-list' ? 'bg-blue-500 text-white shadow' : 'hover:bg-white/60 dark:hover:bg-black/20 text-slate-700 dark:text-slate-300'}`} title="Enhanced List View">
                  <EnhancedListIcon className="h-5 w-5" />
                </button>
              
                <span className="border-l border-slate-300 dark:border-slate-600 h-6 mx-1"></span>

                {/* Contextual Controls */}
                {viewMode === 'grid' ? (
                  <div className="relative pr-1" ref={columnMenuRef}>
                      <button 
                          onClick={() => setIsColumnMenuVisible(prev => !prev)} 
                          className="p-2 rounded-full hover:bg-white/60 dark:hover:bg-black/20 text-slate-700 dark:text-slate-300 transition" 
                          title={`Grid columns: ${gridColumnCount}`}
                      >
                          <ColumnsIcon className="h-5 w-5" />
                      </button>
                      {isColumnMenuVisible && (
                          <div className="absolute top-full right-0 mt-2 w-max bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl p-2 z-30">
                                <p className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Columns</p>
                                <div className="flex items-center gap-1">
                                  {columnOptions.map(num => (
                                      <button
                                          key={num}
                                          onClick={() => { setGridColumnCount(num); setIsColumnMenuVisible(false); }}
                                          className={`w-8 h-8 rounded-md text-sm font-semibold transition ${gridColumnCount === num ? 'bg-blue-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'}`}
                                      >
                                          {num}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 pr-1">
                    <button onClick={() => setZoomIndex(i => Math.max(i - 1, 0))} className="p-2 rounded-full hover:bg-white/60 dark:hover:bg-black/20 text-slate-700 dark:text-slate-300 transition" title="Zoom Out" disabled={zoomIndex === 0}>
                      <ZoomOutIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => setZoomIndex(i => Math.min(i + 1, listZoomLevels - 1))} className="p-2 rounded-full hover:bg-white/60 dark:hover:bg-black/20 text-slate-700 dark:text-slate-300 transition" title="Zoom In" disabled={zoomIndex === listZoomLevels - 1}>
                      <ZoomInIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
           </div>

           <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterVisible ? 'max-h-40 mt-4' : 'max-h-0'}`}>
            <div className="bg-slate-200/60 dark:bg-slate-800/60 p-3 rounded-xl flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mr-2">Filter by:</span>
                 {filterButtons.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => toggleFilter(key)} className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-2 transition ${activeFilter === key ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-300 dark:bg-slate-700/50 hover:bg-slate-400/50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'}`} title={label}>
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                    </button>
                ))}
                {activeFilter && (
                    <button onClick={() => setActiveFilter(null)} className="p-2 rounded-full bg-slate-300 dark:bg-slate-700/50 hover:bg-slate-400/50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300" title="Clear Filter">
                        <XIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 h-64">
            <LoaderIcon className="h-12 w-12 animate-spin mb-4" />
            <p className="text-lg">Loading your bookmarks...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl">
            <h3 className="text-xl font-semibold">An Error Occurred</h3>
            <p>{error}</p>
          </div>
        ) : (
          <BookmarkList 
            nodes={filteredAndSearchedTree}
            viewMode={viewMode}
            zoomIndex={zoomIndex}
            gridConfig={gridClassMap[gridColumnCount]}
            visibleFields={visibleFields}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewSafetyReport={handleViewSafetyReport}
            onHoverStart={(url, element) => {
              // Disable preview if a menu is open on any card
              const anyMenuOpen = document.querySelector('[data-menu-open="true"]');
              if (!anyMenuOpen) {
                setHoveredBookmark({ url, element });
              }
            }}
            onHoverEnd={() => setHoveredBookmark(null)}
          />
        )}
      </div>
      {hoveredBookmark && viewMode === 'grid' && <SitePreview target={hoveredBookmark} />}
      {editingBookmark && (
        <EditModal
          bookmark={editingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSave={handleSave}
        />
      )}
      {deletingBookmark && (
        <ConfirmDeleteModal
          bookmark={deletingBookmark}
          onClose={() => setDeletingBookmark(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
       {viewingSafetyReport && (
        <VirusTotalModal
          bookmark={viewingSafetyReport}
          onClose={() => setViewingSafetyReport(null)}
          onConfirm={handleConfirmViewSafetyReport}
        />
      )}
      {undoableDeletion && (
        <UndoToast
          bookmarkTitle={undoableDeletion.title}
          onUndo={handleUndoDelete}
          onTimeout={handleDeletionTimeout}
        />
      )}
    </div>
  );
}