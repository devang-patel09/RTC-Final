import { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

export default function Modal({ open, onClose, title, children, className }) {
  const overlayRef = useRef();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div className={cn('bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl', className)} onClick={e => e.stopPropagation()}>
        {title && <h2 className="text-lg font-bold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
