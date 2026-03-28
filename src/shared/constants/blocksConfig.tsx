import { ClockOutline } from '@/components/icons/clockOutline';
import { DoubleComments } from '@/components/icons/doubleComments';
import { LayoutList } from '@/components/icons/layoutList';
import { Notebook } from '@/components/icons/notebook';
import { Users } from '@/components/icons/users/Users';
import { ComponentType } from 'react';
import { BlockType } from '../types/blockType';

interface BlockConfig {
  id: BlockType;
  label: string;
  icon: ComponentType<{ color?: string; className?: string }>;
  activeColor: string;
  bgColor: string;
  borderColor: string;
}

export const blocksConfig: BlockConfig[] = [
  {
    id: 'planning',
    label: 'Планирование времени',
    icon: ClockOutline,
    activeColor: '#FB8200',
    borderColor: '#FB82001F',
    bgColor: '#FB820014',
  },
  {
    id: 'project',
    label: 'Проект',
    icon: Notebook,
    borderColor: '#5C6BC01F',
    activeColor: '#5C6BC0',
    bgColor: '#5C6BC014',
  },
  {
    id: 'team',
    label: 'Команда',
    icon: Users,
    activeColor: '#EC407A',
    borderColor: '#EC407A1F',
    bgColor: '#EC407A14',
  },

  {
    id: 'communication',
    label: 'История коммуникации',
    icon: LayoutList,
    borderColor: '#0696971F',
    activeColor: '#069697',
    bgColor: '#06969714',
  },
  {
    id: 'comments',
    label: 'Комментарии',
    icon: DoubleComments,
    borderColor: '#F542361F',
    activeColor: '#F54236',
    bgColor: '#F5423614',
  },
  // {
  //   id: 'files',
  //   label: 'Документация по проекту',
  //   icon: Documents,
  //   activeColor: '#2879FE',
  //   bgColor: '#EAF2FF',
  // },
];
