// lib/api/tasks/projects.ts
import { http } from '../../http';

// Типы смарт-процессов (воронки)
export interface SmartProcessType {
  ID: number;
  EntityTypeID: number;
  Title: string;
  CreatedTime: string;
  TableName: string;
}

export interface SmartProcessTypesResponse {
  result: SmartProcessType[];
}

// Проекты (смарт-процессы)
export interface Project {
  ID: number;
  EntityTypeID: number;
  Title: string;
  StageID: string;
  AssignedByID: string;
  CreatedBy: number;
  CreatedTime: string;
}

export interface ProjectsResponse {
  result: Project[];
}

// Получение типов смарт-процессов
export const fetchSmartProcessTypes =
  async (): Promise<SmartProcessTypesResponse> => {
    const response = await http.get('/smart_process/types');
    return response.data;
  };

// Получение списка проектов
export const fetchProjects = async (params?: {
  entityTypeId?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProjectsResponse> => {
  const response = await http.get('/projects/list', { params });
  return response.data;
};

// Получение задач с фильтрацией по проектам
export const fetchTasksWithProjectFilter = async (params?: {
  page?: number;
  limit?: number;
  STATUS?: number;
  PERIOD?: string;
  GROUP_ID?: number;
  PROJECT_ENTITY_ID?: number;
  PROJECT_ENTITY_TYPE_ID?: number;
  RESPONSIBLE_ID?: number;
  CREATED_BY?: number;
}): Promise<ANY> => {
  const response = await http.get('/tasks/list', { params });
  return response.data;
};

// Воронки смарт-процессов
export interface SmartProcessFunnel {
  ID: number;
  Title: string;
  EntityTypeID?: number;
}

export interface SmartProcessFunnelsResponse {
  result: SmartProcessFunnel[];
}

// Получение списка воронок смарт-процессов
export const fetchSmartProcessFunnels =
  async (): Promise<SmartProcessFunnelsResponse> => {
    const response = await http.get('/smart_process/funnels');
    return response.data;
  };
