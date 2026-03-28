import { useState } from 'react';
import { MobileProjectsHeader } from './MobileProjectsHeader';
import { MobileUsersDropdown } from './MobileUsersDropdown';
import { useGroupMembers } from '@/hooks/groups/useGroupsAndMembers';
import { useParams } from 'react-router-dom';

export default function MobileGroupsList() {
  const { projectId } = useParams<{ projectId: string }>();
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'day'>('week');
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { members = [] } = useGroupMembers(projectId ?? '', {
    page: 1,
    perPage: 10000,
  });

  return (
    <div className="font-roboto">
      <MobileProjectsHeader
        viewMode={viewMode}
        onModeChange={setViewMode}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        isOpen={projectsOpen}
        onToggle={() => setProjectsOpen((v) => !v)}
      />
      <div className="px-2 pt-4">
        <MobileUsersDropdown
          members={members}
          currentDate={currentDate}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}
