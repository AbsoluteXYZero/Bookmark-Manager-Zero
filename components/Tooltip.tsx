import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const showTooltip = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position tooltip to be centered above the trigger element
      setPosition({
        top: rect.top - 8, // Position above, with a small margin
        left: rect.left + rect.width / 2,
      });
      setVisible(true);
    }
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  // FIX: The original implementation attempted to clone a ref onto the child using React.cloneElement,
  // which is not supported for all component types and causes a TypeScript error.
  // The fix is to wrap the child element in a `span` and attach the ref and event listeners to this wrapper.
  // This approach is more robust and correctly handles tooltips for any child component.
  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        // For focusable elements like buttons
        onFocus={showTooltip}
        onBlur={hideTooltip}
        // Use inline-flex to ensure the wrapper fits content and works within flex layouts
        className="inline-flex items-center justify-center"
      >
        {children}
      </span>
      {visible && content && ReactDOM.createPortal(
        <div 
          role="tooltip"
          className="fixed z-[9999] px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap -translate-x-1/2 -translate-y-full transition-opacity duration-150"
          style={{ ...position, opacity: visible ? 1 : 0 }}
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
