import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type DesktopModalProps = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;

  disableClose?: boolean;
  zIndex?: number;
  lockScroll?: boolean;

  /** максимальная ширина контейнера */
  maxWidth?: string;

  /** максимальная высота контейнера */
  maxHeight?: string;
};

export default function DesktopModal({
  open,
  onClose,
  children,
  disableClose = false,
  zIndex = 50,
  lockScroll = true,
  maxWidth = '1010px',
  maxHeight = '85vh',
}: DesktopModalProps) {
  // Body scroll lock
  useEffect(() => {
    if (!lockScroll) {
      return;
    }

    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, lockScroll]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={!disableClose && onClose ? onClose : undefined}
        style={{ cursor: disableClose ? 'default' : 'pointer' }}
      />

      {/* CENTER WRAPPER */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* MODAL CONTAINER */}
        <div
          className="
            relative
            bg-mobile-header
            text-white
            ui-glow-desktop
            rounded-[20px]
            overflow-hidden
            flex
            flex-col
            font-roboto
          "
          style={{
            maxWidth,
            maxHeight,
          }}
        >
          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
