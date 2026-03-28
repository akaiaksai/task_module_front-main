import { NavLink } from 'react-router-dom';

interface SideMenuLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function SideMenuLink({
  to,
  icon: Icon,
  isActive,
  onClick,
  children,
}: SideMenuLinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`
        flex items-center gap-3 w-full py-[10px] px-[15px]
        ${isActive ? 'bg-mobile-header text-white rounded-[10px] shadow-soft' : 'text-gray-900'}
      `}
    >
      {/* ИКОНКА */}
      <div
        className={`
          w-[30px] h-[30px] flex items-center justify-center
          ${isActive ? '' : 'bg-[#E3E3E3] rounded-full'}
        `}
      >
        <Icon
          className={`
            ${isActive ? 'text-white' : 'text-black'}
          `}
        />
      </div>

      <span className="font-normal text-[18px] leading-[130%] tracking-[-0.5px]">
        {children}
      </span>
    </NavLink>
  );
}
