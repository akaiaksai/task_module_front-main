type Props = {
  page: number;
  perPage: number;
  total: number;
  disabled?: boolean;
  onPageChange: (p: number) => void;
};

export default function Pagination({
  page,
  perPage,
  total,
  disabled = false, // Значение по умолчанию
  onPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const canPrev = page > 1 && !disabled;
  const canNext = page < totalPages && !disabled;

  const handlePageChange = (newPage: number) => {
    if (!disabled) {
      onPageChange(newPage);
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 text-sm ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <div className="text-neutral-600">
        Страница {page} из {totalPages} · Всего {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`btn-ghost ${
            !canPrev ? 'opacity-50 cursor-not-allowed' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!canPrev || disabled}
          onClick={() => handlePageChange(page - 1)}
        >
          Назад
        </button>
        <button
          className={`btn-ghost ${
            !canNext ? 'opacity-50 cursor-not-allowed' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!canNext || disabled}
          onClick={() => handlePageChange(page + 1)}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}
