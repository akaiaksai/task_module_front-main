import {
  Bookmark,
  ChevronDown,
  Filter,
  FileText,
  Folder,
  Headset,
  Info,
  LayoutGrid,
  List,
  Plus,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useGroups } from '../../../hooks/groups/useGroup';
import { ProjectWithTasks } from '../../../hooks/groups/useProjectsWithTasks';
import { Task } from '../../../shared/types/task';

type ProjectTab =
  | 'project_info'
  | 'responsible'
  | 'production'
  | 'support'
  | 'docs';

const PROJECT_TABS: Array<{
  id: ProjectTab;
  label: string;
  icon: typeof Info;
}> = [
  { id: 'project_info', label: 'Информация о проекте', icon: Info },
  { id: 'responsible', label: 'Ответственные', icon: UserRound },
  { id: 'production', label: 'Информация для производства', icon: Bookmark },
  { id: 'support', label: 'Информация для тех.поддержки', icon: Headset },
  { id: 'docs', label: 'Документация проекта', icon: FileText },
];

const DOC_FOLDERS: Array<{ key: DocsFolderKey; title: string }> = [
  { key: 'contracts', title: 'Договоры/Документация' },
  { key: 'interviews', title: 'Интервью/Записи' },
  { key: 'client_tz', title: 'ТЗ Клиента' },
  { key: 'sales_results', title: 'Итоги ОП/История продаж' },
];

const FIELD_LABEL_CLASS =
  'mb-2 text-[14px] leading-[130%] font-normal text-[#E8F5FF]';
const FIELD_HINT_CLASS = 'text-[12px] text-[#E8F5FF80]';
const INPUT_CLASS =
  'h-[44px] w-full rounded-[10px] border border-[#8AE6FF26] bg-[#8AE6FF26] px-4 text-[16px] text-white placeholder:text-[#E8F5FF80] outline-none';
const PANEL_CLASS =
  'rounded-[24px] border border-[#8AE6FF33] bg-[linear-gradient(90deg,rgba(27,48,77,0.82)_0%,rgba(54,95,109,0.65)_52%,rgba(17,20,28,0.9)_100%)] p-5';

type ProjectInfoForm = {
  statusNote: string;
  statusDate: string;
  statusTime: string;
  clientName: string;
  phone: string;
  startDate: string;
  duration: string;
  endDate: string;
};

type ProductionForm = {
  projectDescription: string;
  trainingType: string;
  bitrixPortalUrl: string;
  bitrixPortalAddress: string;
  projectDiskUrl: string;
  accessInstruction: string;
};

type SupportForm = {
  actSignDate: string;
  serviceEndDate: string;
  serviceType: string;
};

type DocsFolderKey = 'contracts' | 'interviews' | 'client_tz' | 'sales_results';

type ResponsibleForm = {
  salesLead: string[];
  integrator: string[];
  participants: string[];
  observers: string[];
};

