type TaskChunk = {
  day: Date;
  startHour: number;
  endHour: number;
};

const WORK_START = 8;
const WORK_END = 19;

export function splitForwardByWorkHours(
  start: Date,
  durationHours: number
): TaskChunk[] {
  if (!durationHours || durationHours <= 0) {
    return [];
  }

  const chunks: TaskChunk[] = [];
  let remaining = Math.ceil(durationHours);
  const cursor = new Date(start);

  if (cursor.getHours() < WORK_START) {
    cursor.setHours(WORK_START, 0, 0, 0);
  }

  if (cursor.getHours() >= WORK_END) {
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(WORK_START, 0, 0, 0);
  }

  while (remaining > 0) {
    const day = new Date(cursor);
    day.setHours(0, 0, 0, 0);

    const startHour = cursor.getHours();
    const availableToday = WORK_END - startHour;
    const used = Math.min(availableToday, remaining);

    if (used > 0) {
      chunks.push({
        day,
        startHour,
        endHour: startHour + used,
      });

      remaining -= used;
    }
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(WORK_START, 0, 0, 0);
  }

  return chunks;
}
