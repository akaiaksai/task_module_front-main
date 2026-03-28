// export const getStringValue = (value: ANY): string => {
//   if (!value) return "";
//   if (typeof value === "string") return value;
//   if (typeof value === "object" && value.Valid) return value.String || "";
//   return "";
// };

// export const getNumberValue = (value: ANY): number | null => {
//   if (!value) return null;
//   if (typeof value === "number") return value;

//   if (typeof value === "object" && value.Valid) {
//     const key = Object.keys(value).find((k) => k !== "Valid");
//     if (key && typeof value[key] === "number") {
//       return value[key];
//     }
//   }

//   if (typeof value === "object" && typeof value.Int64 === "number") {
//     return value.Int64;
//   }

//   return null;
// };

// export const getTitleValue = (title: ANY): string => {
//   const value = getStringValue(title);
//   return value || "Без названия";
// };

// export function pickDate(v: ANY): string | null {
//   if (!v) return null;
//   if (typeof v === "string") return v;
//   if (
//     typeof v === "object" &&
//     typeof v.Time === "string" &&
//     (v.Valid === undefined || v.Valid === true)
//   ) {
//     return v.Time;
//   }
//   return null;
// }

// export function mapStatus(code: number) {
//   switch (code) {
//     case 5:
//       return "done";
//     case 2:
//       return "in_progress";
//     case 4:
//       return "blocked";
//     case 3:
//     default:
//       return "open";
//   }
// }

// export function getBackendStatus(status: string): number {
//   switch (status) {
//     case "open":
//       return 3;
//     case "in_progress":
//       return 2;
//     case "done":
//       return 5;
//     case "blocked":
//       return 4;
//     default:
//       return 3;
//   }
// }

// export function mapPriority(
//   code: number
// ): "low" | "normal" | "high" | "urgent" {
//   if (code <= 0) return "low";
//   if (code === 1) return "normal";
//   if (code === 2) return "high";
//   return "urgent";
// }

// export function determineTaskType(task: ANY, currentUserId?: number) {
//   const now = new Date();
//   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

//   if (currentUserId && task.assigneeId === currentUserId && task.dueDate) {
//     const due = new Date(task.dueDate);
//     if (
//       due.getFullYear() === today.getFullYear() &&
//       due.getMonth() === today.getMonth() &&
//       due.getDate() === today.getDate()
//     ) {
//       if (task.timeEstimate && task.createdAt) {
//         const createdAt = new Date(task.createdAt);
//         const timePassed = now.getTime() - createdAt.getTime();
//         const est = task.timeEstimate * 1000;
//         const remaining = est - timePassed;

//         if (remaining > 0 && remaining < est * 0.2) return "urgent";
//       }
//     }
//   }

//   if (currentUserId && task.assigneeId === currentUserId && task.dueDate) {
//     const due = new Date(task.dueDate);
//     if (
//       due.getFullYear() === today.getFullYear() &&
//       due.getMonth() === today.getMonth() &&
//       due.getDate() === today.getDate()
//     ) {
//       return "important";
//     }
//   }

//   if (currentUserId && task.assigneeId === currentUserId) {
//     if (task.UfCrmTask && task.UfCrmTask.includes('"REPLICATE":"Y"')) {
//       return "regular";
//     }
//   }

//   if (currentUserId && task.accomplices?.includes(currentUserId)) {
//     return "helping";
//   }

//   if (currentUserId && task.auditors?.includes(currentUserId)) {
//     return "controlling";
//   }

//   if (currentUserId && task.assigneeId === currentUserId && !task.dueDate) {
//     return "later";
//   }

//   return "normal";
// }
