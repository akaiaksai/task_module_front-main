import { useTaskTimerStore } from '@/store/task-timer';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { useElapsedTimeActions } from './elapsed-times/useElapsedTimeActions';
import { useAllTasks, useCompleteTask, useTaskActions } from './useTaskActions';
import { useIntermediateLockStore } from '@/store/task-intermediate';
import { addComment } from '@/lib/api/tasks/tasks';

const stoppingIntermediateTaskIds = new Set<string>();
const completedIntermediateTaskIds = new Set<string>();

interface UseIntermediateTaskProps {
  defaultDuration?: number;
  type?: 'intermediate' | 'meeting';
}

export const useIntermediateTask = (props: UseIntermediateTaskProps = {}) => {
  const { defaultDuration = 20, type = 'intermediate' } = props;

  const { start } = useIntermediateLockStore();
  const { createTask, updateTask } = useTaskActions();
  const { startTask, stopTask } = useTaskTimerStore();
  const { createElapsedTime } = useElapsedTimeActions();
  const queryClient = useQueryClient();
  const { completeTask } = useCompleteTask();

  const { refetch: refetchAllTasks } = useAllTasks();

  const [isLoading, setIsLoading] = useState(false);
  const [isFinding, setIsFinding] = useState(false);

  // Р’ useIntermediateTask РѕР±РЅРѕРІРёС‚Рµ РєРѕРЅС„РёРіСѓСЂР°С†РёСЋ С†РІРµС‚РѕРІ:
  const taskTypeConfig = {
    intermediate: {
      title: 'РџСЂРѕРјРµР¶СѓС‚РѕС‡РЅС‹Рµ РґРµР»Р°',
      defaultDuration: 20,
      descriptionPrefix: 'РџСЂРѕРјРµР¶СѓС‚РѕС‡РЅС‹Рµ РґРµР»Р°',
      color: 'blue', // РР·РјРµРЅРµРЅРѕ СЃ purple РЅР° blue
      tags: ['РїСЂРѕРјРµР¶СѓС‚РѕС‡РЅС‹Рµ'],
    },
    meeting: {
      title: 'Р’СЃС‚СЂРµС‡Р°',
      defaultDuration: 15,
      descriptionPrefix: 'Р’СЃС‚СЂРµС‡Р°',
      color: 'teal', // РР·РјРµРЅРµРЅРѕ СЃ green РЅР° teal
      tags: ['РІСЃС‚СЂРµС‡Рё'],
    },
  };

  const config = taskTypeConfig[type];

  // Р“РµРЅРµСЂРёСЂСѓРµРј СѓРЅРёРєР°Р»СЊРЅС‹Р№ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РґР»СЏ РїРѕРёСЃРєР° Р·Р°РґР°С‡Рё
  const generateTaskIdentifier = () => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return {
      uniqueMarker: `[TASK_ID:${timestamp}_${randomSuffix}]`,
      timestamp,
    };
  };

  const getDeadlineFromNow = (minutes: number) => {
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + minutes);
    return deadline.toISOString();
  };

  // РЈР»СѓС‡С€РµРЅРЅС‹Р№ РїРѕРёСЃРє Р·Р°РґР°С‡Рё СЃ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµРј СѓРЅРёРєР°Р»СЊРЅРѕРіРѕ РјР°СЂРєРµСЂР°
  const findCreatedTask = async (
    uniqueMarker: string,
    userId: number
  ): Promise<number | null> => {
    try {
      setIsFinding(true);
      console.log(
        `рџ”Ќ РќР°С‡РёРЅР°РµРј РїРѕРёСЃРє Р·Р°РґР°С‡Рё СЃ РјР°СЂРєРµСЂРѕРј: ${uniqueMarker} РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ: ${userId}`
      );

      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          console.log(`рџ”„ РџРѕРїС‹С‚РєР° РїРѕРёСЃРєР° ${attempt + 1}/8`);

          // РРЅРІР°Р»РёРґРёСЂСѓРµРј РєСЌС€ Рё РїРµСЂРµР·Р°РїСЂР°С€РёРІР°РµРј РґР°РЅРЅС‹Рµ
          await queryClient.invalidateQueries({ queryKey: ['tasks'] });
          const freshData = await refetchAllTasks();

          if (freshData.data) {
            console.log(
              `рџ“Љ РџРѕР»СѓС‡РµРЅРѕ ${freshData.data.length} Р·Р°РґР°С‡ РґР»СЏ РїРѕРёСЃРєР°`
            );

            // Р›РѕРіРёСЂСѓРµРј РїРµСЂРІС‹Рµ РЅРµСЃРєРѕР»СЊРєРѕ Р·Р°РґР°С‡ РґР»СЏ РѕС‚Р»Р°РґРєРё
            if (attempt === 0 && freshData.data.length > 0) {
              console.log(
                'рџ“‹ РџСЂРёРјРµСЂ СЃС‚СЂСѓРєС‚СѓСЂС‹ Р·Р°РґР°С‡:',
                freshData.data.slice(0, 3).map((task: ANY) => ({
                  id: task.id,
                  title: task.title,
                  description: task.description
                    ? task.description.substring(0, 100) + '...'
                    : 'null',
                  assigneeId: task.assigneeId,
                  responsibleId: task.responsibleId,
                  createdAt: task.createdAt,
                }))
              );
            }

            // РС‰РµРј Р·Р°РґР°С‡Сѓ РїРѕ СѓРЅРёРєР°Р»СЊРЅРѕРјСѓ РјР°СЂРєРµСЂСѓ РІ РѕРїРёСЃР°РЅРёРё
            const foundTask = freshData.data.find((task: ANY) => {
              const hasMarker =
                task.description && task.description.includes(uniqueMarker);
              const isResponsible =
                task.assigneeId === userId ||
                task.assigneeId === userId.toString() ||
                task.responsibleId === userId ||
                task.responsibleId === userId.toString();

              if (hasMarker && isResponsible) {
                console.log(
                  'вњ… РќР°Р№РґРµРЅР° Р·Р°РґР°С‡Р° РїРѕ СѓРЅРёРєР°Р»СЊРЅРѕРјСѓ РјР°СЂРєРµСЂСѓ:',
                  task.id,
                  task.title
                );
                return true;
              }
              return false;
            });

            if (foundTask) {
              return Number(foundTask.id);
            }

            console.log(
              'вќЊ Р—Р°РґР°С‡Р° РЅРµ РЅР°Р№РґРµРЅР° РїРѕ РјР°СЂРєРµСЂСѓ, РїСЂРѕР±СѓРµРј Р°Р»СЊС‚РµСЂРЅР°С‚РёРІРЅС‹Рµ РјРµС‚РѕРґС‹...'
            );

            // РђР»СЊС‚РµСЂРЅР°С‚РёРІРЅС‹Р№ РїРѕРёСЃРє: Р·Р°РґР°С‡Рё СЃ С‚Р°РєРёРј Р¶Рµ РЅР°Р·РІР°РЅРёРµРј СЃРѕР·РґР°РЅРЅС‹Рµ Р·Р° РїРѕСЃР»РµРґРЅРёРµ 5 РјРёРЅСѓС‚
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const recentTasks = freshData.data
              .filter((task: ANY) => {
                const taskCreated = new Date(task.createdAt).getTime();
                const isRecent = taskCreated > fiveMinutesAgo;
                const isSameTitle = task.title === config.title;
                const isSameUser =
                  task.assigneeId === userId ||
                  task.assigneeId === userId.toString() ||
                  task.responsibleId === userId ||
                  task.responsibleId === userId.toString();

                return isRecent && isSameTitle && isSameUser;
              })
              .sort((a: ANY, b: ANY) => {
                const timeA = new Date(a.createdAt).getTime();
                const timeB = new Date(b.createdAt).getTime();
                return timeB - timeA; // РЎРЅР°С‡Р°Р»Р° СЃР°РјС‹Рµ РЅРѕРІС‹Рµ
              });

            if (recentTasks.length > 0) {
              return Number(recentTasks[0].id);
            }

            // РўСЂРµС‚РёР№ РјРµС‚РѕРґ: РїРѕРёСЃРє СЃСЂРµРґРё РІСЃРµС… Р·Р°РґР°С‡ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Р·Р° РїРѕСЃР»РµРґРЅРёРµ 10 РјРёРЅСѓС‚
            const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
            const userTasks = freshData.data
              .filter((task: ANY) => {
                const taskCreated = new Date(task.createdAt).getTime();
                const isRecent = taskCreated > tenMinutesAgo;
                const isSameUser =
                  task.assigneeId === userId ||
                  task.assigneeId === userId.toString() ||
                  task.responsibleId === userId ||
                  task.responsibleId === userId.toString();

                return isRecent && isSameUser;
              })
              .sort((a: ANY, b: ANY) => {
                const timeA = new Date(a.createdAt).getTime();
                const timeB = new Date(b.createdAt).getTime();
                return timeB - timeA;
              });

            // РС‰РµРј Р·Р°РґР°С‡Сѓ СЃ РЅСѓР¶РЅС‹Рј РЅР°Р·РІР°РЅРёРµРј СЃСЂРµРґРё Р·Р°РґР°С‡ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
            const targetTask = userTasks.find(
              (task: ANY) => task.title === config.title
            );

            if (targetTask) {
              console.log(
                'вњ… РќР°Р№РґРµРЅР° Р·Р°РґР°С‡Р° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїРѕ РЅР°Р·РІР°РЅРёСЋ:',
                targetTask.id
              );
              return Number(targetTask.id);
            }

            // Р•СЃР»Рё РЅРµ РЅР°С€Р»Рё РїРѕ РЅР°Р·РІР°РЅРёСЋ, Р±РµСЂРµРј СЃР°РјСѓСЋ СЃРІРµР¶СѓСЋ Р·Р°РґР°С‡Сѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
            if (userTasks.length > 0) {
              console.log(
                'вњ… РќР°Р№РґРµРЅР° СЃР°РјР°СЏ СЃРІРµР¶Р°СЏ Р·Р°РґР°С‡Р° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ:',
                userTasks[0].id
              );
              return Number(userTasks[0].id);
            }
          }

          // РЈРІРµР»РёС‡РёРІР°СЋС‰Р°СЏСЃСЏ Р·Р°РґРµСЂР¶РєР°
          const delay = Math.min(2000 * (attempt + 1), 10000);
          console.log(`вЏі Р–РґРµРј ${delay}ms РїРµСЂРµРґ СЃР»РµРґСѓСЋС‰РµР№ РїРѕРїС‹С‚РєРѕР№`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } catch (error) {
          console.error(`вќЊ РџРѕРїС‹С‚РєР° ${attempt + 1} РЅРµ СѓРґР°Р»Р°СЃСЊ:`, error);
          const delay = Math.min(2000 * (attempt + 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      console.error('рџ’Ґ РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°Р№С‚Рё Р·Р°РґР°С‡Сѓ РїРѕСЃР»Рµ РІСЃРµС… РїРѕРїС‹С‚РѕРє');
      return null;
    } catch (error) {
      console.error('рџ’Ґ РљСЂРёС‚РёС‡РµСЃРєР°СЏ РѕС€РёР±РєР° РІ findCreatedTask:', error);
      return null;
    } finally {
      setIsFinding(false);
    }
  };

  const createIntermediateTask = async (
    comment: string,
    durationMinutes: number = defaultDuration,
    userId: number
  ) => {
    if (!comment.trim()) {
      toast.error('РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РґРѕР±Р°РІСЊС‚Рµ РєРѕРјРјРµРЅС‚Р°СЂРёР№');
      return null;
    }

    if (!userId) {
      toast.error('РќРµ РѕРїСЂРµРґРµР»РµРЅ ID РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ');
      return null;
    }

    setIsLoading(true);
    let createdTaskId: number | null = null;

    try {
      const { uniqueMarker, timestamp } = generateTaskIdentifier();
      const creationTime = new Date(timestamp).toLocaleString('ru-RU');

      // РЎРѕР·РґР°РµРј Р·Р°РґР°С‡Сѓ СЃ РїСЂР°РІРёР»СЊРЅС‹Рј С„РѕСЂРјР°С‚РѕРј РЅР°Р·РІР°РЅРёСЏ
      const taskTitle = `${config.title}: ${comment.substring(0, 50)}${
        comment.length > 50 ? '...' : ''
      }`;

      const deadlineISO = getDeadlineFromNow(durationMinutes);

      const taskData = {
        TITLE: taskTitle, // РСЃРїРѕР»СЊР·СѓРµРј С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРЅРѕРµ РЅР°Р·РІР°РЅРёРµ
        DESCRIPTION: `${comment}\n\n---\nРўРёРї: ${config.descriptionPrefix}\nРџР»Р°РЅРёСЂСѓРµРјРѕРµ РІСЂРµРјСЏ: ${durationMinutes} РјРёРЅСѓС‚\nРЎРѕР·РґР°РЅРѕ: ${creationTime}\n${uniqueMarker}`,
        RESPONSIBLE_ID: userId,
        TIME_ESTIMATE: durationMinutes * 60,
        DEADLINE: deadlineISO,
        TAGS: config.tags,
        STATUS: '1',
      };

      const response = await createTask(taskData);

      if (
        response &&
        (response.status === 'task created successfully' || response.success)
      ) {
        // Р”Р°РµРј СЃРµСЂРІРµСЂСѓ РІСЂРµРјСЏ РЅР° РѕР±СЂР°Р±РѕС‚РєСѓ
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // РСЃРїРѕР»СЊР·СѓРµРј СѓРЅРёРєР°Р»СЊРЅС‹Р№ РјР°СЂРєРµСЂ РґР»СЏ РїРѕРёСЃРєР°
        createdTaskId = await findCreatedTask(uniqueMarker, userId);

        if (createdTaskId) {
          const localTaskId = `${type}-${createdTaskId}`;
          startTask(localTaskId, {
            title: taskTitle,
            plannedMinutes: durationMinutes,
          });
          start(localTaskId, durationMinutes);
          toast.success(`${config.title} СЃРѕР·РґР°РЅР° Рё Р·Р°РїСѓС‰РµРЅР°`);
          return localTaskId;
        } else {
          // Р¤РёРЅР°Р»СЊРЅР°СЏ РїРѕРїС‹С‚РєР°: СЂСѓС‡РЅРѕР№ РїРѕРёСЃРє С‡РµСЂРµР· 10 СЃРµРєСѓРЅРґ
          await new Promise((resolve) => setTimeout(resolve, 10000));

          await queryClient.invalidateQueries({ queryKey: ['tasks'] });
          const finalData = await refetchAllTasks();

          if (finalData.data) {
            // РС‰РµРј Р·Р°РґР°С‡Сѓ РїРѕ РІСЃРµРј РІРѕР·РјРѕР¶РЅС‹Рј РєСЂРёС‚РµСЂРёСЏРј
            const allUserTasks = finalData.data.filter((task: ANY) => {
              return (
                task.assigneeId === userId ||
                task.assigneeId === userId.toString() ||
                task.responsibleId === userId ||
                task.responsibleId === userId.toString()
              );
            });

            // РС‰РµРј РїРѕ РјР°СЂРєРµСЂСѓ РµС‰Рµ СЂР°Р·
            const markedTask = allUserTasks.find(
              (task: ANY) =>
                task.description && task.description.includes(uniqueMarker)
            );

            if (markedTask) {
              createdTaskId = Number(markedTask.id);
              const localTaskId = `${type}-${createdTaskId}`;
              startTask(localTaskId, {
                title: taskTitle,
                plannedMinutes: durationMinutes,
              });

              toast.success(
                `${config.title} СЃРѕР·РґР°РЅР° Рё Р·Р°РїСѓС‰РµРЅР° (РЅР°Р№РґРµРЅР° РІ С„РёРЅР°Р»СЊРЅРѕРј РїРѕРёСЃРєРµ)`
              );
              return localTaskId;
            }

            // Р‘РµСЂРµРј СЃР°РјСѓСЋ СЃРІРµР¶СѓСЋ Р·Р°РґР°С‡Сѓ СЃ РЅСѓР¶РЅС‹Рј РЅР°Р·РІР°РЅРёРµРј
            const recentTask = allUserTasks
              .filter((task: ANY) => task.title === config.title)
              .sort((a: ANY, b: ANY) => {
                const timeA = new Date(a.createdAt).getTime();
                const timeB = new Date(b.createdAt).getTime();
                return timeB - timeA;
              })[0];

            if (recentTask) {
              createdTaskId = Number(recentTask.id);
              const localTaskId = `${type}-${createdTaskId}`;
              startTask(localTaskId, {
                title: taskTitle,
                plannedMinutes: durationMinutes,
              });

              toast.success(
                `${config.title} СЃРѕР·РґР°РЅР° Рё Р·Р°РїСѓС‰РµРЅР° (РЅР°Р№РґРµРЅР° РїРѕ РЅР°Р·РІР°РЅРёСЋ)`
              );
              return localTaskId;
            }
          }

          throw new Error(
            'РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°Р№С‚Рё СЃРѕР·РґР°РЅРЅСѓСЋ Р·Р°РґР°С‡Сѓ РїРѕСЃР»Рµ РІСЃРµС… РїРѕРїС‹С‚РѕРє РїРѕРёСЃРєР°'
          );
        }
      } else {
        const errorMessage = response?.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р·Р°РґР°С‡Сѓ';
        throw new Error(errorMessage);
      }
    } catch (error: ANY) {
      console.error('рџ’Ґ РљСЂРёС‚РёС‡РµСЃРєР°СЏ РѕС€РёР±РєР° РїСЂРё СЃРѕР·РґР°РЅРёРё Р·Р°РґР°С‡Рё:', error);
      toast.error(`РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р·Р°РґР°С‡Сѓ: ${error.message}`);

      // Р•СЃР»Рё Р·Р°РґР°С‡Р° Р±С‹Р»Р° СЃРѕР·РґР°РЅР°, РЅРѕ РЅРµ РЅР°Р№РґРµРЅР°, СЃРѕРѕР±С‰Р°РµРј РѕР± СЌС‚РѕРј
      if (createdTaskId) {
        console.warn(
          `вљ пёЏ Р—Р°РґР°С‡Р° СЃРѕР·РґР°РЅР° СЃ ID: ${createdTaskId}, РЅРѕ РЅРµ Р±С‹Р»Р° Р·Р°РїСѓС‰РµРЅР°`
        );
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // РћСЃС‚Р°Р»СЊРЅС‹Рµ С„СѓРЅРєС†РёРё Р±РµР· РёР·РјРµРЅРµРЅРёР№
  const updateIntermediateTask = async (
    taskId: string,
    comment: string,
    durationMinutes: number = defaultDuration
  ) => {
    if (!comment.trim()) {
      toast.error('РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РґРѕР±Р°РІСЊС‚Рµ РєРѕРјРјРµРЅС‚Р°СЂРёР№');
      return;
    }

    try {
      const serverTaskId = taskId.replace(`${type}-`, '');

      const taskData = {
        TITLE: config.title,
        DESCRIPTION: `${comment}\n\n---\nРўРёРї: ${config.descriptionPrefix}\nРџР»Р°РЅРёСЂСѓРµРјРѕРµ РІСЂРµРјСЏ: ${durationMinutes} РјРёРЅСѓС‚`,
        TIME_ESTIMATE: durationMinutes * 60,
      };

      await updateTask({
        id: serverTaskId.toString(),
        payload: taskData,
      });

      toast.success('РљРѕРјРјРµРЅС‚Р°СЂРёР№ Р·Р°РґР°С‡Рё РѕР±РЅРѕРІР»РµРЅ');
      return true;
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё РѕР±РЅРѕРІР»РµРЅРёРё РєРѕРјРјРµРЅС‚Р°СЂРёСЏ Р·Р°РґР°С‡Рё:', error);
      toast.error('РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РєРѕРјРјРµРЅС‚Р°СЂРёР№');
      return false;
    }
  };

  const addIntermediateComment = async (taskId: string, text: string) => {
    if (!text.trim()) {
      return;
    }

    const serverTaskId = taskId.replace(`${type}-`, '');

    await addComment(serverTaskId, `РџСЂРѕРјРµР¶СѓС‚РѕС‡РЅС‹Рµ РґРµР»Р°: ${text}`);
  };

  const stopIntermediateTask = async (taskId: string) => {
    if (!taskId) {
      return;
    }

    const serverTaskId = taskId.replace(`${type}-`, '');
    if (!serverTaskId) {
      return false;
    }

    if (
      completedIntermediateTaskIds.has(serverTaskId) ||
      stoppingIntermediateTaskIds.has(serverTaskId)
    ) {
      return true;
    }

    stoppingIntermediateTaskIds.add(serverTaskId);

    try {
      const elapsedSeconds = stopTask(taskId, true);

      if (elapsedSeconds > 0) {
        await createElapsedTime({
          taskId: Number(serverTaskId),
          seconds: elapsedSeconds,
        });
      }

      await completeTask({
        taskId: serverTaskId,
        silent: true,
      });

      completedIntermediateTaskIds.add(serverTaskId);
      toast.success(`${config.title} завершены`);

      return true;
    } catch (error: ANY) {
      console.error('Ошибка при сохранении времени задачи:', error);
      const details =
        error?.response?.data?.message ||
        error?.message ||
        'Неизвестная ошибка';
      toast.error(`Не удалось сохранить ${config.title.toLowerCase()}: ${details}`);
      return false;
    } finally {
      stoppingIntermediateTaskIds.delete(serverTaskId);
    }
  };

  return {
    createIntermediateTask,
    updateIntermediateTask,
    stopIntermediateTask,
    addIntermediateComment,
    isLoading: isLoading || isFinding,
    taskType: type,
    defaultDuration: config.defaultDuration,
    title: config.title,
    color: config.color,
  };
};
