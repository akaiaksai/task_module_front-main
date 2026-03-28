import { useEffect, useRef } from 'react';

type AutoScrollState = {
  speed: number;
  active: boolean;
};

export function useAutoScrollOnDrag() {
  const autoScrollRef = useRef<AutoScrollState>({
    speed: 0,
    active: false,
  });

  useEffect(() => {
    function kill() {
      autoScrollRef.current.speed = 0;
      autoScrollRef.current.active = false;
    }

    window.addEventListener('dragend', kill);
    window.addEventListener('mouseup', kill);
    window.addEventListener('blur', kill);

    return () => {
      window.removeEventListener('dragend', kill);
      window.removeEventListener('mouseup', kill);
      window.removeEventListener('blur', kill);
    };
  }, []);

  useEffect(() => {
    let rafId: number;

    function tick() {
      const s = autoScrollRef.current;

      if (s.active && s.speed !== 0) {
        window.scrollBy({ top: s.speed, behavior: 'auto' });
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []);

  function handleVerticalAutoScroll(e: DragEvent) {
    const EDGE = 200;
    const MAX_SPEED = 6;
    const MIN_SPEED = 2;

    const y = e.clientY;
    const vh = window.innerHeight;

    let speed = 0;

    if (y < EDGE) {
      const ratio = 1 - y / EDGE;
      speed = -(MIN_SPEED + ratio * (MAX_SPEED - MIN_SPEED));
    } else if (y > vh - EDGE) {
      const dist = vh - y;
      const ratio = 1 - dist / EDGE;
      speed = MIN_SPEED + ratio * (MAX_SPEED - MIN_SPEED);
    }

    autoScrollRef.current.speed = speed;
    autoScrollRef.current.active = speed !== 0;
  }

  function stopAutoScroll() {
    autoScrollRef.current.speed = 0;
    autoScrollRef.current.active = false;
  }

  return {
    handleVerticalAutoScroll,
    stopAutoScroll,
  };
}
