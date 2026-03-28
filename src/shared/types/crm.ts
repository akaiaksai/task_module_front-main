export interface DealFunnelsResponse {
  result: DealFunnel[];
}

export interface Deal {
  ID: number;
  Title: string;
  DateCreate: string;
  StageID: string;
  company: {
    Title: string;
    ID: number;
  };
  CategoryID: number;
  AssignedByID: number;
  Opportunity?: number;
  CurrencyID?: string;
  Opened?: string;
  stage?: {
    Name: string;
  };
}
export interface DealStage {
  ID: string;
  NAME: string;
  COLOR?: string;
  SORT: number;
}

export interface Company {
  ID: number;
  Title: string;
}

export interface DealFunnel {
  ID: number;
  Name: {
    String: string;
  };
}

export interface DealsResponse {
  result?: Deal[];
  items?: Deal[];
}

export interface DealsFilterParams {
  page: number;
  limit?: number;
  CATEGORY_ID?: number;
  STAGE_ID?: string;
  ASSIGNED_BY_ID?: number;
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  COMPANY_ID?: number;
}

// Состояние CRM
export interface CRMState {
  dealFunnels: DealFunnel[];
  deals: Deal[];
  companies: Company[];
  selectedFunnelId?: number;
  selectedStageId?: string;
  filters: DealsFilterParams;
  isLoading: boolean;
  error: string | null;
}

// Данные для канбан-доски
export interface KanbanColumn {
  id: string;
  title: string;
  deals: Deal[];
  color?: string;
}
