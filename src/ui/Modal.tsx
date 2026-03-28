import { XMarkIcon } from '@/components/icons/xMark';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  disableClose?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  disableClose = false,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !disableClose) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, disableClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={disableClose ? undefined : onClose}
        style={{ cursor: disableClose ? 'default' : 'pointer' }}
      />

      {/* Контейнер модального окна */}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className={`
            w-full ${maxWidth}
            mx-2
            bg-white
            rounded-lg
            shadow-xl
            flex
            flex-col
            overflow-hidden
            max-h-[80vh]
          `}
        >
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-[40px] px-[30px] flex items-center justify-between">
            <h3 className="text-lg font-semibold sm:text-xl">{title}</h3>
            {!disableClose && (
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={onClose}
                aria-label="Закрыть модальное окно"
              >
                <XMarkIcon color="#1A1A1A" />
              </button>
            )}
          </div>

          <div className="overflow-y-auto p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
