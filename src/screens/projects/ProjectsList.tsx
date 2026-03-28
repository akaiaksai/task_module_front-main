// SmartContractsList.tsx
import SmartContractsListDesktop from './_desktop/ProjectPageDesktop';
import SmartContractsListMobile from './_mobile/ProjectPageMobile';

export default function SmartContractsList() {
  const isMobile = window.innerWidth < 1024;

  if (isMobile) {
    return <SmartContractsListMobile />;
  }

  return <SmartContractsListDesktop />;
}
