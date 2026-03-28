export function Avatar({ src, name }: { src?: string; name?: string }) {
  const fallback = name ? name[0].toUpperCase() : '?';

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#E5E5E5] flex items-center justify-center">
      {src ? (
        <img src={src} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[12px] text-[#555]">{fallback}</span>
      )}
    </div>
  );
}
