const PROJECT_COLORS = [
  '#192A33',
  '#5A2E2E',
  '#333333',
  '#136F79',
  '#634A84',
  '#8AC200',
  '#005337',
  '#1E3A8A',
  '#0F766E',
  '#7C2D12',
  '#3F6212',
  '#4C1D95',
  '#7F1D1D',
  '#1F2937',
  '#14532D',
  '#0C4A6E',
  '#78350F',
  '#312E81',
  '#422006',
  '#064E3B',
];

const projectColorMap = new Map<number, string>();
let colorCursor = 0;

export function getProjectColorById(projectId: number) {
  if (!projectColorMap.has(projectId)) {
    projectColorMap.set(
      projectId,
      PROJECT_COLORS[colorCursor % PROJECT_COLORS.length]
    );
    colorCursor++;
  }

  return projectColorMap.get(projectId)!;
}
