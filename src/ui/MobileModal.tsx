import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type MobileModalModalProps = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  disableClose?: boolean;
  zIndex?: number;
  lockScroll?: boolean;
  maxWidth?: string;
  maxHeight?: string;
};

export default function MobileModal({
  open,
  onClose,
  children,
  disableClose = false,
  zIndex = 50,
  lockScroll = true,
  maxWidth = '358px',
  maxHeight = '90vh',
}: MobileModalModalProps) {
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={!disableClose && onClose ? onClose : undefined}
        style={{ cursor: disableClose ? 'default' : 'pointer' }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
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
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
