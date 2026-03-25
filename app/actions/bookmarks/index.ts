interface Bookmark {
  url: string;
  name: string;
}

interface AddBookmarkAction {
  type: 'ADD_BOOKMARK';
  bookmark: Bookmark;
}

interface RemoveBookmarkAction {
  type: 'REMOVE_BOOKMARK';
  bookmark: Bookmark;
}

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: 'ADD_BOOKMARK',
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark): RemoveBookmarkAction {
  return {
    type: 'REMOVE_BOOKMARK',
    bookmark,
  };
}
