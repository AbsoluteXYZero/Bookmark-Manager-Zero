import React, { useState, useEffect, useRef } from 'react';

interface UndoToastProps {
  bookmarkTitle: string;
  onUndo: () => void;
  onTimeout: () => void;
}

const UNDO_TIMEOUT = 3000; // 3 seconds

const UndoToast: React.FC<UndoToastProps> = ({ bookmarkTitle, onUndo, onTimeout }) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Fade in
    const visibilityTimer = setTimeout(() => {
      setVisible(true);
    }, 10); // Short delay to allow for CSS transition

    // Set timeout for final deletion
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      // Wait for fade-out animation before calling timeout
      setTimeout(onTimeout, 300);
    }, UNDO_TIMEOUT);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearTimeout(visibilityTimer);
    };
  }, [onTimeout]);

  const handleUndoClick = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
    // Wait for fade-out animation before calling undo
    setTimeout(onUndo, 300);
  };

  return (
    <div 
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl flex items-center justify-between transition-all duration-300 ease-in-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-grow pr-4 overflow-hidden">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Deleted "<strong className="font-semibold text-slate-900 dark:text-slate-100 truncate">{bookmarkTitle}</strong>".
        </p>
        <div className="relative w-full h-1 bg-slate-200 dark:bg-slate-700/50 mt-2 rounded-full overflow-hidden">
            <div 
                className="absolute top-0 left-0 h-full bg-blue-500 animate-shrink-width"
                style={{ animationDuration: `${UNDO_TIMEOUT}ms` }}
            ></div>
        </div>
        <style>{`
          @keyframes shrink-width {
            from { width: 100%; }
            to { width: 0%; }
          }
          .animate-shrink-width {
            animation-name: shrink-width;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
          }
        `}</style>
      </div>
      <button
        onClick={handleUndoClick}
        className="flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
      >
        Undo
      </button>
    </div>
  );
};

export default UndoToast;