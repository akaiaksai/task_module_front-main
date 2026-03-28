// export function FilesBlock({
//   onClose,
//_   task,
// }: {
//   onClose: () => void;
//_   task: Task;
// }) {
//   const [files, setFiles] = useState(task.files ?? []);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [uploading, setUploading] = useState(false);

//   console.log(task.files);

//   async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setUploading(true);

//     try {
//       const res = await uploadTaskFile(task.id, file);

//       if (res.status === "success" && res.fileId) {
//         const newFile = {
//           id: res.fileId,
//           name: file.name,
//           size: file.size,
//           mimeType: file.type,
//           downloadUrl: `/tasks-module-back/files/${res.fileId}`,
//         };

//         setFiles((prev) => [...prev, newFile]);
//       }
//     } catch (err) {
//       console.error("Ошибка загрузки файла:", err);
//     }

//     setUploading(false);
//   }

//   return (
//     <WindowCard title="Документация по проекту" onClose={onClose}>
//       <div className="space-y-6 font-roboto">
//         {files.length > 0 && (
//           <div className="space-y-2">
//             {files.map((f) => (
//               <a
//                 key={f.id}
//                 href={f.downloadUrl}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="flex items-center gap-2 px-2 py-2 rounded-lg border bg-white hover:bg-gray-50 transition"
//               >
//                 <FileText className="w-4 h-4 text-[#2D8CFF]" />
//                 <div className="flex flex-col">
//                   <span className="text-[14px] text-[#1A1A1A]">{f.name}</span>
//                   <span className="text-[12px] text-[#00000060]">
//                     {(f.size / 1024).toFixed(1)} KB
//                   </span>
//                 </div>
//               </a>
//             ))}
//           </div>
//         )}

//         {files.length === 0 && (
//           <div className="text-center text-[#2B2B2B73] text-[14px]">
//             Файлов пока нет
//           </div>
//         )}

//         <button
//           type="button"
//           onClick={() => fileInputRef.current?.click()}
//           className="w-full flex items-center justify-between bg-[#EDEDED] border border-[#2B2B2B1F] rounded-xl px-3 py-3 hover:bg-[#e2e2e2] transition"
//         >
//           <span className="text-[14px] text-[#2B2B2B99] underline">
//             {uploading ? "Загрузка..." : "Прикрепить файл"}
//           </span>
//           <Paperclip className="w-4 h-4 text-[#2B2B2B99]" />
//         </button>

//         <input
//           ref={fileInputRef}
//           type="file"
//           className="hidden"
//           onChange={handleUpload}
//         />
//       </div>
//     </WindowCard>
//   );
// }
