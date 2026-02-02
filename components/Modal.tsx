'use client';

import { useRef, useEffect, useId, createContext, useContext, type RefObject } from 'react';

/** When FractionFilter (or similar) is used inside a modal, it can portal into this dialog so its dropdown appears in the top layer and stays clickable. */
export const ModalDialogContext = createContext<RefObject<HTMLDialogElement | null> | null>(null);

export function useModalDialog(): RefObject<HTMLDialogElement | null> | null {
  return useContext(ModalDialogContext);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sync dialog open state with prop and lock body scroll when open
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      // Focus close button when opened for accessibility
      closeButtonRef.current?.focus();
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    } else {
      document.body.style.overflow = '';
      dialog.close();
    }
  }, [open]);

  // Notify parent when dialog is closed (e.g. via Escape or native close)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  // Close on backdrop click (click on the overlay wrapper)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <ModalDialogContext.Provider value={dialogRef}>
      <dialog
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-50 max-w-none border-0 bg-transparent p-0 shadow-none"
      >
        <div
          role="presentation"
          className="fixed inset-0 flex items-center justify-center bg-black/30 p-4"
          onClick={handleBackdropClick}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Schließen"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
        </div>
      </div>
    </dialog>
    </ModalDialogContext.Provider>
  );
}
