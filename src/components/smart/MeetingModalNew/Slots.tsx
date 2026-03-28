import {
  fetchProjects,
  fetchSmartProcessFunnels,
} from '@/lib/api/tasks/projects';
import { createTask } from '@/lib/api/tasks/tasks';
import { fetchUsers } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth';
import { useTaskFiltersStore } from '@/store/task-filters';
import { useUIStore } from '@/store/ui';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay, parseISO } from 'date-fns';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SlotsPanel } from '../SlotsPanel';
import { SelectBlock } from '../SlotsPanel/SelectBlock';
import {
  fetchCrmLeads,
  getMaybeString,
  useDebouncedValue,
  userDisplayName,
  userIdValue,
} from './SlotHelpers';

export const Slots = () => {
  const { selectedDate } = useTaskFiltersStore();
  const { meetingTasks, setDayTasks } = useUIStore();
  const { dayTasks } = useUIStore();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<30 | 60>(60);
  // формат / тип
  const [meetingFormat, setMeetingFormat] = useState<'Онлайн' | 'Оффлайн'>(
    'Онлайн'
  );
  const [meetingType, setMeetingType] = useState<'Продажа' | 'Демо' | 'Аудит'>(
    'Продажа'
  );

  useEffect(() => {
    const tasksForDay = meetingTasks.filter((t) => {
      if (!t.dueDate) {
        return false;
      }

      return isSameDay(parseISO(t.dueDate), selectedDate);
    });

    setDayTasks(tasksForDay);
  }, [meetingTasks, selectedDate, setDayTasks]);

  const handleSelectSlot = (slot: string, duration: 30 | 60) => {
    setSelectedSlot(slot);
    setSelectedDuration(duration);
  };

  const onClose = () => {
    setSelectedSlot(null);
  };
  const { userId } = useAuthStore();

  // хуки ДО return null
  const durationMinutes = selectedDuration;
  const [isSaving, setIsSaving] = useState(false);

  // funnels
  const [funnelLabel, setFunnelLabel] = useState<string>('Лид');

  const { data: funnelsData, isFetching: isFunnelsLoading } = useQuery({
    queryKey: ['smart-process-funnels'],
    queryFn: fetchSmartProcessFunnels,
    enabled: true,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const funnelOptions = useMemo(() => {
    const base = [{ label: 'Лид', entityTypeId: null as number | null }];
    const raw = (funnelsData as ANY)?.result ?? [];

    const mapped = (Array.isArray(raw) ? raw : [])
      .map((f: ANY) => ({
        label: f?.Title ?? f?.title ?? f?.NAME ?? f?.name ?? '',
        entityTypeId:
          typeof f?.EntityTypeID === 'number'
            ? f.EntityTypeID
            : typeof f?.entityTypeId === 'number'
              ? f.entityTypeId
              : null,
      }))
      .filter((x: ANY) => x.label && x.entityTypeId);

    const seen = new Set<string>();
    const uniq = mapped.filter((x: ANY) => {
      if (seen.has(x.label)) {
        return false;
      }
      seen.add(x.label);
      return true;
    });

    return [...base, ...uniq];
  }, [funnelsData]);

  const selectedEntityTypeId = useMemo(() => {
    return (
      funnelOptions.find((f) => f.label === funnelLabel)?.entityTypeId ?? null
    );
  }, [funnelOptions, funnelLabel]);

  const isLeadMode = selectedEntityTypeId === null;

  useEffect(() => {
    if (!funnelOptions.some((f) => f.label === funnelLabel)) {
      setFunnelLabel('Лид');
    }
  }, [funnelOptions]);

  // -----------------
  // SMART PROJECTS
  // -----------------
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [projectId, setProjectId] = useState<number | null>(null);

  const [projectQuery, setProjectQuery] = useState<string>('');
  const debouncedProjectQuery = useDebouncedValue(projectQuery, 250);

  const { data: projectsData, isFetching: isProjectsLoading } = useQuery({
    queryKey: ['projects-list', selectedEntityTypeId, debouncedProjectQuery],
    queryFn: () =>
      fetchProjects({
        entityTypeId: selectedEntityTypeId ?? undefined,
        search: debouncedProjectQuery.trim() || undefined,
      } as ANY),
    enabled: !!selectedEntityTypeId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const projectItems = (projectsData as ANY)?.result ?? [];
  const projectByTitle = useMemo(() => {
    const map = new Map<string, ANY>();
    for (const p of projectItems) {
      const t = getMaybeString(p?.title ?? p?.Title) || '';
      if (t && !map.has(t)) {
        map.set(t, p);
      }
    }
    return map;
  }, [projectItems]);

  const projectOptions = useMemo(() => {
    if (isLeadMode) {
      return [];
    }
    const titles = (Array.isArray(projectItems) ? projectItems : [])
      .map((p: ANY) => getMaybeString(p?.title ?? p?.Title))
      .filter(Boolean);
    return Array.from(new Set(titles));
  }, [projectItems, isLeadMode]);

  // -----------------
  // LEADS (for "Лид")
  // -----------------
  const [leadLabel, setLeadLabel] = useState<string>('');
  const [leadId, setLeadId] = useState<number | null>(null);
  const [leadCrmRef, setLeadCrmRef] = useState<string | null>(null);

  const [leadQuery, setLeadQuery] = useState<string>('');
  const debouncedLeadQuery = useDebouncedValue(leadQuery, 250);

  const { data: leadsData, isFetching: isLeadsLoading } = useQuery({
    queryKey: ['crm-leads', debouncedLeadQuery],
    queryFn: () => fetchCrmLeads(debouncedLeadQuery.trim()),
    enabled: isLeadMode,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const leadsList = (leadsData as ANY)?.result ?? [];
  const leadByOption = useMemo(() => {
    const map = new Map<string, ANY>();
    for (const l of leadsList) {
      const t = getMaybeString(l?.title ?? l?.Title) || 'Без названия';
      const id = l?.id ?? l?.ID;
      const label = `${t} — #${id}`;
      if (!map.has(label)) {
        map.set(label, l);
      }
    }
    return map;
  }, [leadsList]);

  const leadOptions = useMemo(
    () => Array.from(leadByOption.keys()),
    [leadByOption]
  );

  const leadTitle = useMemo(() => {
    if (!leadLabel) {
      return '';
    }
    return leadLabel.split(' — #')[0]?.trim() || '';
  }, [leadLabel]);

  // -----------------
  // USERS (executor) via /users?search=
  // -----------------
  const [presenterName, setPresenterName] = useState<string>('');
  const [presenterId, setPresenterId] = useState<number | null>(null);

  const [presenterQuery, setPresenterQuery] = useState<string>('');
  const [presenterOpened, setPresenterOpened] = useState(false);
  const debouncedPresenterQuery = useDebouncedValue(presenterQuery, 250);

  const { data: usersData, isFetching: isUsersLoading } = useQuery({
    queryKey: ['users', debouncedPresenterQuery],
    queryFn: () => fetchUsers(debouncedPresenterQuery.trim()),
    enabled: presenterOpened,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const usersList = (usersData as ANY)?.result ?? [];
  const userByLabel = useMemo(() => {
    const map = new Map<string, ANY>();
    for (const u of usersList) {
      const label = userDisplayName(u);
      if (label && !map.has(label)) {
        map.set(label, u);
      }
    }
    return map;
  }, [usersList]);

  const presenterOptions = useMemo(() => {
    const base = ['Я'];
    const extra = (Array.isArray(usersList) ? usersList : [])
      .map((u: ANY) => userDisplayName(u))
      .filter(Boolean);

    const uniq = Array.from(new Set(extra)).filter((x) => x !== 'Я');
    return [...base, ...uniq];
  }, [usersList]);

  // -----------------
  // reset on funnel change
  // -----------------
  useEffect(() => {
    setProjectTitle('');
    setProjectId(null);
    setProjectQuery('');

    setLeadLabel('');
    setLeadId(null);
    setLeadCrmRef(null);
    setLeadQuery('');
  }, [selectedEntityTypeId]);

  // -----------------
  // title/deadline
  // -----------------
  const crmEntityName = isLeadMode ? leadTitle || '—' : projectTitle || '—';

  const title = useMemo(() => {
    return `Встреча / ${meetingFormat} / ${meetingType} / ${crmEntityName}`;
  }, [meetingFormat, meetingType, crmEntityName]);

  const deadlineISO = useMemo(() => {
    if (!selectedSlot) {
      return null;
    }

    // парсим конец слота (например: "10:00" из "9:00 - 10:00")
    const parts = selectedSlot.split('-').map((s) => s.trim());
    const endPart = parts[1]; // конец слота (например "10:00")
    if (!endPart) {
      return null;
    }

    const [hhStr, mmStr] = endPart.split(':');
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
      return null;
    }

    const d = new Date(selectedDate);
    d.setHours(hh, mm, 0, 0); // ставим дедлайн на конец слота (например: 10:00)

    // Отнимаем 5 часов, чтобы компенсировать таймзону Битрикса
    d.setHours(d.getHours() - 5);

    return format(d, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  }, [selectedSlot, selectedDate]);

  const resolveResponsibleId = async (): Promise<number | null> => {
    if (!userId) {
      return null;
    }
    if (presenterName === 'Я') {
      return userId;
    }
    if (presenterId) {
      return presenterId;
    }

    // fallback
    try {
      const res = await fetchUsers(presenterName);
      const found = res?.result?.[0];
      return userIdValue(found);
    } catch {
      return null;
    }
  };

  const toHexTypeId = (n: number) => n.toString(16).toLowerCase();

  const buildUfCrmTask = (): string[] => {
    if (isLeadMode) {
      if (!leadId) {
        return [];
      }
      return [leadCrmRef ?? `L_${leadId}`];
    }

    if (selectedEntityTypeId && projectId) {
      return [`T${toHexTypeId(selectedEntityTypeId)}_${projectId}`];
    }

    return [];
  };

  const handleSave = async () => {
    if (!selectedSlot) {
      return toast.error('Слот не выбран');
    }
    if (!deadlineISO) {
      return toast.error('Не смог разобрать время слота');
    }
    if (!userId) {
      return toast.error('Не определён пользователь');
    }

    if (isLeadMode) {
      if (!leadId) {
        return toast.error('Выбери лид из списка');
      }
    } else {
      if (!projectId) {
        return toast.error('Выбери проект из списка');
      }
    }

    const UF_CRM_TASK = buildUfCrmTask();
    if (UF_CRM_TASK.length === 0) {
      return toast.error('CRM-привязка не сформирована');
    }

    setIsSaving(true);
    try {
      const responsibleId = await resolveResponsibleId();
      if (!responsibleId) {
        return toast.error('Не удалось определить исполнителя');
      }

      const payload = {
        TITLE: title,
        DESCRIPTION: [
          `Слот: ${selectedSlot}`,
          `Формат: ${meetingFormat}`,
          `Тип: ${meetingType}`,
          `CRM: ${UF_CRM_TASK.join(', ')}`,
          `Исполнитель: ${presenterName}`,
        ].join('\n'),

        RESPONSIBLE_ID: responsibleId,
        DEADLINE: deadlineISO,
        TIME_ESTIMATE: durationMinutes * 60,

        // ✅ главное: встреча + CRM
        isMeeting: true,
        UF_CRM_TASK,
      } as ANY;

      await createTask(payload);

      useUIStore.getState().setMeetingTasks([
        ...useUIStore.getState().meetingTasks,
        {
          id: Date.now(),
          dueDate: deadlineISO,
          isMeeting: true,
          TIME_ESTIMATE: durationMinutes * 60,
        } as ANY,
      ]);
      toast.success('Встреча создана');
      onClose();
    } catch (e) {
      console.error('create meeting error:', e);
      toast.error('Не удалось создать задачу');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <SlotsPanel
        selectedDate={selectedDate}
        tasks={dayTasks}
        onSelectSlot={handleSelectSlot}
        selectedSlot={selectedSlot}
      />
      {selectedSlot && (
        <div className="bg-[#8AE6FF1F] backdrop-blur-[10px] mt-6 py-[24px] px-[12px] rounded-[10px] font-roboto">
          <div className="relative rounded-xl border border-[#8AE6FF80] py-[8px] px-[10px] text-center bg-[#14C2C32E] font-semibold ui-glow">
            {selectedSlot}

            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-4 mx-auto max-w-[300px]">
            <div className="flex gap-3 justify-center">
              <Chip
                label="Онлайн"
                selected={meetingFormat === 'Онлайн'}
                onClick={() => setMeetingFormat('Онлайн')}
              />
              <Chip
                label="Оффлайн"
                selected={meetingFormat === 'Оффлайн'}
                onClick={() => setMeetingFormat('Оффлайн')}
              />
            </div>

            <Divider />

            {/* тип */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Chip
                label="Продажа"
                selected={meetingType === 'Продажа'}
                onClick={() => setMeetingType('Продажа')}
              />
              <Chip
                label="Демо"
                selected={meetingType === 'Демо'}
                onClick={() => setMeetingType('Демо')}
              />
              <Chip
                label="Аудит"
                selected={meetingType === 'Аудит'}
                onClick={() => setMeetingType('Аудит')}
              />
            </div>

            <Divider />
          </div>
          <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-[10px] mt-4 ">
            <SelectBlock
              title="Воронка"
              variant="picker"
              options={funnelOptions.map((f) => f.label)}
              value={funnelLabel}
              onChange={setFunnelLabel}
              allowCustom={false}
              isLoading={isFunnelsLoading}
            />

            <div className="bg-white/60 w-[1px] h-full" />

            {isLeadMode ? (
              <SelectBlock
                className=""
                title="Лид"
                variant="search"
                options={leadOptions}
                value={leadLabel}
                onChange={(v) => {
                  setLeadLabel(v);

                  const lead = leadByOption.get(v);
                  const id = lead?.id ?? lead?.ID;
                  setLeadId(typeof id === 'number' ? id : null);

                  const ref = lead?.crmRef;
                  setLeadCrmRef(typeof ref === 'string' ? ref : null);

                  // инпут поиска ведём по названию (без "#id")
                  const t = v.split(' — #')[0]?.trim() || '';
                  setLeadQuery(t);
                }}
                searchQuery={leadQuery}
                onSearchQueryChange={(q) => {
                  setLeadQuery(q);
                  // пока печатает — сброс выбора
                  setLeadLabel('');
                  setLeadId(null);
                  setLeadCrmRef(null);
                }}
                placeholder="Найти лид…"
                allowCustom={false}
                isLoading={isLeadsLoading}
              />
            ) : (
              <SelectBlock
                title="Проект"
                variant="search"
                options={projectOptions}
                value={projectTitle}
                onChange={(v) => {
                  setProjectTitle(v);
                  setProjectQuery(v);

                  const found = projectByTitle.get(v);
                  const id = (found?.id ?? found?.ID) as number | undefined;
                  setProjectId(typeof id === 'number' ? id : null);
                }}
                searchQuery={projectQuery}
                onSearchQueryChange={(q) => {
                  setProjectQuery(q);
                  setProjectTitle(q);
                  const found = projectByTitle.get(q);
                  const id = (found?.id ?? found?.ID) as number | undefined;
                  setProjectId(typeof id === 'number' ? id : null);
                }}
                placeholder="Найти проект…"
                allowCustom={false}
                isLoading={isProjectsLoading}
              />
            )}

            <div className="bg-white/60 w-[1px] h-full" />

            <SelectBlock
              title="Кто проведёт?"
              variant="search"
              options={presenterOptions}
              value={presenterName}
              onChange={(v) => {
                setPresenterName(v);
                setPresenterQuery(v);

                if (v === 'Я') {
                  setPresenterId(null);
                  return;
                }

                const u = userByLabel.get(v);
                setPresenterId(userIdValue(u));
              }}
              searchQuery={presenterQuery}
              onSearchQueryChange={(q) => {
                setPresenterOpened(true);
                setPresenterQuery(q);
                setPresenterName(q);

                // если совпало — поставим ID, иначе null
                const u = userByLabel.get(q);
                setPresenterId(userIdValue(u));
              }}
              placeholder="Найти сотрудника…"
              allowCustom={false}
              isLoading={isUsersLoading}
            />
          </div>
          <div className="max-w-[300px] mx-auto flex mt-6 border-t border-white/60 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving || !selectedSlot}
              className="rounded-[10px] border w-[95px] text-[12px] py-[6px] px-[10px] mx-auto"
            >
              {isSaving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-[20px] py-[6px]
        rounded-[10px]
        border
        text-[12px] tracking-[-0.5px]
        transition
        ${selected ? 'border-white bg-white/10' : 'border-white/60 text-white/80'}
      `}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-white/60" />;
}
