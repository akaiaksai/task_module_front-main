// SmartContractsListDesktop.tsx
import Input from '@/ui/Input';
import Skeleton from '@/ui/Skeleton';
import { Building, Filter, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  buildElapsedMap,
  calcProjectProgress,
} from '@/hooks/tasks/elapsed-times/projectElapsed';
import { fetchUsers } from '@/lib/api/users';
import { useQueries, useQuery } from '@tanstack/react-query';
import { TaskFilters } from '../../../components/tasks/TaskFilters';
import { useProjectsWithTasks } from '../../../hooks/groups/useProjectsWithTasks';
import { useSmartProcessTypes } from '../../../hooks/groups/useSmartProcessTypes';
import { useTasks } from '../../../hooks/tasks/useTaskActions';
import { getElapsedTimeForUser } from '../../../lib/api/tasks/elapsed-time';
import { useAuthStore } from '../../../store/auth';
import { useTaskFiltersStore } from '../../../store/task-filters';
import Select from '../../../ui/Select';
import TaskModal from '../../tasks/_desktop/_tasks-modals/TaskModal';
import { ProjectCard } from './ProjectCard';

export default function SmartContractsListDesktop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, userId } = useAuthStore();

  const {
    onlyMyTasks,
    onlyAuditor,
    onlyAccomplice,
    onlyCreator,
    search: globalSearch,
    status: globalStatus,
    period: globalPeriod,
    resetFiltersForProjects,
    setStatus: setGlobalStatus,
  } = useTaskFiltersStore();

  useEffect(() => {
    resetFiltersForProjects();
    setGlobalStatus(' ');
  }, []);

  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    responsibleId: '',
    createdBy: '',
    status: ' ',
  });
  // const [selectedStage, setSelectedStage] = useState<string>('all');
  const selectedStage = 'all';
  const [selectedType, setSelectedType] = useState<number | 'all'>('all');
  const [projectSearch, setProjectSearch] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const [projectsPerSlide, setProjectsPerSlide] = useState(3);
  //eslint-disable-next-line
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setProjectsPerSlide(1);
        setIsMobile(true);
      } else if (width < 1020) {
        setProjectsPerSlide(2);
        setIsMobile(false);
      } else if (width < 1275) {
        setProjectsPerSlide(3);
        setIsMobile(false);
      } else {
        setProjectsPerSlide(4);
        setIsMobile(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Параметры для фильтрации задач
  const taskQueryParams = useMemo(() => {
    const params: ANY = {
      page: 1,
      perPage: 10000,
      search: globalSearch || undefined,
      status: globalStatus || undefined,
      period: (globalPeriod as ANY) || undefined,
      // responsibleId:
      //   isAdmin && localFilters.responsibleId
      //     ? Number(localFilters.responsibleId)
      //     : undefined,
      // createdBy:
      //   isAdmin && localFilters.createdBy
      //     ? Number(localFilters.createdBy)
      //     : undefined,
      onlyMyTasks,
      onlyAuditor,
      onlyAccomplice,
      onlyCreator,
      currentUserId: userId,
    };

    Object.keys(params).forEach((key) => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    return params;
  }, [
    onlyMyTasks,
    onlyAuditor,
    onlyAccomplice,
    onlyCreator,
    globalSearch,
    globalPeriod,
    globalStatus,
    localFilters.responsibleId,
    localFilters.createdBy,
    isAdmin,
    userId,
  ]);

  // Получаем отфильтрованные задачи
  const { data: tasksData, isLoading: isLoadingTasks } = useTasks(
    taskQueryParams,
    {
      keepPreviousData: true,
      enabled: !isAdmin,
    }
  );

  const allTasks = tasksData?.items || [];
  const { projects: allProjects, isLoading: isLoadingProjects } =
    useProjectsWithTasks(
      isAdmin
        ? {
            mode: 'backend',
          }
        : {
            tasks: allTasks,
            mode: 'tasks-only',
          }
    );

  // 1. Получаем всех пользователей
  const { data: allUsersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => fetchUsers(''),
    staleTime: 5 * 60 * 1000,
  });

  const users = allUsersData?.result || [];

  // 2. Динамически создаем запросы для каждого пользователя
  const elapsedQueries = useQueries({
    queries: users.map((user) => ({
      queryKey: ['user-elapsed', user.ID],
      queryFn: () =>
        getElapsedTimeForUser(
          user.ID,
          new Date('2000-01-01'),
          new Date('2100-01-01')
        ),
      enabled: !!user.ID, // Запрос пойдет только если есть ID
    })),
  });

  // Проверяем, загрузились ли все данные
  // const isElapsedLoading = elapsedQueries.some(
  //   (query: boolean) => query.isLoading
  // );
  const allElapsedData = elapsedQueries
    .map((query) => query.data)
    .filter(Boolean);

  // 1. Собираем все ответы в один плоский массив записей
  const flatRecords = useMemo(() => {
    return allElapsedData.flatMap((item: ANY) => item.result || []);
  }, [allElapsedData]);

  // 2. Передаем плоский массив в вашу готовую функцию
  const elapsedMap = useMemo(() => {
    return buildElapsedMap(flatRecords);
  }, [flatRecords]);

  const { types, isLoading: isLoadingTypes } = useSmartProcessTypes();

  // Фильтрация проектов
  const filteredProjects = useMemo(() => {
    let result = allProjects;

    // Убираем дубликаты по ID
    const uniqueProjects = result.filter(
      (project, index, self) =>
        index ===
        self.findIndex(
          (p) => p.ID === project.ID && project.EntityTypeID === p.EntityTypeID
        )
    );

    result = uniqueProjects;

    if (!isAdmin) {
      result = result.filter((project) =>
        project.tasks.some((task) => task.assigneeId === Number(userId))
      );
    }

    // Фильтр по названию проекта
    if (projectSearch.trim()) {
      const searchTerm = projectSearch.toLowerCase().trim();
      result = result.filter((project) => {
        const projectTitle = project.Title?.String || '';
        return projectTitle.toLowerCase().includes(searchTerm);
      });
    }

    // Фильтр по стадии проекта
    if (selectedStage !== 'all') {
      result = result.filter((project) => {
        const stageValue = project.StageID?.String || '';
        return stageValue.toLowerCase().includes(selectedStage);
      });
    }

    // Фильтр по типу проекта
    if (selectedType !== 'all') {
      result = result.filter(
        (project) => project.EntityTypeID === selectedType
      );
    }

    return result;
  }, [
    allProjects,
    isAdmin,
    userId,
    projectSearch,
    selectedStage,
    selectedType,
  ]);

  const projectsWithProgress = useMemo(() => {
    return filteredProjects.map((project) => ({
      ...project,
      __progress: calcProjectProgress(project.tasks || [], elapsedMap),
    }));
  }, [filteredProjects, elapsedMap]);

  const totalSlides = Math.max(
    1,
    Math.ceil(filteredProjects.length / projectsPerSlide)
  );

  // Сброс слайда при изменениях
  useEffect(() => {
    setCurrentSlide(0);
  }, [
    projectsPerSlide,
    projectSearch,
    selectedStage,
    selectedType,
    globalSearch,
    globalStatus,
    globalPeriod,
  ]);

  useEffect(() => {
    if (totalSlides > 0 && currentSlide >= totalSlides) {
      setCurrentSlide(totalSlides - 1);
    } else if (totalSlides === 0) {
      setCurrentSlide(0);
    }
  }, [filteredProjects, totalSlides, currentSlide]);

  const handleLocalFilterChange = useCallback(
    (newFilters: { responsibleId?: string; createdBy?: string }) => {
      setLocalFilters((prev) => ({
        ...prev,
        ...newFilters,
      }));
      setCurrentSlide(0);
    },
    []
  );

  const handleFiltersChange = useCallback(() => {
    setCurrentSlide(0);
  }, []);

  const handleProjectSearchChange = useCallback((value: string) => {
    setProjectSearch(value);
    setCurrentSlide(0);
  }, []);

  const handleTaskClick = useCallback(
    (taskId: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('m', 'task');
      newParams.set('id', taskId.toString());
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const isLoading = isAdmin ? isLoadingProjects : isLoadingTasks;

  return (
    <div className="space-y-5 mt-0 max-w-[1302px] mx-auto">
      {/* Панель поиска и фильтров */}
      <div className="hidden bg-white p-3 rounded-[14px] border border-[#D9DFE8]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Поиск */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Input
              placeholder="Поиск по названию проекта..."
              value={projectSearch}
              onChange={(e) => handleProjectSearchChange(e.target.value)}
              disabled={isLoading}
              className="flex-1 h-[36px] rounded-[10px] border-[#DFE6EE] text-[12px] leading-[130%]"
            />
          </div>

          {/* Контейнер для кнопок */}
          <div
            className="
        flex items-stretch
        gap-3
        sm:gap-3
        max-[639px]:gap-2 max-[639px]:flex-nowrap
        max-[346px]:flex-col max-[346px]:gap-2 max-[346px]:w-full
      "
          >
            {/* Тип проекта */}
            <div className="flex items-center gap-2 max-[346px]:w-full">
              <Select
                value={selectedType}
                onChange={(val) => {
                  setSelectedType(val === 'all' ? 'all' : Number(val));
                  setCurrentSlide(0);
                }}
                options={[
                  { label: 'Все типы', value: 'all' },
                  ...(isLoadingTypes
                    ? [{ label: 'Загрузка...', value: 'loading' }]
                    : types.map((t) => ({
                        label: t.Title?.String || `Тип ${t.EntityTypeID}`,
                        value: t.EntityTypeID,
                      }))),
                ]}
                disabled={isLoadingTypes}
                className="min-w-[120px] max-[346px]:w-full rounded-r-none max-[639px]:rounded-r-none"
              />
            </div>

            {/* Кнопка фильтров */}
            <div className="flex items-center max-[346px]:w-full">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
            flex items-center justify-center px-3 py-1.5 border text-sm
            rounded-[10px] transition-colors
            max-[346px]:w-full
            ${
              showFilters
                ? 'bg-[#EAF7FF] border-[#8AE6FF80] text-[#1C3A4A]'
                : 'bg-white border-[#DFE6EE] text-[#4E6172] hover:bg-gray-50'
            }
          `}
              >
                <Filter className="h-4 w-4 mr-1.5" />
                <span>Фильтры</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Блок расширенных фильтров */}
      {showFilters && (
        <div className="hidden bg-white p-3 rounded-[14px] border border-[#D9DFE8]">
          <TaskFilters
            isFetchingTasks={isLoading}
            onFiltersChange={handleFiltersChange}
            showRoleFilters={true}
            showAdminFilters={isAdmin}
            localFilters={localFilters}
            onLocalFilterChange={handleLocalFilterChange}
          />
        </div>
      )}

      {/* Список проектов */}
      <div className="relative">
        {isLoading && <LoadingOverlay />}

        {isLoading && filteredProjects.length === 0 ? (
          <ContractsSkeleton projectsPerSlide={projectsPerSlide} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            isAdmin={isAdmin}
            hasSearch={!!projectSearch.trim()}
            searchTerm={projectSearch}
          />
        ) : (
          <>
            {projectSearch.trim() && (
              <div className="mb-3 p-2 bg-[#EAF7FF] rounded-lg border border-[#8AE6FF66]">
                <p className="text-sm text-[#1C3A4A]">
                  Найдено: <strong>{filteredProjects.length}</strong> по
                  запросу: <strong>"{projectSearch}"</strong>
                </p>
              </div>
            )}

            <div className="space-y-6">
              {projectsWithProgress.map((project) => (
                <ProjectCard
                  key={`${project.ID}-${project.EntityTypeID}`}
                  project={project}
                  projectProgress={project.__progress}
                  isAdmin={isAdmin}
                  userId={userId}
                  handleTaskClick={handleTaskClick}
                  allUsersElapsedTimeMap={elapsedMap}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <TaskModal />
    </div>
  );
}

const EmptyState = ({
  isAdmin,
  hasSearch = false,
  searchTerm = '',
}: {
  isAdmin: boolean;
  hasSearch?: boolean;
  searchTerm?: string;
}) => (
  <div className="text-center py-8 text-gray-500">
    <Building className="h-12 w-12 mx-auto mb-3 text-gray-400" />
    {hasSearch ? (
      <>
        <p className="text-base font-medium">Проекты не найдены</p>
        <p className="text-sm mt-1">
          По запросу <strong>"{searchTerm}"</strong> ничего не найдено
        </p>
      </>
    ) : (
      <>
        <p className="text-base font-medium">
          {isAdmin ? 'Проекты не найдены' : 'Нет проектов с вашими задачами'}
        </p>
      </>
    )}
  </div>
);

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-[14px]">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-[#2A607A]" />
      <p className="text-sm text-gray-600">Загрузка данных...</p>
    </div>
  </div>
);

const ContractsSkeleton = ({
  projectsPerSlide,
}: {
  projectsPerSlide: number;
}) => (
  <div
    className={`grid grid-cols-1 ${
      projectsPerSlide >= 2 ? 'sm:grid-cols-2' : ''
    } ${projectsPerSlide >= 3 ? 'lg:grid-cols-3' : ''} ${
      projectsPerSlide >= 4 ? 'xl:grid-cols-4' : ''
    } gap-3`}
  >
    {[...Array(projectsPerSlide)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-[14px] border border-[#D9DFE8] p-4 flex flex-col h-[680px]"
      >
        <div className="mb-3">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full mb-3" />
        <div className="space-y-1.5 flex-1 overflow-hidden">
          {[...Array(8)].map((_, j) => (
            <Skeleton key={j} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    ))}
  </div>
);
