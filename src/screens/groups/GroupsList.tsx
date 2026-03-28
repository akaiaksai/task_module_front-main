import { useMediaQuery } from '@/hooks/ui/useMediaQuery';

import DesktopGroupsList from './_desktop/DesktopGroupsList';
import MobileGroupsList from './_mobile/MobileGroupsList';

export default function GroupsList() {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  return isMobile ? <MobileGroupsList /> : <DesktopGroupsList />;
}
