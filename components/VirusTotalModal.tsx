import React from 'react';
import type { BookmarkItem } from '../types';
import { ShieldCheckIcon } from './Icons';

interface VirusTotalModalProps {
  bookmark: BookmarkItem;
  onClose: () => void;
  onConfirm: () => void;
}

const VirusTotalModal: React.FC<VirusTotalModalProps> = ({ bookmark, onClose, onConfirm }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="virustotal-modal-title"
    >
      <div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-4">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 id="virustotal-modal-title" className="text-2xl font-bold text-slate-900 dark:text-slate-100">View Safety Report</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-2">
          Would you like to view the safety report for the following bookmark on VirusTotal?
        </p>
        <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md text-slate-700 dark:text-slate-300 break-all mb-4">
          {bookmark.url}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          This will open a new tab and navigate to an external website (virustotal.com).
        </p>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-500 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition flex items-center"
          >
            View Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirusTotalModal;