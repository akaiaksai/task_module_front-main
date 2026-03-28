import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { createTask } from '@/lib/api/tasks/tasks';
import { fetchUsers } from '@/lib/api/users';
import { http } from '@/lib/http';
import { useAuthStore } from '@/store/auth';
import { useTaskFiltersStore } from '@/store/task-filters';
import { SelectBlock } from './SelectBlock';

import {
  fetchProjects,
  fetchSmartProcessFunnels,
} from '@/lib/api/tasks/projects';

type SlotDuration = 30 | 60;

function getMaybeString(v: ANY): string {
  if (!v) {
    return '';
  }
  if (typeof v === 'string') {
    return v;
  }
  const valid = v.Valid ?? v.valid;
  const str = v.String ?? v.string;
  if (typeof str === 'string' && (valid === true || valid === undefined)) {
    return str;
  }
  return '';
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// ---- CRM Leads ----
async function fetchCrmLeads(search: string): Promise<{ result: ANY[] }> {
  const params = search ? { search } : {};
  const { data } = await http.get<{ result: ANY[] }>('/crm/leads/list', {
    params,
  });
  return data;
}

// ---- Users helpers ----
function userDisplayName(u: ANY): string {
  const first = getMaybeString(u?.name ?? u?.Name);
  const last = getMaybeString(u?.lastName ?? u?.LastName);
  const full = [last, first].filter(Boolean).join(' ').trim();
  return full || first || last || `User#${u?.id ?? u?.ID ?? '??'}`;
}

function userIdValue(u: ANY): number | null {
  const id = u?.id ?? u?.ID;
  return typeof id === 'number' ? id : null;
}

export function SlotCreateModal({
  open,
  slot,
  duration = 60,
  onClose,
}: {
  open: boolean;
  slot: string | null;
  duration?: SlotDuration;
  onClose: () => void;
}) {
  const { userId } = useAuthStore();
  const { selectedDate } = useTaskFiltersStore();

  // хуки ДО return null
  const durationMinutes: SlotDuration = duration === 30 ? 30 : 60;
  const [isSaving, setIsSaving] = useState(false);

  // формат / тип
  const [meetingFormat, setMeetingFormat] = useState<'Онлайн' | 'Оффлайн'>(
    'Онлайн'
  );
  const [meetingType, setMeetingType] = useState<'Продажа' | 'Демо' | 'Аудит'>(
    'Продажа'
  );

  // funnels
  const [funnelLabel, setFunnelLabel] = useState<string>('Лид');

  const { data: funnelsData, isFetching: isFunnelsLoading } = useQuery({
    queryKey: ['smart-process-funnels'],
    queryFn: fetchSmartProcessFunnels,
    enabled: open,
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
    enabled: open && !!selectedEntityTypeId,
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
    enabled: open && isLeadMode,
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
  const [presenterOpened, setPresenterOpened] = useState(false);

  const [presenterQuery, setPresenterQuery] = useState<string>('');
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

  useEffect(() => {
    if (open) {
      setPresenterOpened(true);
      setPresenterQuery('');
    }
  }, [open]);

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
    if (!slot) {
      return null;
    }

    // парсим конец слота (например: "10:00" из "9:00 - 10:00")
    const parts = slot.split('-').map((s) => s.trim());
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

    console.log(d);

    return format(d, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  }, [slot, selectedDate]);

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
    if (!slot) {
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
          `Слот: ${slot}`,
          `Формат: ${meetingFormat}`,
          `Тип: ${meetingType}`,
          `CRM: ${UF_CRM_TASK.join(', ')}`,
          `Исполнитель: ${presenterName}`,
        ].join('\n'),

        RESPONSIBLE_ID: responsibleId,
        DEADLINE: deadlineISO,
        TIME_ESTIMATE: durationMinutes * 60,

        isMeeting: true,
        UF_CRM_TASK,
      } as ANY;

      console.log(payload);

      await createTask(payload);
      toast.success('Встреча создана');
      onClose();
    } catch (e) {
      console.error('create meeting error:', e);
      toast.error('Не удалось создать задачу');
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overscroll-contain">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative ui-glow rounded-[20px] p-[24px] max-h-[90dvh] max-w-2xl overflow-hidden bg-mobile-header flex flex-col">
        <div
          className="
          bg-[#8AE6FF1F]
          rounded-[10px]
          h-full
          min-h-0
              flex
              flex-col
              text-white
              font-roboto
            "
        >
          <div className="px-3 pt-6">
            <div className="relative rounded-xl border border-[#8AE6FF80] py-[8px] px-[10px] text-center bg-[#14C2C32E] font-semibold ui-glow">
              {slot}
              <div className="mt-1 text-[12px] font-medium text-white/70">
                {durationMinutes} мин
              </div>

              <button
                onClick={onClose}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-[12px] pt-[14px] space-y-[12px]">
            {/* формат */}
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

            {/* Воронка: picker */}
            <SelectBlock
              title="Воронка"
              variant="picker"
              options={funnelOptions.map((f) => f.label)}
              value={funnelLabel}
              onChange={setFunnelLabel}
              allowCustom={false}
              isLoading={isFunnelsLoading}
            />

            <Divider />

            {/* CRM сущность: Лид или Проект */}
            {isLeadMode ? (
              <SelectBlock
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
                  setPresenterOpened(true);
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

            <Divider />

            {/* Исполнитель: search + /users */}
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

            <Divider />

            <div className="px-[13px] pt-1">
              <p className="text-[12px] text-white/70 leading-[130%]">
                Название задачи:
              </p>
              <p className="text-[12px] font-semibold leading-[130%]">
                {title}
              </p>
            </div>
          </div>

          <div className="px-[106px] pt-[14px] pb-[24px]">
            <button
              onClick={handleSave}
              disabled={isSaving || !slot}
              className="
                rounded-xl border border-white/40
                py-[6px] px-[19px]
                text-[12px] font-medium tracking-[-0.5px] leading-[130%]
                hover:bg-white/10 transition
                disabled:opacity-50 disabled:hover:bg-transparent
              "
            >
              {isSaving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

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
