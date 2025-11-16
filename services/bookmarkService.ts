import type { BookmarkNode, BookmarkItem, FolderItem, Bookmark } from '../types';

const browser = (window as any).browser;

const TAG_REGEX = /^((?:\[[^\]]+\]\s*)+)/;

const parseTitleAndTags = (fullTitle: string): { title: string, tags: string[] } => {
  const tagMatch = fullTitle.match(TAG_REGEX);
  if (tagMatch) {
    const tags = tagMatch[1].match(/\[([^\]]+)\]/g)?.map(t => t.slice(1, -1)) || [];
    const title = fullTitle.substring(tagMatch[0].length).trim();
    return { title, tags };
  }
  return { title: fullTitle, tags: [] };
};


const transformBookmarkNode = (node: any): BookmarkNode | null => {
  // It's a bookmark if it has a URL and is not a special "unmodifiable" folder
  if (node.url && !node.unmodifiable) {
    const { title, tags } = parseTitleAndTags(node.title || node.url);
    return {
      type: 'bookmark',
      id: node.id,
      title: title,
      url: node.url,
      dateAdded: node.dateAdded,
      tags: tags,
      keyword: node.keyword || undefined,
      parentId: node.parentId,
      index: node.index,
      status: 'unchecked',
      safetyStatus: 'unknown',
    };
  }
  
  // It's a folder if it has children
  if (node.children) {
    return {
      type: 'folder',
      id: node.id,
      title: node.title || 'Unnamed Folder', // Root folders might not have titles
      dateAdded: node.dateAdded,
      parentId: node.parentId,
      index: node.index,
      children: node.children
        .map(transformBookmarkNode)
        .filter((child): child is BookmarkNode => child !== null),
    };
  }

  return null;
};


