import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { LoaderIcon } from './Icons';

interface SitePreviewProps {
  target: {
    url: string;
    element: HTMLElement;
  };
}

const SitePreview: React.FC<SitePreviewProps> = ({ target }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, opacity: 0 });
  const [isImgLoading, setIsImgLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const imageUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(target.url)}?w=320`;

  useEffect(() => {
    const targetRect = target.element.getBoundingClientRect();
    const previewWidth = 320 + 24; // width + padding
    const previewHeight = 240 + 24; // height + padding
    const margin = 12;

    let top = targetRect.top;
    let left = targetRect.right + margin; // Default to the right

    // If it overflows right edge, try positioning on the left
    if (left + previewWidth > window.innerWidth) {
      left = targetRect.left - previewWidth;
    }

    // If positioning on the left makes it go off-screen, stick it to the right edge of viewport
    if (left < margin) {
      left = window.innerWidth - previewWidth - margin;
    }
    
    // Final check to make sure it's not off the left edge (can happen on very narrow screens)
    if (left < margin) {
        left = margin;
    }

    // Adjust vertical position to stay in viewport
    if (top + previewHeight > window.innerHeight) {
        top = window.innerHeight - previewHeight - margin;
    }
     if (top < margin) {
        top = margin;
    }

    setPosition({ top, left, opacity: 1 });
    setIsImgLoading(true); // Reset loading state for new target
  }, [target]);

  return ReactDOM.createPortal(
    <div 
      ref={previewRef} 
      className="fixed z-50 w-[344px] h-[264px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 transition-opacity duration-200 pointer-events-none"
      style={position}
    >
      <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden relative flex items-center justify-center">
        {isImgLoading && (
            <div className="text-slate-500 dark:text-slate-400 text-center">
                <LoaderIcon className="h-8 w-8 animate-spin" />
            </div>
        )}
         <img 
            src={imageUrl} 
            alt={`Preview of ${target.url}`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsImgLoading(false)}
            onError={() => setIsImgLoading(false)} // Hide spinner on error too
         />
      </div>
    </div>,
    document.body
  );
};

export default SitePreview;