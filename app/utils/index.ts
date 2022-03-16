import { NODE_SIZE } from '@app/config/explore';
/**
 * onPointerMove
 *
 * @param container dom
 * @param callback pointermove
 * @returns disposer
 */
export const onPointerMove = (container: HTMLElement, callback: (pos: Record<'top' | 'left', number>) => void) => {
  const react = container.getBoundingClientRect();

  const listener = (ev: PointerEvent) => {
    let left = ev.offsetX;
    let top = ev.offsetY;
    const boxWith = 300;
    const boxHeight = 200;
    if(left + react.left + boxWith > react.right) {
      left = left - boxWith - NODE_SIZE * 2;
    }
    if(top + boxHeight + react.top > react.bottom) {
      top = top - boxHeight - NODE_SIZE * 2;
    }
    // update the pointer pos
    callback({ left: Math.round(left), top: Math.round(top) });
  };

  // Capture pointer coords on move or touchstart
  container.addEventListener('pointermove', listener, { passive: true });

  return () => container.removeEventListener('pointermove', listener);
};