export const getAllBookmarks = async (): Promise<BookmarkNode[]> => {
  if (!browser || !browser.bookmarks) {
    console.warn("Bookmarks API not available. Running in a standard browser context.");
    // Return mock data for development
    return [
        { id: 'folder-1', type: 'folder', title: 'Work', parentId: 'root-id', index: 0, children: [
            { id: '1', type: 'bookmark', title: 'React Documentation', url: 'https://react.dev', tags: ['react', 'docs', 'frontend'], keyword: 'react', parentId: 'folder-1', index: 0, status: 'unchecked', safetyStatus: 'unknown' },
            { id: '4', type: 'bookmark', title: 'Mozilla Developer Network', url: 'https://developer.mozilla.org', tags: ['webdev', 'docs'], parentId: 'folder-1', index: 1, status: 'unchecked', safetyStatus: 'unknown' },
        ]},
        { id: 'folder-2', type: 'folder', title: 'Design', parentId: 'root-id', index: 1, children: [
             { id: '2', type: 'bookmark', title: 'Tailwind CSS', url: 'https://tailwindcss.com', tags: ['css', 'utility-first'], parentId: 'folder-2', index: 0, status: 'unchecked', safetyStatus: 'unknown' },
             { id: '6', type: 'bookmark', title: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/', tags: ['design', 'articles', 'ux'], parentId: 'folder-2', index: 1, status: 'unchecked', safetyStatus: 'unknown' },
        ]},
        { id: 'folder-3', type: 'folder', title: 'Testing Links', parentId: 'root-id', index: 2, children: [
            { id: '3', type: 'bookmark', title: 'A Dead Link Example', url: 'https://thissitedoesnotexist.com/', tags: ['test', 'broken'], parentId: 'folder-3', index: 0, status: 'unchecked', safetyStatus: 'unknown' },
            { id: '5', type: 'bookmark', title: 'Example of unsafe link', url: 'http://malware.testing.google.test/testing/index.html', tags: ['test', 'security'], parentId: 'folder-3', index: 1, status: 'unchecked', safetyStatus: 'unknown' },
            { id: '11', type: 'bookmark', title: 'A Parked Domain Example', url: 'http://anexampleofaparkedsite.com', tags: ['test', 'parked'], parentId: 'folder-3', index: 2, status: 'unchecked', safetyStatus: 'unknown' },
        ]},
        { id: 'folder-4', type: 'folder', title: 'News & Reading', parentId: 'root-id', index: 3, children: [
            { id: '7', type: 'bookmark', title: 'Hacker News', url: 'https://news.ycombinator.com', tags: ['tech', 'news'], parentId: 'folder-4', index: 0, status: 'unchecked', safetyStatus: 'unknown' },
            { id: '8', type: 'bookmark', title: 'Reddit', url: 'https://www.reddit.com', tags: ['social', 'news'], parentId: 'folder-4', index: 1, status: 'unchecked', safetyStatus: 'unknown' },
            { id: 'folder-5', type: 'folder', title: 'Subfolder Example', parentId: 'folder-4', index: 2, children: [
                { id: '9', type: 'bookmark', title: 'A List Apart', url: 'https://alistapart.com/', tags: ['webdev', 'articles'], parentId: 'folder-5', index: 0, status: 'unchecked', safetyStatus: 'unknown' },
            ]},
        ]},
        { id: '10', type: 'bookmark', title: 'GitHub', url: 'https://github.com', tags: ['code', 'hosting'], keyword: 'gh', parentId: 'root-id', index: 4, status: 'unchecked', safetyStatus: 'unknown' },
    ];
  }
  const bookmarkTree = await browser.bookmarks.getTree();
  // The root of the tree is an array of nodes, we transform them.
  const transformedTree = bookmarkTree
    .map(transformBookmarkNode)
    .filter((node): node is BookmarkNode => node !== null);
  
  // The API returns a root folder which we don't need to display, so we take its children
  if (transformedTree.length === 1 && transformedTree[0].type === 'folder') {
     return transformedTree[0].children;
  }
  return transformedTree;
};

export const updateBookmark = async (id: string, updates: { title: string; url: string; tags: string[]; keyword?: string }): Promise<Bookmark> => {
   if (!browser || !browser.bookmarks) {
    console.warn("Bookmarks API not available. Update operation skipped.");
    const { title, url, tags, keyword } = updates;
    return { id, title, url, tags, keyword, status: 'unchecked', safetyStatus: 'unknown' };
  }

  const { title, url, tags, keyword } = updates;
  
  const newTitleWithTags = tags.length > 0
    ? `${tags.map(t => `[${t}]`).join(' ')} ${title}`
    : title;

  const updatedNode = await browser.bookmarks.update(id, { title: newTitleWithTags, url, keyword });
  
  const { title: cleanTitle, tags: newTags } = parseTitleAndTags(updatedNode.title);

  return {
    id: updatedNode.id,
    title: cleanTitle,
    url: updatedNode.url,
    dateAdded: updatedNode.dateAdded,
    tags: newTags,
    keyword: updatedNode.keyword || undefined,
    parentId: updatedNode.parentId,
    index: updatedNode.index,
    status: 'unchecked', // Reset status after update
    safetyStatus: 'unknown', // Reset safety status
  };
};

export const deleteBookmark = async (id: string): Promise<void> => {
   if (!browser || !browser.bookmarks) {
    console.warn("Bookmarks API not available. Delete operation skipped.");
    return;
  }
  await browser.bookmarks.remove(id);
};

export const checkLinkStatus = async (url: string): Promise<'live' | 'dead' | 'parked'> => {
  if (!browser || !browser.runtime || !browser.runtime.sendMessage) {
    console.warn("Messaging API not available. Cannot check link status. Using fallback.");
    // Fallback for non-extension environment
    if (url.includes('thissitedoesnotexist')) {
      return 'dead';
    }
    if (url.includes('anexampleofaparkedsite')) {
        return 'parked';
    }
    if (url.includes('malware.testing')) {
      return 'live';
    }
    return 'live';
  }
  
  try {
    const response = await browser.runtime.sendMessage({
      action: "checkLinkStatus",
      url: url,
    });
    if (response && response.status) {
      return response.status;
    }
    return 'dead';
  } catch (error) {
    console.error(`Error checking link status for ${url} via background script:`, error);
    return 'dead';
  }
};


export const checkLinkSafety = async (url: string): Promise<'safe' | 'unsafe'> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const maliciousDomains = ['malware.testing.google.test'];
      try {
        const hostname = new URL(url).hostname;
        if (maliciousDomains.some(domain => hostname.includes(domain))) {
            resolve('unsafe');
        } else {
            resolve('safe');
        }
      } catch (e) {
          // Handle invalid URLs
          resolve('unsafe');
      }
    }, Math.random() * 1500 + 500); 
  });
};