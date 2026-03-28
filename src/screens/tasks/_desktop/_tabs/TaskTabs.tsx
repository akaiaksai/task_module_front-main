import { Clock, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import CommentsBlock from './CommentsBlock';
import ElapsedTimeBlock from './ElapsedTimeBlock';

export type TabType = 'comments' | 'time' | 'history';

interface TaskTabsProps {
  taskId: string;
  canEditTask: boolean;
  canDeleteTask: boolean;
}

export default function TaskTabs({ taskId }: TaskTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('comments');

  const tabs = [
    {
      id: 'comments' as TabType,
      label: 'Комментарии',
      icon: MessageSquare,
      count: 0, // Можно передать реальное количество
    },
    {
      id: 'time' as TabType,
      label: 'Затраченное время',
      icon: Clock,
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'comments':
        return <CommentsBlock taskId={taskId} />;
      case 'time':
        return <ElapsedTimeBlock taskId={taskId} />;
      default:
        return <CommentsBlock taskId={taskId} />;
    }
  };

  return (
    <div>
      {/* Вкладки */}
      <div className="flex border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">{renderActiveTab()}</div>
    </div>
  );
}
