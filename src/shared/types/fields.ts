// components/fields/types.ts
import { UseFormSetValue } from 'react-hook-form';
import { TaskFormData } from '../../hooks/tasks/forms/useTaskForm';

export type TaskFormSetValue = UseFormSetValue<TaskFormData>;
