import { blocksConfig } from '@/shared/constants/blocksConfig';

export const BlockPill = ({
  block,
  isActive,
  onClick,
}: {
  block: (typeof blocksConfig)[0];
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = block.icon;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full border text-[12px] font-normal transition-all whitespace-nowrap text-white"
      style={{
        backgroundColor: isActive ? block.activeColor : block.bgColor,
        borderColor: isActive ? block.activeColor : block.borderColor,
      }}
    >
      <Icon
        color={!isActive ? block.activeColor : 'white'}
        className={`relative w-4 h-4`}
      />
      {block.label}
    </button>
  );
};
