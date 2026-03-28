const PROJECT_TASKS_KEY = 'calendar:projectTaskIds';

export function loadProjectTaskIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PROJECT_TASKS_KEY);
    if (!raw) {
      return new Set();
    }
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function saveProjectTaskIds(ids: Set<string>) {
  localStorage.setItem(PROJECT_TASKS_KEY, JSON.stringify(Array.from(ids)));
}
