// import { ChevronLeft, ChevronRight } from 'lucide-react';
// import { useState, useMemo } from 'react';

// export function PaginationGrid({
//   items,
//   renderItem,
//   perPage = 3,
// }: {
//   items: ANY[];
//   renderItem: (item: ANY) => React.ReactNode;
//   perPage?: number;
//   columns?: number;
//   gap?: number | string;
// }) {
//   const [page, setPage] = useState(0);

//   const totalPages = Math.ceil(items.length / perPage);

//   const paginatedItems = useMemo(() => {
//     const start = page * perPage;
//     return items.slice(start, start + perPage);
//   }, [page, perPage, items]);

//   return (
//     <div className="w-full mt-[42.5px]">
//       <div
//         className={`grid lg:grid-cols-2 xl:grid-cols-3 justify-between w-full gap-y-[51px]`}
//         style={{
//           gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 400px))',
//         }}
//       >
//         {paginatedItems.map((item, i) => (
//           <div key={i}>{renderItem(item)}</div>
//         ))}
//       </div>

//       {totalPages > 1 && (
//         <div className="mt-6 flex items-center gap-4 justify-center">
//           <button
//             disabled={page === 0}
//             onClick={() => setPage((p) => p - 1)}
//             className="p-2 rounded-full bg-white border shadow disabled:opacity-40"
//           >
//             <ChevronLeft />
//           </button>

//           <span className="text-sm">
//             {page + 1} / {totalPages}
//           </span>

//           <button
//             disabled={page === totalPages - 1}
//             onClick={() => setPage((p) => p + 1)}
//             className="p-2 rounded-full bg-white border shadow disabled:opacity-40"
//           >
//             <ChevronRight />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

export function PaginationGrid({
  items,
  renderItem,
}: {
  items: ANY[];
  renderItem: (item: ANY) => React.ReactNode;
}) {
  return (
    <div className="w-full mt-[42.5px]">
      <div
        className="grid lg:grid-cols-3 xl:grid-cols-5 justify-between w-full gap-y-[51px] 2xl:gap-x-[31.95px]"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(244.44px, 244.44px))',
        }}
      >
        {items.map((item, i) => (
          <div key={i}>{renderItem(item)}</div>
        ))}
      </div>
    </div>
  );
}
