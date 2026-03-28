import { useTaskActions } from '@/hooks/tasks/useTaskActions';
import { uploadTaskFile } from '@/lib/api/tasks/tasks';
import { http } from '@/lib/http';
import { getStringValue } from '@/shared/utils/helpers';
import { WindowCard } from '@components/dumb/WindowCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Paperclip } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ProjectBlockProps {
  task: ANY;
  onClose: () => void;
}

// Добавьте интерфейс для файла в начале файла
interface FileItem {
  id: number;
  name: string;
  size: number;
  mimeType: string;
  downloadUrl: string;
}

// В ProjectBlock компоненте исправьте состояние файлов
export function ProjectBlock({ task, onClose }: ProjectBlockProps) {
  const PROJECT_ENTITY_CODE_MAP: Record<number, string> = {
    1112: 'T458',
    1094: 'T446',
    1084: 'T43C',
    1080: 'T438',
    1076: 'T434',
  };
  const project = task?.project;
  console.log(task.company);
  const { updateTask } = useTaskActions();

  // Получаем все проекты сразу при открытии блока с новым эндпоинтом
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects-all'],
    queryFn: async () => {
      const response = await http.get<{ result: ANY[] }>('/projects/list');
      return response.data.result || [];
    },
    staleTime: 30000, // 30 секунд
  });

  const projects = projectsData || [];

  // Инициализируем projectSearch с текущим названием проекта ОДИН РАЗ
  const [projectSearch, setProjectSearch] = useState(() => {
    if (project) {
      return getStringValue(project?.Title?.String) || '';
    }
    return '';
  });
  const [companySearch, setCompanySearch] = useState('');

  const company = task?.project?.company ?? task?.company ?? null;

  useEffect(() => {
    if (company?.Title) {
      setCompanySearch(company.Title);
    } else {
      setCompanySearch('');
    }
  }, [company?.ID]);

  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Обновляем projectSearch только если он пустой и есть выбранный проект
  useEffect(() => {
    if (project && projectSearch === '') {
      setProjectSearch(getStringValue(project?.Title?.String) || '');
    }
  }, [project]);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProjectDropdown(false);
      }
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectSearchChange = (value: string) => {
    setProjectSearch(value);
    setShowProjectDropdown(true);
  };

  // Обработчик изменения текста в поле поиска по компаниям
  const handleCompanySearchChange = (value: string) => {
    setCompanySearch(value);
    setShowCompanyDropdown(true);
  };

  const filteredProjects = useMemo(() => {
    return !projectSearch.trim()
      ? projects.filter((p: ANY) => {
          const title = getStringValue(p?.Title?.String)?.trim(); // Убираем пробелы
          return title && title !== ''; // Проверяем, что название не пустое
        })
      : projects.filter((p: ANY) => {
          const title = getStringValue(p?.Title?.String)?.trim(); // Убираем пробелы
          return (
            title && // Проверяем, что название не пустое
            title !== '' &&
            title.toLowerCase().includes(projectSearch.toLowerCase()) // Проверяем, что название соответствует поиску
          );
        });
  }, [projects, projectSearch]);

  const selectProject = async (selectedProject: ANY) => {
    try {
      const entityTypeId = selectedProject?.EntityTypeID;
      const entityId = selectedProject?.ID;

      const entityCode = PROJECT_ENTITY_CODE_MAP[entityTypeId];

      if (!entityCode || !entityId) {
        toast.error('Не удалось определить тип проекта');
        return;
      }

      const currentCrmLinks: string[] = Array.isArray(task.ufCrmTask)
        ? task.ufCrmTask
        : [];

      const crmWithoutProjects = currentCrmLinks.filter(
        (l) => !String(l).startsWith('T')
      );

      const newProjectLink = `${entityCode}_${entityId}`;

      await updateTask({
        id: task.id,
        payload: {
          UF_CRM_TASK: [...crmWithoutProjects, newProjectLink],
        },
      });

      setProjectSearch(getStringValue(selectedProject?.Title?.String) || '');
      setShowProjectDropdown(false);
      toast.success('Проект обновлён');
    } catch (error) {
      console.error('Ошибка при обновлении проекта:', error);
      toast.error('Не удалось обновить проект');
    }
  };

  const selectCompany = async (selectedCompany: ANY) => {
    try {
      const currentCrmLinks: string[] = task.ufCrmTask ?? [];

      const crmWithoutCompanies = currentCrmLinks.filter(
        (l) => !l.startsWith('CO_')
      );

      const newCrmLinks = [...crmWithoutCompanies, `CO_${selectedCompany.ID}`];

      await updateTask({
        id: task.id,
        payload: {
          UF_CRM_TASK: newCrmLinks,
        },
      });

      setCompanySearch(selectedCompany.title);
      setShowCompanyDropdown(false);

      toast.success('Компания обновлена');
    } catch (error) {
      console.error('Ошибка обновления компании:', error);
      toast.error('Не удалось обновить компанию');
    }
  };

  const tags = project?.tags ?? ['#OurSystem', '#GamechangerWay'];

  const { data: companiesData, isLoading: isCompaniesLoading } = useQuery({
    queryKey: ['crm-companies'],
    queryFn: async () => {
      const response = await http.get<{ result: { title: string }[] }>(
        '/crm/companies'
      );
      return response.data.result || [];
    },
    staleTime: 30000,
  });

  const companies = (companiesData || [])
    .map((c: ANY) => {
      const title = getStringValue(c?.Title)?.trim();

      return {
        ...c,
        title,
      };
    })
    .filter((c) => c.title && c.title.length > 0);

  // Фильтрация компаний
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) {
      return companies;
    }

    return companies.filter((c) =>
      c.title.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companies, companySearch]);

  const [files, setFiles] = useState<FileItem[]>(task.files ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFiles(task.files ?? []);
  }, [task.files]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);

    try {
      await uploadTaskFile(task.id, file);

      await queryClient.invalidateQueries({
        queryKey: ['task', task.id],
      });

      toast.success('Файл загружен');
    } catch (err) {
      console.error('Ошибка загрузки файла:', err);
      toast.error('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  }

  return (
    <WindowCard titleClassName="text-white" title="Проект" onClose={onClose}>
      <div className="space-y-6 font-roboto">
        {/* Поиск проекта */}
        <div className="relative" ref={projectDropdownRef}>
          <label className="text-[14px] font-medium text-[#2B2B2B] leading-[130%] block mb-2">
            Проект
          </label>

          <input
            type="text"
            placeholder="Выберите проект..."
            value={projectSearch}
            onChange={(e) => handleProjectSearchChange(e.target.value)}
            onFocus={() => setShowProjectDropdown(true)}
            className="w-full px-3 py-3 rounded-xl border border-[#0000000F] text-[16px] outline-none focus:border-[#595a5f] transition"
          />

          {/* Выпадающий список проектов */}
          {showProjectDropdown && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-auto">
              {isProjectsLoading ? (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  Загрузка проектов...
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  Проекты не найдены
                </div>
              ) : (
                filteredProjects.map((p: ANY) => (
                  <button
                    key={`project_${p.ID}_${p.EntityTypeID}`}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition text-[14px] border-b border-gray-100 last:border-b-0"
                    onClick={() => selectProject(p)}
                  >
                    {getStringValue(p?.Title?.String)}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Поиск компании */}
        <div className="relative" ref={companyDropdownRef}>
          <label className="text-[14px] font-medium text-[#2B2B2B] leading-[130%] block mb-2">
            Компания
          </label>
          <input
            disabled
            type="text"
            placeholder="Выберите компанию..."
            value={companySearch}
            onChange={(e) => handleCompanySearchChange(e.target.value)}
            onFocus={() => setShowCompanyDropdown(true)}
            className="w-full px-3 py-3 rounded-xl border border-[#0000000F] text-[16px] outline-none focus:border-[#595a5f] transition"
          />

          {/* Выпадающий список компаний */}
          {showCompanyDropdown && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-auto">
              {isCompaniesLoading ? (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  Загрузка компаний...
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  Компании не найдены
                </div>
              ) : (
                filteredCompanies.map((c: ANY) => (
                  <button
                    key={`company_${c.ID}`}
                    disabled
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition text-[14px] border-b border-gray-100 last:border-b-0"
                    onClick={() => selectCompany(c)}
                  >
                    {c?.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-[#2B2B2B] leading-[130%]">
            Теги
          </label>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <div
                key={tag}
                className={`
                  px-2 py-2 rounded-sm text-[14px]
                  font-normal leading-[130%] ${
                    !tag.includes('OurSystem') && 'text-white'
                  }
                `}
                style={{
                  background: tag.includes('OurSystem')
                    ? '#A0D912'
                    : tag.includes('Дизайн')
                      ? '#742DD3'
                      : '#EF4642',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Секция файлов */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-[16px] font-medium text-[#2B2B2B] mb-3">
            Документация по проекту
          </h3>

          {files.length > 0 && (
            <div className="space-y-2 mb-3">
              {files.map((f: FileItem) => (
                <a
                  key={f.id}
                  href={f.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-2 py-2 rounded-lg border bg-white hover:bg-gray-50 transition"
                >
                  <FileText className="w-4 h-4 text-[#2D8CFF]" />
                  <div className="flex flex-col">
                    <span className="text-[14px] text-[#1A1A1A]">{f.name}</span>
                    <span className="text-[12px] text-[#00000060]">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {files.length === 0 && (
            <div className="text-center text-[#2B2B2B73] text-[14px] mb-3">
              Файлов пока нет
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between bg-[#EDEDED] border border-[#2B2B2B1F] rounded-xl px-3 py-3 hover:bg-[#e2e2e2] transition"
          >
            <span className="text-[14px] text-[#2B2B2B99] underline">
              {uploading ? 'Загрузка...' : 'Прикрепить файл'}
            </span>
            <Paperclip className="w-4 h-4 text-[#2B2B2B99]" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>
    </WindowCard>
  );
}
