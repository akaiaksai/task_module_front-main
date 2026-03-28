export interface TempPanelTask {
  id: string;
  projectId: number;
  title: string;
  duration: number;
  groupId: number;
  start: Date;
  end: Date;
  assigneeId: number;
  projectColor: string;
}

export interface PreviewTask {
  day: Date;
  start: Date;
  end: Date;
  duration: number;
  title: string;
  assigneeId: number;
  projectColor: string;
}
