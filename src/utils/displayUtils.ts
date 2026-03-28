import { User } from '../lib/api/users';
import { Task } from '../shared/types/task';
import { getNumberValue } from './dataNormalizers';

export const getUserDisplayName = (user: User): string => {
  const name = getStringValue(user.Name);
  const lastName = getStringValue(user.LastName);
  return [name, lastName].filter(Boolean).join(' ') || `ID: ${user.ID}`;
};

export const getGroupDisplayName = (group: ANY): string => {
  return getStringValue(group.Name) || `ID: ${getNumberValue(group.ID)}`;
};

export const getTaskDisplayName = (task: Task): string => {
  return getStringValue(task.title) || `Задача #${task.id}`;
};

export const getSelectedDealDisplayName = (
  crmValue: string,
  deals: ANY[]
): string => {
  if (!crmValue.startsWith('D_')) {
    return crmValue;
  }
  const dealId = parseInt(crmValue.substring(2));
  const deal = deals.find((d) => d.ID === dealId);
  return deal ? deal.Title : `Сделка #${dealId}`;
};
export const getSelectedSmartContractDisplayName = (
  crmValue: string,
  smartContracts: ANY[]
): string => {
  if (crmValue.startsWith('SC_')) {
    const contractId = parseInt(crmValue.substring(3));
    const contract = smartContracts.find((c) => c.ID === contractId);
    return contract
      ? getStringValue(contract.Title)
      : `Смарт-процесс #${contractId}`;
  }
  return crmValue;
};

// Вспомогательная функция
const getStringValue = (value: ANY): string => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && value.Valid) {
    return value.String || '';
  }
  return '';
};
