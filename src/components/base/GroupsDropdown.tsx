import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserGroups } from '@/hooks/groups/useGroupFilter';

export function DropdownGroupsBlack() {
  const navigate = useNavigate();
  const location = useLocation();

  const { groups = [], isLoading } = useUserGroups();
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedId = location.pathname.match(/^\/groups\/(\d+)/)?.[1] || null;

  const toggle = () => setOpen((p) => !p);

  const handleSelect = (id: number) => {
    navigate(`/groups/${id}`);
    setOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex flex-col items-center select-none"
    >
      <button
        ref={buttonRef}
        onClick={toggle}
        className={`
          inline-flex items-center gap-[5px]   
          transition-colors text-[18px] font-normal leading-[130%] tracking-[-0.83px] max-xl:text-[15px]
        ${
          location.pathname.startsWith('/groups')
            ? 'text-white text-glow-active'
            : 'text-white hover:text-gray-300'
        }
        `}
      >
        <span>
          {selectedId
            ? (groups.find((g) => String(g.ID) === selectedId)?.Name ??
              'Группы')
            : 'Группы'}
        </span>

        <ChevronDown
          className={`w-5 h-5 transition-transform duration-200 translate-y-[-1px] ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className="
            absolute top-full 
            left-1/2 transform -translate-x-1/2
            mt-1 bg-mobile-header text-white
            rounded-lg ui-glow-desktop z-50
            min-w-[100%]
          "
        >
          {isLoading && (
            <div className="px-4 py-2 text-gray-400 text-sm">Загрузка...</div>
          )}

          {!isLoading &&
            groups
              .slice()
              .sort((a, b) => a.Name.localeCompare(b.Name, 'ru'))
              .map((g) => {
                const active = String(g.ID) === selectedId;
                return (
                  <button
                    key={g.ID}
                    onClick={() => handleSelect(g.ID)}
                    className={`block w-full text-left px-4 py-2 text-[15px] transition-all
                      ${
                        active
                          ? 'bg-white text-black rounded-md'
                          : 'hover:bg-gray-800 rounded-md'
                      }`}
                  >
                    {g.Name}
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
}
