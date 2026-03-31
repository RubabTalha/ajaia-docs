import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  trigger, 
  children, 
  align = 'right' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`
            absolute top-full mt-1 z-50 min-w-[180px] bg-white rounded-lg 
            shadow-large border border-surface-200 py-1 animate-scale-in
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ 
  children, 
  onClick, 
  danger,
  icon 
}) => (
  <button
    className={`
      w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors
      ${danger 
        ? 'text-red-600 hover:bg-red-50' 
        : 'text-surface-700 hover:bg-surface-50'
      }
    `}
    onClick={onClick}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    {children}
  </button>
);

export const DropdownSeparator: React.FC = () => (
  <div className="my-1 border-t border-surface-100" />
);