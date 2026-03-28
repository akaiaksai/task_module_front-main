// useTaskTapHandlers.ts
import type React from 'react';
import { useRef } from 'react';

interface UseTaskTapHandlersParams {
  taskId: string;
  isActive: boolean;
  setActiveTaskId: (v: string | null) => void;
  handleTaskClick: (taskId: string) => void;
}

export const useTaskTapHandlers = ({
  taskId,
  isActive,
  setActiveTaskId,
  handleTaskClick,
}: UseTaskTapHandlersParams) => {
  const touchInfoRef = useRef<{
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);

  const isAction = (target: EventTarget | null) => {
    return (
      target instanceof HTMLElement && target.closest('[data-card-action]')
    );
  };

  const onPointerDownCapture: React.PointerEventHandler<HTMLElement> = (e) => {
    if (isAction(e.target)) {
      e.stopPropagation();
    }
  };

  const touchTapHandledRef = useRef(false);

  const TOUCH_MOVE_THRESHOLD = 12;

  const handleTaskTap = () => {
    if (!isActive) {
      setActiveTaskId(taskId);
      return;
    }
    handleTaskClick(taskId);
  };

  const onTouchStart: React.TouchEventHandler<HTMLElement> = (e) => {
    if (e.target !== e.currentTarget) {
      return;
    }

    const touch = e.touches[0];
    touchInfoRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      moved: false,
    };
  };

  const onTouchMove: React.TouchEventHandler<HTMLElement> = (e) => {
    if (!touchInfoRef.current) {
      return;
    }
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchInfoRef.current.x);
    const dy = Math.abs(touch.clientY - touchInfoRef.current.y);

    if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) {
      touchInfoRef.current.moved = true;
    }
  };

  const onTouchEnd: React.TouchEventHandler<HTMLElement> = (e) => {
    if (isAction(e.target)) {
      return;
    }

    const info = touchInfoRef.current;
    touchInfoRef.current = null;

    if (!info || info.moved) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    touchTapHandledRef.current = true;

    setTimeout(() => {
      touchTapHandledRef.current = false;
    }, 300);

    handleTaskTap();
  };

  const onClick: React.MouseEventHandler<HTMLElement> = (e) => {
    if (isAction(e.target)) {
      return;
    }

    if (touchTapHandledRef.current) {
      touchTapHandledRef.current = false;
      return;
    }

    e.stopPropagation();
    handleTaskTap();
  };

  return {
    onClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onPointerDownCapture,
  };
};