function formatDate(value?: string | null) {
  if (!value) {
    return 'дд.мм.гг';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'дд.мм.гг';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function toIsoDate(value?: string | null) {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const ruDateMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (ruDateMatch) {
    const [, day, month, year] = ruDateMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentIsoTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getSampleNames(names: string[]) {
  if (names.length > 0) {
    return names;
  }

  return ['Хакназар Такенов', 'Тимур Тимертай', 'Алишер Сайлаув'];
}

export const ProjectCard = ({
  project,
  isAdmin,
  userId,
  handleTaskClick,
  projectProgress,
  allUsersElapsedTimeMap,
}: {
  project: ProjectWithTasks;
  projectProgress: number;
  isAdmin: boolean;
  userId: number | null;
  handleTaskClick: (taskId: number) => void;
  allUsersElapsedTimeMap: Record<number, number>;
}) => {
  const [activeTab, setActiveTab] = useState<ProjectTab>('project_info');

  const projectTasks = isAdmin
    ? project.tasks || []
    : (project.tasks || []).filter(
        (task: Task) => task.assigneeId === Number(userId)
      );

  const { groups: groupsData = [] } = useGroups();

  const groupColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  const groupColorMap = useMemo(() => {
    const map: Record<number, string> = {};

    const uniqueGroupIds = [
      ...new Set(
        projectTasks.filter((task) => task.groupId).map((task) => task.groupId)
      ),
    ];

    uniqueGroupIds.forEach((groupId, index) => {
      if (groupId) {
        map[groupId] = groupColors[index % groupColors.length];
      }
    });

    return map;
  }, [projectTasks]);

  const uniqueMembers = useMemo(() => {
    const names = projectTasks
      .map((task) => task.assigneeName?.trim())
      .filter((name): name is string => Boolean(name));

    return Array.from(new Set(names)).slice(0, 6);
  }, [projectTasks]);

  const members = getSampleNames(uniqueMembers);
  const docsTasks = projectTasks.slice(0, 4);
  const showBottomAction =
    activeTab === 'project_info' || activeTab === 'responsible';
  const [projectInfoForm, setProjectInfoForm] = useState<ProjectInfoForm>({
    statusNote: '',
    statusDate: getCurrentIsoDate(),
    statusTime: getCurrentIsoTime(),
    clientName: '',
    phone: '',
    startDate: '',
    duration: '',
    endDate: '',
  });
  const [productionForm, setProductionForm] = useState<ProductionForm>({
    projectDescription: '',
    trainingType: '',
    bitrixPortalUrl: '',
    bitrixPortalAddress: '',
    projectDiskUrl: '',
    accessInstruction: '',
  });
  const [supportForm, setSupportForm] = useState<SupportForm>({
    actSignDate:
      toIsoDate(project.CreatedTime) ||
      toIsoDate(formatDate(project.CreatedTime)) ||
      '2024-01-15',
    serviceEndDate:
      toIsoDate(project.DateFinish) ||
      toIsoDate(formatDate(project.DateFinish)) ||
      '2024-01-25',
    serviceType: '',
  });
  const [responsibleForm, setResponsibleForm] = useState<ResponsibleForm>({
    salesLead: members[0] ? [members[0]] : [],
    integrator: members[1] ? [members[1]] : members[0] ? [members[0]] : [],
    participants: [members[0], members[1], members[2]].filter(Boolean),
    observers: members[2] ? [members[2]] : [],
  });
  const availableUsers = useMemo(
    () =>
      Array.from(
        new Set([
          ...members,
          'Асылхан Серік',
          'Тимур Тимертай',
          'Алишер Сайлаув',
          'Хакназар Такенов',
        ])
      ),
    [members]
  );

  const openExternalLink = (rawUrl: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = rawUrl.trim();
    if (!url) {
      return;
    }

    const fullUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto w-full max-w-[1302px] font-roboto">
      <TopFilterStrip />

      <div className="mt-4 rounded-[14px] border border-[#8AE6FF80] p-5 text-white bg-[radial-gradient(120%_190%_at_76%_50%,rgba(66,125,146,0.74)_0%,rgba(14,24,39,0.92)_45%,rgba(7,10,16,1)_100%)]">
        <div className="rounded-[14px] border border-[#8AE6FF80] bg-[#8AE6FF1F] px-5 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-normal text-[40px] max-xl:text-[34px] leading-[110%] tracking-[-0.83px] mb-1 truncate">
              TOO “Геокурс”
            </h3>
            <p className="text-[16px] leading-[130%] text-[#E8F5FFCC]">
              Управление проектом в Битрикс 24
            </p>
          </div>

          <button
            type="button"
            className="h-[54px] shrink-0 rounded-[12px] border border-[#8AE6FF33] bg-[#8AE6FF26] px-6 text-[14px] text-[#E8F5FF] hover:bg-[#8AE6FF33] transition-colors"
          >
            Вернуться к проектам
          </button>
        </div>

        <div className="mt-5 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:pb-0 xl:grid-cols-5">
          <div className="flex w-max min-w-full items-stretch justify-center gap-4 sm:contents">
            {PROJECT_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                  title={tab.label}
                  className={`h-[56px] w-[56px] shrink-0 rounded-[12px] px-0 text-[15px] leading-[120%] transition-all inline-flex items-center justify-center sm:h-[70px] sm:w-full sm:px-4 ${
                    isActive
                      ? 'border border-[#8AE6FF99] bg-[#8AE6FF33] ui-glow-desktop'
                      : 'border border-transparent bg-[#8AE6FF26] hover:bg-[#8AE6FF30]'
                  }`}
                >
                  <Icon className="h-10 w-10 text-[#E8F5FF] sm:hidden" />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          {activeTab === 'project_info' && (
            <ProjectInfoSection
              members={members}
              form={projectInfoForm}
              onFieldChange={(field, value) =>
                setProjectInfoForm((prev) => ({ ...prev, [field]: value }))
              }
              onAddStatus={() =>
                setProjectInfoForm((prev) => ({ ...prev, statusNote: '' }))
              }
              onOpenChat={() => {
                const digits = projectInfoForm.phone.replace(/\D/g, '');
                if (digits.length >= 10) {
                  const normalized =
                    digits.length === 11
                      ? digits
                      : `7${digits.slice(digits.length - 10)}`;
                  openExternalLink(`https://wa.me/${normalized}`);
                  return;
                }

                openExternalLink('https://web.whatsapp.com/');
              }}
            />
          )}
          {activeTab === 'responsible' && (
            <ResponsibleSection
              form={responsibleForm}
              availableUsers={availableUsers}
              onAddUser={(field, userName) =>
                setResponsibleForm((prev) => ({
                  ...prev,
                  [field]: prev[field].includes(userName)
                    ? prev[field]
                    : [...prev[field], userName],
                }))
              }
              onRemoveUser={(field, index) =>
                setResponsibleForm((prev) => ({
                  ...prev,
                  [field]: prev[field].filter((_, i) => i !== index),
                }))
              }
            />
          )}
          {activeTab === 'production' && (
            <ProductionSection
              form={productionForm}
              onFieldChange={(field, value) =>
                setProductionForm((prev) => ({ ...prev, [field]: value }))
              }
              onOpenDisk={() => openExternalLink(productionForm.projectDiskUrl)}
            />
          )}
          {activeTab === 'support' && (
            <SupportSection
              form={supportForm}
              onFieldChange={(field, value) =>
                setSupportForm((prev) => ({ ...prev, [field]: value }))
              }
            />
          )}
          {activeTab === 'docs' && (
            <DocsSection docsTasks={docsTasks} onTaskClick={handleTaskClick} />
          )}
        </div>
      </div>

      {showBottomAction && (
        <div className="flex justify-center mt-3">
          <button
            type="button"
            className="h-[34px] min-w-[130px] rounded-[10px] border border-[#C4ECF7] bg-[#E9F6FA] px-4 text-[14px] font-normal text-[#ECF6FA]"
          >
            Выбор задач
          </button>
        </div>
      )}
    </div>
  );
};

function TopFilterStrip() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');

  return (
    <div className="rounded-[14px] border border-[#CBD3DD] bg-[#F2F4F6] px-3 py-3 flex items-center justify-between gap-3">
      <div className="relative flex-1">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#B1BCC8]" />
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Поиск по названию проекта"
          className="h-[40px] w-full rounded-[12px] border border-[#D3DAE2] bg-[#F6F8FA] pl-9 pr-3 text-[12px] text-[#607586] placeholder:text-[#AAB7C3] outline-none"
        />
      </div>
      <div className="relative">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="h-[40px] min-w-[150px] appearance-none rounded-[12px] border border-[#D3DAE2] bg-[#F6F8FA] pl-3.5 pr-8 text-[12px] text-[#374C5F] outline-none"
        >
          <option value="all">Выберите проект</option>
          <option value="geo">ТОО “Геокурс”</option>
          <option value="gamechanger">Gamechanger EU</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6F7F]" />
      </div>
      <button
        type="button"
        className="h-[40px] rounded-[12px] border border-[#D3DAE2] bg-[#F6F8FA] px-3.5 text-[12px] text-[#5A6F7F] inline-flex items-center gap-1.5"
      >
        <Filter className="h-3.5 w-3.5" />
        Фильтры
      </button>
    </div>
  );
}

function ProjectInfoSection({
  members,
  form,
  onFieldChange,
  onAddStatus,
  onOpenChat,
}: {
  members: string[];
  form: ProjectInfoForm;
  onFieldChange: (field: keyof ProjectInfoForm, value: string) => void;
  onAddStatus: () => void;
  onOpenChat: () => void;
}) {
  return (
    <div className={PANEL_CLASS}>
      <div className="mb-3">
        <div className="mb-3 text-[14px] leading-[130%] text-[#E8F5FF]">
          Актуальный статус
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_170px_120px_auto] gap-3">
          <input
            value={form.statusNote}
            onChange={(e) => onFieldChange('statusNote', e.target.value)}
            placeholder="Добавить запись о статусе проекта..."
            className={INPUT_CLASS}
          />
          <input
            type="date"
            value={form.statusDate}
            onChange={(e) => onFieldChange('statusDate', e.target.value)}
            className={`${INPUT_CLASS} [color-scheme:dark]`}
          />
          <input
            type="time"
            value={form.statusTime}
            onChange={(e) => onFieldChange('statusTime', e.target.value)}
            className={`${INPUT_CLASS} [color-scheme:dark]`}
          />
          <button
            type="button"
            onClick={onAddStatus}
            className="h-[44px] rounded-[10px] border border-[#8AE6FF26] bg-[#8AE6FF26] px-7 text-[16px] text-[#E8F5FF]"
          >
            Добавить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <div className={FIELD_LABEL_CLASS}>Чат с клиентом</div>
          <div
            className={`${INPUT_CLASS} text-left flex items-center justify-between gap-2`}
          >
            <span className="truncate inline-flex items-center gap-2">
              <WhatsAppLogo className="h-5 w-5 shrink-0" />
              <span>{members[0]}</span>
            </span>
            <button
              type="button"
              onClick={onOpenChat}
              className="h-[34px] rounded-[10px] border border-[#8AE6FF80] px-4 text-[12px] text-[#E8F5FF]"
            >
              Открыть чат
            </button>
          </div>
        </div>
        <div>
          <div className={FIELD_LABEL_CLASS}>Клиент</div>
          <input
            value={form.clientName}
            onChange={(e) => onFieldChange('clientName', e.target.value)}
            placeholder="ФИО клиента"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <div className={FIELD_LABEL_CLASS}>Контактный телефон</div>
          <input
            value={form.phone}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            placeholder="+7 (___) ___ - __ - __"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DateField
          label="Дата начала проекта"
          value={form.startDate}
          onChange={(value) => onFieldChange('startDate', value)}
        />
        <SimpleField
          label="Срок реализации"
          hint="*в рабочих днях"
          value={form.duration}
          onChange={(value) => onFieldChange('duration', value)}
          placeholder="15 дней"
        />
        <DateField
          label="Дата завершения проекта"
          value={form.endDate}
          onChange={(value) => onFieldChange('endDate', value)}
        />
      </div>
    </div>
  );
}

function ResponsibleSection({
  form,
  availableUsers,
  onAddUser,
  onRemoveUser,
}: {
  form: ResponsibleForm;
  availableUsers: string[];
  onAddUser: (field: keyof ResponsibleForm, userName: string) => void;
  onRemoveUser: (field: keyof ResponsibleForm, index: number) => void;
}) {
  return (
    <div className={PANEL_CLASS}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <TagField
          title="Ответственный из отдела продаж"
          tags={form.salesLead}
          userOptions={availableUsers}
          onAddUser={(name) => onAddUser('salesLead', name)}
          onRemoveUser={(index) => onRemoveUser('salesLead', index)}
          showAdd
        />
        <TagField
          title="Ответственный интегратор"
          tags={form.integrator}
          userOptions={availableUsers}
          onAddUser={(name) => onAddUser('integrator', name)}
          onRemoveUser={(index) => onRemoveUser('integrator', index)}
          showAdd
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TagField
          title="Участник проекта"
          hint="возможно несколько"
          tags={form.participants}
          userOptions={availableUsers}
          onAddUser={(name) => onAddUser('participants', name)}
          onRemoveUser={(index) => onRemoveUser('participants', index)}
          showAdd
        />
        <TagField
          title="Наблюдатель"
          hint="возможно несколько"
          tags={form.observers}
          userOptions={availableUsers}
          onAddUser={(name) => onAddUser('observers', name)}
          onRemoveUser={(index) => onRemoveUser('observers', index)}
          showAdd
          warning
        />
      </div>
    </div>
  );
}

function ProductionSection({
  form,
  onFieldChange,
  onOpenDisk,
}: {
  form: ProductionForm;
  onFieldChange: (field: keyof ProductionForm, value: string) => void;
  onOpenDisk: () => void;
}) {
  return (
    <div className={PANEL_CLASS}>
      <div className="mb-4">
        <div className={FIELD_LABEL_CLASS}>Описание проекта</div>
        <textarea
          value={form.projectDescription}
          onChange={(e) => onFieldChange('projectDescription', e.target.value)}
          placeholder="Введите описание проекта..."
          className="h-[136px] w-full resize-none rounded-[10px] border border-[#8AE6FF26] bg-[#8AE6FF26] px-4 py-3 text-[16px] text-white placeholder:text-[#E8F5FF80] outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SelectLikeField
          label="Вид обучения"
          value={form.trainingType}
          onChange={(value) => onFieldChange('trainingType', value)}
          options={[
            { value: '', label: 'Вид обучение' },
            { value: 'Базовое обучение', label: 'Базовое обучение' },
            { value: 'Расширенное обучение', label: 'Расширенное обучение' },
            {
              value: 'Индивидуальное обучение',
              label: 'Индивидуальное обучение',
            },
          ]}
        />
        <UnderlinedField
          label="Адрес портала Битрикс24"
          value={form.bitrixPortalUrl}
          onChange={(value) => onFieldChange('bitrixPortalUrl', value)}
          placeholder="https://corp.gamechanger.kz/"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SimpleField
          label="Адрес портала Битрикс24"
          value={form.bitrixPortalAddress}
          onChange={(value) => onFieldChange('bitrixPortalAddress', value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
        />
        <LinkField
          label="Ссылка на диск проекта"
          value={form.projectDiskUrl}
          onChange={(value) => onFieldChange('projectDiskUrl', value)}
          placeholder="https://..."
          onOpen={onOpenDisk}
        />
      </div>

      <div>
        <div className={FIELD_LABEL_CLASS}>Инструкция по доступам</div>
        <textarea
          value={form.accessInstruction}
          onChange={(e) => onFieldChange('accessInstruction', e.target.value)}
          placeholder="Введите инструкцию..."
          className="h-[136px] w-full resize-none rounded-[10px] border border-[#8AE6FF26] bg-[#8AE6FF26] px-4 py-3 text-[16px] text-white placeholder:text-[#E8F5FF80] outline-none"
        />
      </div>
    </div>
  );
}

function SupportSection({
  form,
  onFieldChange,
}: {
  form: SupportForm;
  onFieldChange: (field: keyof SupportForm, value: string) => void;
}) {
  return (
    <div className={PANEL_CLASS}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DateField
          label="Дата подписания АВР"
          value={form.actSignDate}
          onChange={(value) => onFieldChange('actSignDate', value)}
          hint={null}
        />
        <DateField
          label="Дата завершения обслуживания"
          value={form.serviceEndDate}
          onChange={(value) => onFieldChange('serviceEndDate', value)}
          hint={null}
        />
        <SimpleField
          label="Вид обслуживания"
          value={form.serviceType}
          onChange={(value) => onFieldChange('serviceType', value)}
          placeholder="Вид обслуживания"
        />
      </div>
    </div>
  );
}

function DocsSection({
  docsTasks,
  onTaskClick,
}: {
  docsTasks: ProjectWithTasks['tasks'];
  onTaskClick: (taskId: number) => void;
}) {
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [activeFolder, setActiveFolder] = useState<DocsFolderKey>('contracts');
  const [customDocsByFolder, setCustomDocsByFolder] = useState<
    Record<DocsFolderKey, Array<{ id: number; title: string }>>
  >({
    contracts: [],
    interviews: [],
    client_tz: [],
    sales_results: [],
  });

  const taskDocs = useMemo(
    () =>
      (docsTasks || []).map((task) => ({
        id: Number(task.id),
        title: task.title || `Договор ${task.id}`,
        onClick: () => onTaskClick(Number(task.id)),
      })),
    [docsTasks, onTaskClick]
  );

  const folderDocs = useMemo(() => {
    const fromCustom = (folder: DocsFolderKey) =>
      customDocsByFolder[folder].map((doc) => ({
        id: doc.id,
        title: doc.title,
        onClick: undefined as (() => void) | undefined,
      }));

    return {
      contracts: [...fromCustom('contracts'), ...taskDocs],
      interviews: fromCustom('interviews'),
      client_tz: fromCustom('client_tz'),
      sales_results: fromCustom('sales_results'),
    };
  }, [customDocsByFolder, taskDocs]);

  const filteredDocsTasks = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    const currentFolderDocs = folderDocs[activeFolder];
    if (!normalized) {
      return currentFolderDocs;
    }

    return currentFolderDocs.filter((task) =>
      (task.title || `Договор ${task.id}`).toLowerCase().includes(normalized)
    );
  }, [folderDocs, activeFolder, searchValue]);

  const addDocument = () => {
    setCustomDocsByFolder((prev) => ({
      ...prev,
      [activeFolder]: [
        {
          id: Date.now(),
          title: `Новый файл ${prev[activeFolder].length + 1}`,
        },
        ...prev[activeFolder],
      ],
    }));
  };

  const activeFolderTitle =
    DOC_FOLDERS.find((folder) => folder.key === activeFolder)?.title ||
    'Документация';
  const activeFolderHeading =
    activeFolder === 'contracts'
      ? 'Договоры и документация'
      : activeFolderTitle;

  return (
    <div className={`${PANEL_CLASS} min-h-[500px]`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative min-w-[280px] flex-1 max-w-[420px]">
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Поиск"
            className="h-[42px] w-full rounded-[999px] border border-[#8AE6FF26] bg-[#8AE6FF26] px-5 pr-10 text-[16px] text-[#E8F5FF] placeholder:text-[#E8F5FF80] outline-none"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8AE6FFB3]" />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`h-[32px] w-[32px] rounded-[8px] border inline-flex items-center justify-center ${
              viewMode === 'list'
                ? 'border-[#8AE6FF99] bg-[#8AE6FF40]'
                : 'border-[#8AE6FF26] bg-[#8AE6FF26]'
            }`}
          >
            <List className="h-4 w-4 text-[#8AE6FF]" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`h-[32px] w-[32px] rounded-[8px] border inline-flex items-center justify-center ${
              viewMode === 'grid'
                ? 'border-[#8AE6FF99] bg-[#8AE6FF40]'
                : 'border-[#8AE6FF26] bg-[#8AE6FF26]'
            }`}
          >
            <LayoutGrid className="h-4 w-4 text-[#8AE6FF]" />
          </button>
          <button
            type="button"
            onClick={addDocument}
            className="h-[42px] rounded-[12px] border border-[#8AE6FF26] bg-[#8AE6FF26] px-5 text-[16px] inline-flex items-center gap-2"
          >
            Добавить
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={`mb-3 gap-2 ${
          viewMode === 'list'
            ? 'grid grid-cols-1'
            : 'grid grid-cols-4 md:grid-cols-2 xl:grid-cols-4'
        }`}
      >
        {DOC_FOLDERS.map((folder) => (
          <FolderCard
            key={folder.key}
            title={folder.title}
            active={activeFolder === folder.key}
            onClick={() => setActiveFolder(folder.key)}
            compact={viewMode === 'grid'}
          />
        ))}
      </div>

      <div className="text-[13px] tracking-[0.4px] text-[#25B9EE] mb-1.5">
        {activeFolderHeading}
      </div>
      <div className="rounded-[10px] border border-[#8AE6FF33] bg-[#8AE6FF0D] overflow-hidden">
        {filteredDocsTasks.length > 0 ? (
          filteredDocsTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={task.onClick}
              disabled={!task.onClick}
              className="w-full border-b border-[#8AE6FF33] last:border-b-0 px-3 py-2 text-left flex items-center gap-2 hover:bg-[#8AE6FF14] transition-colors"
            >
              <Folder className="h-4 w-4 text-[#39C8F3]" />
              <span className="truncate text-[14px] text-[#E8F5FF]">
                {task.title}
              </span>
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-[14px] text-[#E8F5FF80]">
            {searchValue.trim()
              ? 'Ничего не найдено'
              : 'В выбранной папке пока нет файлов'}
          </div>
        )}
      </div>
      <div className="h-[44px]" />
    </div>
  );
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        fill="#25D366"
        d="M32 6C17.64 6 6 17.34 6 31.33c0 4.98 1.5 9.63 4.11 13.39L7 58l14.75-3.56a27.4 27.4 0 0 0 10.25 1.96c14.36 0 26-11.34 26-25.07C58 17.34 46.36 6 32 6Z"
      />
      <path
        fill="#0A0A0A"
        d="M38.9 42.3c-1.8 1.2-4.5 1.1-8-.6-2.8-1.4-5.6-3.5-8-5.9-2.5-2.5-4.6-5.2-5.9-8-1.7-3.5-1.8-6.2-.6-8l2.7-2.7c.7-.7 1.8-.7 2.5 0l4 4c.7.7.7 1.8 0 2.5l-2 2c-.4.4-.4.9-.2 1.4.8 1.8 2.2 3.6 3.9 5.3 1.8 1.8 3.5 3.1 5.3 3.9.5.2 1 .2 1.4-.2l2-2c.7-.7 1.8-.7 2.5 0l4 4c.7.7.7 1.8 0 2.5l-2.7 2.7Z"
      />
    </svg>
  );
}

function DateField({
  label,
  value,
  hint = '*автоматический',
  onChange,
}: {
  label: string;
  value: string;
  hint?: string | null;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <div className={FIELD_LABEL_CLASS}>
        {label} {hint ? <span className={FIELD_HINT_CLASS}>{hint}</span> : null}
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!onChange}
        className={`${INPUT_CLASS} [color-scheme:dark]`}
      />
    </div>
  );
}

function SimpleField({
  label,
  value,
  hint,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  hint?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className={FIELD_LABEL_CLASS}>
        {label} {hint ? <span className={FIELD_HINT_CLASS}>{hint}</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!onChange}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}

function UnderlinedField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className={FIELD_LABEL_CLASS}>{label}</div>
      <div className={`${INPUT_CLASS} flex items-center`}>
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={!onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-[16px] text-white placeholder:text-[#E8F5FF80] underline underline-offset-2 outline-none"
        />
      </div>
    </div>
  );
}

function SelectLikeField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <div className={FIELD_LABEL_CLASS}>
        {label} <span className={FIELD_HINT_CLASS}>*автоматический</span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`${INPUT_CLASS} appearance-none pr-10`}
        >
          {options.map((option) => (
            <option
              key={`${option.value}_${option.label}`}
              value={option.value}
              className="bg-[#1A2F43]"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E8F5FFB8]" />
      </div>
    </div>
  );
}

function LinkField({
  label,
  value,
  onChange,
  placeholder,
  onOpen,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  onOpen?: () => void;
}) {
  return (
    <div>
      <div className={FIELD_LABEL_CLASS}>{label}</div>
      <div className={`${INPUT_CLASS} flex items-center justify-between gap-2`}>
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={!onChange}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[16px] text-white placeholder:text-[#E8F5FF80] underline underline-offset-2 outline-none"
        />
        <button
          type="button"
          onClick={onOpen}
          className="h-[32px] rounded-[12px] border border-[#E8F5FF99] px-3 text-[12px] text-[#E8F5FF]"
        >
          Открыть диск
        </button>
      </div>
    </div>
  );
}

function TagField({
  title,
  hint,
  tags,
  showAdd = false,
  warning = false,
  userOptions = [],
  onAddUser,
  onRemoveUser,
}: {
  title: string;
  hint?: string;
  tags: string[];
  showAdd?: boolean;
  warning?: boolean;
  userOptions?: string[];
  onAddUser?: (userName: string) => void;
  onRemoveUser?: (index: number) => void;
}) {
  const [userQuery, setUserQuery] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const freeUsers = useMemo(
    () =>
      userOptions.filter(
        (user) =>
          !tags.some((tag) => tag.toLowerCase().trim() === user.toLowerCase())
      ),
    [userOptions, tags]
  );

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) {
      return freeUsers.slice(0, 8);
    }

    return freeUsers
      .filter((user) => user.toLowerCase().includes(query))
      .slice(0, 8);
  }, [freeUsers, userQuery]);

  const pickUser = (userName: string) => {
    if (!userName) {
      return;
    }

    onAddUser?.(userName);
    setUserQuery('');
    setIsSuggestionsOpen(false);
  };

  return (
    <div>
      <div className="mb-2 text-[14px] text-[#E8F5FF]">
        {title} {hint && <span className={FIELD_HINT_CLASS}>{hint}</span>}
      </div>
      <div className="rounded-[12px] border border-[#8AE6FF26] bg-[#8AE6FF24] p-3 min-h-[84px] flex flex-wrap gap-2 items-start">
        {tags.map((tag, index) => (
          <span
            key={`${title}_${tag}_${index}`}
            className={`h-[48px] rounded-[999px] border px-4 inline-flex items-center gap-1 text-[14px] ${
              warning
                ? 'border-[#E5B702] text-[#FFE999] bg-[#E5B7021F]'
                : 'border-[#8AE6FF80] text-[#E8F5FF] bg-[#245169]'
            }`}
          >
            <span className="truncate max-w-[180px]">{tag}</span>
            <button
              type="button"
              onClick={() => onRemoveUser?.(index)}
              className="inline-flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5 opacity-80" />
            </button>
          </span>
        ))}
        {showAdd && (
          <div className="ml-auto relative">
            <button
              type="button"
              onClick={() => {
                setIsSuggestionsOpen((prev) => !prev);
                if (!isSuggestionsOpen) {
                  setUserQuery('');
                }
              }}
              className="h-[34px] w-[34px] inline-flex items-center justify-center text-[#E8F5FF]"
            >
              <Plus className="h-8 w-8" />
            </button>

            {isSuggestionsOpen && (
              <div className="absolute right-0 top-[38px] z-20 w-[260px] rounded-[10px] border border-[#8AE6FF66] bg-[#102B3C] p-2 shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
                <input
                  type="text"
                  value={userQuery}
                  autoFocus
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSuggestionsOpen(false);
                      return;
                    }

                    if (e.key !== 'Enter') {
                      return;
                    }

                    e.preventDefault();
                    const query = userQuery.trim().toLowerCase();
                    const exact = freeUsers.find(
                      (user) => user.toLowerCase() === query
                    );

                    if (exact) {
                      pickUser(exact);
                      return;
                    }

                    if (filteredUsers[0]) {
                      pickUser(filteredUsers[0]);
                    }
                  }}
                  placeholder="Поиск по ФИО"
                  className="mb-2 h-[34px] w-full rounded-[10px] border border-[#8AE6FF66] bg-[#0C2231] px-3 text-[12px] text-[#E8F5FF] placeholder:text-[#9FB6C7] outline-none"
                />

                <div className="max-h-[156px] overflow-auto rounded-[8px]">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <button
                        key={`${title}_suggest_${user}`}
                        type="button"
                        onClick={() => pickUser(user)}
                        className="w-full px-3 py-2 text-left text-[12px] text-[#E8F5FF] hover:bg-[#8AE6FF1F]"
                      >
                        {user}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-[12px] text-[#9FB6C7]">
                      Пользователь не найден
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FolderCard({
  title,
  onClick,
  active = false,
  className = '',
  compact = false,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[10px] border text-center flex flex-col items-center justify-center ${className} ${
        compact
          ? 'min-h-[98px] px-2 py-3 md:min-h-[140px] md:px-3 md:py-4'
          : 'min-h-[140px] px-3 py-4'
      } ${
        active
          ? 'border-[#8AE6FF80] bg-[#8AE6FF1F] ui-glow-desktop'
          : 'border-[#8AE6FF26] bg-[#8AE6FF14] hover:bg-[#8AE6FF1C]'
      }`}
    >
      <Folder
        className={`text-[#8AE6FF] ${
          compact ? 'mb-2 h-7 w-7 md:mb-3 md:h-11 md:w-11' : 'mb-3 h-11 w-11'
        }`}
      />
      <div
        className={`text-[#E8F5FF] ${
          compact
            ? 'text-[11px] leading-[120%] md:text-[16px]'
            : 'text-[16px] leading-[120%]'
        }`}
      >
        {title}
      </div>
    </button>
  );
}
