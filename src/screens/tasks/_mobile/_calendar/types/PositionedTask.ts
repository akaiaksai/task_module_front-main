import { Task } from '@/shared/types/task';

export interface PositionedTask extends Task {
  groupKey: number | null;
  layer: number;
  top: number;
  height: number;
  left: number;
  width: number;
  _realStart: number;
  _realEnd: number;
  partialInside?: boolean;

  isMain?: boolean;
  isMulti?: boolean;
  overlapCount?: number;
}
