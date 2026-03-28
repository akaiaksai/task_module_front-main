import { useRef } from 'react';

export default function useDragScroll() {
  const ref = useRef<HTMLDivElement | null>(null);
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  const onMouseDown = (e: ANY) => {
    isDown = true;
    startX = e.pageX - ref.current!.offsetLeft;
    scrollLeft = ref.current!.scrollLeft;
  };

  const onMouseLeave = () => {
    isDown = false;
  };

  const onMouseUp = () => {
    isDown = false;
  };

  const onMouseMove = (e: ANY) => {
    if (!isDown) {
      return;
    }
    e.preventDefault();
    const x = e.pageX - ref.current!.offsetLeft;
    const walk = (x - startX) * 1.2;
    ref.current!.scrollLeft = scrollLeft - walk;
  };

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
  };
}
