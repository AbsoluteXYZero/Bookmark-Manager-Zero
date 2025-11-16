import React from 'react';
import type { BookmarkItem } from '../types';

interface ConfirmDeleteModalProps {
  bookmark: BookmarkItem;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ bookmark, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirmClick = async () => {
    setIsDeleting(true);
    await onConfirm();
    // No need to set isDeleting back to false as the component will unmount
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-delete-title" className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Confirm Deletion</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Are you sure you want to delete the bookmark: <strong className="font-semibold text-slate-800 dark:text-slate-100 break-all">"{bookmark.title}"</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-500 transition"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition disabled:bg-red-400 dark:disabled:bg-red-800 disabled:cursor-not-allowed flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;