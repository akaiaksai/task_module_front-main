import { AlertTriangle, Clock } from 'lucide-react';
import { useEffect } from 'react';
import { useWorkdayTime } from '../../hooks/timeman/useWorkDay';
import { useAutoCloseWarningStore } from '../../store/auto-close-warning-store';

export const AutoCloseWarning = () => {
  const { isWarningOpen, showCompactMode, closeWarning, toggleCompactMode } =
    useAutoCloseWarningStore();

  const { isAutoCloseImminent, hasActiveTasks, warningThreshold, timeLeft } =
    useWorkdayTime();

  useEffect(() => {
    if (isWarningOpen && (hasActiveTasks() || !isAutoCloseImminent())) {
      console.log('Закрываем предупреждение - активность обнаружена');
      closeWarning();
    }
  }, [isWarningOpen, hasActiveTasks, isAutoCloseImminent, closeWarning]);

  if (!isWarningOpen) {
    return null;
  }

  const secondsLeft = Math.ceil(timeLeft / 1000);
  const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
  const warningThresholdMinutes = warningThreshold / (60 * 1000);
  const isCritical = timeLeft < 2 * 60 * 1000; // 2 минуты
  const progressPercentage = (timeLeft / warningThreshold) * 100;

  const handleShowCompact = () => {
    toggleCompactMode(true);
  };

  // Компактная версия
  if (showCompactMode) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div
          className={`${
            isCritical ? 'bg-red-500' : 'bg-amber-500'
          } text-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity`}
          onClick={() => toggleCompactMode(false)}
          title="Нажмите для подробной информации"
        >
          <Clock className="h-4 w-4" />
          <span className="font-mono font-bold text-sm">
            {minutesLeft > 0 ? `${minutesLeft}м` : `${secondsLeft}с`}
          </span>
        </div>
      </div>
    );
  }

  // Полная версия (только кнопка “Свернуть”)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
      <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-6 max-w-md w-full pointer-events-auto animate-in slide-in-from-top duration-300">
        {/* Заголовок без крестика */}
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle
            className={`h-6 w-6 ${
              isCritical ? 'text-red-500' : 'text-amber-500'
            }`}
          />
          <h3 className="text-lg font-semibold text-gray-900">
            Внимание! Неактивность
          </h3>
        </div>

        <div className="space-y-4">
          {/* Основной текст */}
          <div>
            <p className="text-gray-900 font-medium">
              Рабочий день будет автоматически закрыт через{' '}
              <span
                className={`font-bold ${
                  isCritical ? 'text-red-600' : 'text-amber-600'
                }`}
              >
                {minutesLeft > 0
                  ? `${minutesLeft} минут`
                  : `${secondsLeft} секунд`}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Так как не было активности в задачах
            </p>
          </div>

          {/* Прогресс бар */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  isCritical
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 мин</span>
              <span>{warningThresholdMinutes} мин неактивности</span>
            </div>
          </div>

          {/* Подсказка для пользователя */}
          <div
            className={`p-3 rounded-lg ${
              isCritical
                ? 'bg-red-50 border border-red-200'
                : 'bg-amber-50 border-amber-200 border'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                isCritical ? 'text-red-800' : 'text-amber-800'
              }`}
            >
              🚀 Запустите любую задачу, чтобы продолжить работу
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Это окно автоматически закроется при запуске задачи
            </p>
          </div>

          {/* Только кнопка “Свернуть” */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleShowCompact}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCritical
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              Свернуть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
