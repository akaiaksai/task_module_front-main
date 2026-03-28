import MobileTaskCard from './MobileTaskCard';

export function MobileCalendarPanel({ project }: { project: ANY }) {
  const hours = ['1ч', '2ч', '3ч', '4ч', '5ч', '6ч', '7ч', '8ч', '9ч'];

  const tasks = project.tasks?.filter(
    (t: { DEADLINE?: string | null }) => !t.DEADLINE
  );

  const sortedTasks = tasks
    ?.slice()
    .sort((a: ANY, b: ANY) => a.TITLE.localeCompare(b.TITLE));

  console.log(project);

  const hourToPx = (h: number) => h * 32;

  return (
    <div className="flex border rounded-[10px] overflow-hidden">
      <div className="shrink-0">
        {hours?.map((h, i) => (
          <div
            key={i}
            className={`h-[32px] w-[34px] flex items-center justify-center text-[10px] text-white border-r ${i !== hours.length - 1 ? 'border-b border-white' : ''}`}
          >
            {h}
          </div>
        ))}
      </div>

      <div className="relative overflow-x-auto w-full">
        <div
          className="relative"
          style={{ height: hourToPx(hours.length), minWidth: '100%' }}
        >
          {hours?.map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-[32px] border-b border-white/10"
              style={{ top: i * 32 }}
            />
          ))}

          {sortedTasks?.map((task: ANY, idx: number) => (
            <div
              key={task.ID}
              className="absolute bg-[#5B6AF2CC] rounded-[10px] px-[5px] py-[5px] w-[133px]"
              style={{
                top: 0,
                left: idx * 137 + 15,
                height: hourToPx(task.TIME_ESTIMATE / 3600),
              }}
            >
              <MobileTaskCard task={task} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
