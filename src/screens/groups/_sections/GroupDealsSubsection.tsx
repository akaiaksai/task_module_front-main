import { format, parseISO } from 'date-fns';
import { Calendar, ChevronDown, Pin, PinOff } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserLocal } from '../../../hooks/users/useUserLocal';
import TaskModal from '../../tasks/_desktop/_tasks-modals/TaskModal';

import {
  ProjectWithTasks,
  useProjectsWithTasks,
} from '../../../hooks/groups/useProjectsWithTasks';

// COMMENT
// interface GroupProjectsSectionProps {
//   members: ANY[];
//   onTaskClick: (taskId: string) => void;
//   tasks?: Task[];
// }

const getProjectKey = (project: ProjectWithTasks) =>
  `${project.ID}-${project.EntityTypeID}`;

interface CompactProjectItemProps {
  project: ProjectWithTasks;
  onTaskClick: (taskId: string) => void;
  onTaskDragStart: (e: React.DragEvent, task: ANY) => void;
  onTaskDragEnd: (e: React.DragEvent) => void;
  onTogglePin: () => void;
}

function CompactProjectItem({
  project,
  onTaskClick,
  onTaskDragStart,
  onTaskDragEnd,
  onTogglePin,
}: CompactProjectItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getDisplayNameById } = useUserLocal.useUsersMap();
  const assignedByName = getDisplayNameById(
    Number(project.AssignedByID?.String)
  );

  const getStageValue = (
    stageId: { String: string } | string | null | undefined
  ): string => {
    if (!stageId) {
      return '';
    }
    if (typeof stageId === 'string') {
      return stageId;
    }
    return stageId.String || '';
  };

  const getStageStyle = (stageId?: { String: string } | string | null) => {
    const s = getStageValue(stageId).toUpperCase();
    if (s.includes('WON') || s.includes('SUCCESS')) {
      return 'bg-green-100 text-green-800 border border-green-200';
    }
    if (s.includes('LOST') || s.includes('FAIL')) {
      return 'bg-red-100 text-red-800 border border-red-200';
    }
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  };

  const getStageText = (stageId?: { String: string } | string | null) => {
    const s = getStageValue(stageId).toUpperCase();
    if (s.includes('WON') || s.includes('SUCCESS')) {
      return 'Завершен';
    }
    if (s.includes('LOST') || s.includes('FAIL')) {
      return 'Отменен';
    }
    return 'В работе';
  };

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(
    (task) => task.status === 'done'
  ).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between p-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center gap-2 text-left"
        >
          <ChevronDown
            className={`h-3 w-3 text-gray-500 transition-transform flex-shrink-0 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {project.Title.String}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className={`text-xs px-1.5 py-0.5 rounded ${getStageStyle(
                  project.StageID
                )}`}
              >
                {getStageText(project.StageID)}
              </div>
              <div className="text-xs text-gray-500">
                {completedTasks}/{totalTasks}
              </div>
              {assignedByName && (
                <div className="text-xs text-gray-500 truncate flex-1 min-w-0">
                  {assignedByName}
                </div>
              )}
            </div>
          </div>
        </button>

        <button
          onClick={onTogglePin}
          className="ml-1 p-[clamp(0.3rem,0.4vw,0.5rem)] rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all duration-150 flex-shrink-0"
          title="Прикрепить к экрану"
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-gray-200">
          <div className="p-[clamp(0.3rem,0.6vw,0.6rem)] space-y-1">
            {project.tasks.length > 0 ? (
              (console.log('PROJECT TASKS', project.tasks),
              project.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => onTaskDragStart(e, task)}
                  onDragEnd={onTaskDragEnd}
                  onClick={() => onTaskClick(task.id.toString())}
                  className="flex items-center gap-2 p-1.5 bg-gray-50 rounded border border-gray-200 
                             cursor-grab hover:bg-gray-100 transition-colors active:cursor-grabbing group text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {task.title}
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center text-gray-500 gap-0.5 mt-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        {format(parseISO(task.dueDate), 'dd.MM.yyyy')}
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                      task.status === 'done'
                        ? 'bg-green-100 text-green-800'
                        : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {task.status === 'done'
                      ? 'Завершена'
                      : task.status === 'in_progress'
                        ? 'В работе'
                        : 'Ожидает'}
                  </div>
                </div>
              )))
            ) : (
              <div className="text-gray-400 text-center text-xs py-2">
                Нет активных задач
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProjectColumnProps {
  project: ProjectWithTasks;
  onTaskClick: (taskId: string) => void;
  onTaskDragStart: (e: React.DragEvent, task: ANY) => void;
  onTaskDragEnd: (e: React.DragEvent) => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

function ProjectColumn({
  project,
  onTaskClick,
  onTaskDragStart,
  onTaskDragEnd,
  isPinned,
  onTogglePin,
}: ProjectColumnProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { getDisplayNameById } = useUserLocal.useUsersMap();
  const assignedByName = getDisplayNameById(
    Number(project.AssignedByID?.String)
  );

  const getStageValue = (
    stageId: { String: string } | string | null | undefined
  ): string => {
    if (!stageId) {
      return '';
    }
    if (typeof stageId === 'string') {
      return stageId;
    }
    return stageId.String || '';
  };

  const getStageStyle = (stageId?: { String: string } | string | null) => {
    const s = getStageValue(stageId).toUpperCase();
    if (s.includes('WON') || s.includes('SUCCESS')) {
      return 'bg-green-100 text-green-800 border border-green-200';
    }
    if (s.includes('LOST') || s.includes('FAIL')) {
      return 'bg-red-100 text-red-800 border border-red-200';
    }
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  };

  const getStageText = (stageId?: { String: string } | string | null) => {
    const s = getStageValue(stageId).toUpperCase();
    if (s.includes('WON') || s.includes('SUCCESS')) {
      return 'Завершен';
    }
    if (s.includes('LOST') || s.includes('FAIL')) {
      return 'Отменен';
    }
    return 'В работе';
  };

  return (
    <div
      className={`
        flex flex-col w-64 bg-white rounded-lg border border-gray-200 shadow-sm
        ${isPinned ? 'shadow-lg border-2 border-blue-300' : ''}
        transition-all duration-200
      `}
    >
      <div className="flex justify-between items-start p-2 bg-gray-50 rounded-t-lg">
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="flex-1 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-medium text-gray-900 truncate max-w-[200px]"
                title={project.Title.String}
              >
                {project.Title.String}
              </h3>
              {assignedByName && (
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {assignedByName}
                </div>
              )}
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-gray-400 transition-transform flex-shrink-0 mt-0.5 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="flex-1 flex flex-col p-1.5 gap-1 overflow-y-auto max-h-52">
          {project.tasks.length > 0 ? (
            project.tasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => onTaskDragStart(e, task)}
                onDragEnd={onTaskDragEnd}
                onClick={() => onTaskClick(task.id.toString())}
                className="bg-gray-50 border border-gray-200 rounded p-1.5 cursor-grab hover:bg-gray-100
                           text-xs transition-colors active:cursor-grabbing"
              >
                <div className="font-medium text-gray-800 truncate">
                  {task.title}
                </div>
                {task.dueDate && (
                  <div className="flex items-center text-gray-500 gap-0.5 mt-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(parseISO(task.dueDate), 'dd.MM.yyyy')}
                  </div>
                )}
                <div
                  className={`text-xs mt-0.5 ${
                    task.status === 'done'
                      ? 'text-green-600'
                      : task.status === 'in_progress'
                        ? 'text-blue-600'
                        : 'text-yellow-600'
                  }`}
                >
                  {task.status === 'done'
                    ? 'Завершена'
                    : task.status === 'in_progress'
                      ? 'В работе'
                      : 'Ожидает'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center text-xs py-2">
              Нет активных задач
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <div
          className={`text-xs font-medium px-2 py-1 rounded ${getStageStyle(
            project.StageID
          )}`}
        >
          {getStageText(project.StageID)}
        </div>

        <button
          onClick={onTogglePin}
          className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          title="Открепить"
        >
          <PinOff className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface GroupProjectsSubsectionProps {
  projects: ProjectWithTasks[];
  pinnedColumns: Set<string>;
  onTogglePin: (projectKey: string) => void;
  onTaskClick: (taskId: string) => void;
  onTaskDragStart: (e: React.DragEvent, task: ANY) => void;
  onTaskDragEnd: (e: React.DragEvent) => void;
}

function GroupProjectsSubsection({
  projects,
  pinnedColumns,
  onTogglePin,
  onTaskClick,
  onTaskDragStart,
  onTaskDragEnd,
}: GroupProjectsSubsectionProps) {
  if (!projects?.length) {
    return (
      <div className="text-center py-3 text-gray-500 text-sm">
        Нет смарт-контрактов с активными задачами
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-[clamp(0.5rem,1vw,1rem)] w-full">
        {projects
          .filter((p) => !pinnedColumns.has(getProjectKey(p)))
          .map((p) => (
            <CompactProjectItem
              key={getProjectKey(p)}
              project={p}
              onTaskClick={onTaskClick}
              onTaskDragStart={onTaskDragStart}
              onTaskDragEnd={onTaskDragEnd}
              onTogglePin={() => onTogglePin(getProjectKey(p))}
            />
          ))}
      </div>
      <TaskModal />
    </>
  );
}

// COMMENT
// export function GroupProjectsSection({
//   members,
//   onTaskClick,
//   tasks, // пока оставляем для совместимости, но внутри его больше не используем
// }: GroupProjectsSectionProps) {
export function GroupProjectsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔥 Всегда грузим проекты + их задачи с бэка, с excludeCompleted
  const { projects } = useProjectsWithTasks({
    excludeCompleted: true,
    mode: 'backend',
  });

  const handleTaskClick = (taskId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('m', 'task');
    params.set('id', taskId);
    setSearchParams(params, { replace: true });
  };

  const handleTaskDragStart = (e: React.DragEvent, task: ANY) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ ID: task.id, task })
    );
    e.currentTarget.classList.add('opacity-50', 'scale-[0.97]');
  };

  const handleTaskDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50', 'scale-[0.97]');
  };

  const togglePinColumn = (projectKey: string) => {
    setPinnedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectKey)) {
        newSet.delete(projectKey);
      } else {
        newSet.add(projectKey);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Закрепленные проекты - ВНЕ секции, всегда видны */}
      {pinnedColumns.size > 0 && (
        <div className="fixed top-[clamp(4rem,10vw,8rem)] right-[clamp(0.5rem,2vw,2rem)] z-50 space-y-3 max-h-[80vh] overflow-y-auto">
          {projects
            ?.filter((project) => pinnedColumns.has(getProjectKey(project)))
            .map((project) => (
              <ProjectColumn
                key={`pinned-${getProjectKey(project)}`}
                project={project}
                onTaskClick={handleTaskClick}
                onTaskDragStart={handleTaskDragStart}
                onTaskDragEnd={handleTaskDragEnd}
                isPinned={true}
                onTogglePin={() => togglePinColumn(getProjectKey(project))}
              />
            ))}
        </div>
      )}

      {/* Основная секция проектов (сворачиваемая) */}
      <div className="flex flex-col border border-gray-200 rounded-lg bg-white shadow-sm w-full overflow-hidden transition-all">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex itemscenter justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
        >
          <h2 className="text-[clamp(0.85rem,1vw,1rem)] font-semibold text-gray-800">
            Проекты и их задачи
          </h2>
          <ChevronDown
            className={`h-[clamp(0.7rem,1vw,0.9rem)] w-[clamp(0.7rem,1vw,0.9rem)] text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div
          className={`transition-all duration-300 overflow-hidden ${
            isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-[clamp(0.5rem,1vw,1rem)]">
            <GroupProjectsSubsection
              projects={projects || []}
              pinnedColumns={pinnedColumns}
              onTogglePin={togglePinColumn}
              onTaskClick={handleTaskClick}
              onTaskDragStart={handleTaskDragStart}
              onTaskDragEnd={handleTaskDragEnd}
            />
          </div>
        </div>
      </div>
    </>
  );
}
