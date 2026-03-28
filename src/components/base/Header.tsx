// Header.tsx
import { MobileHeader } from '@components/smart';
import { useMediaQuery } from '../../hooks/ui/useMediaQuery';

import { DesktopHeader } from './desktop/DesktopHeader';

export function Header() {
  const isMobile = useMediaQuery('(max-width: 1023px)');

  if (isMobile) {
    return <MobileHeader />;
  }

  return <DesktopHeader />;
}
