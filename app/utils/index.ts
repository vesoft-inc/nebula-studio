import { useCallback, useState } from 'react';
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


export const onAbsolutePositionMove = (
  container: HTMLElement,
  callback: (pos: Record<'top' | 'left' | 'offsetX' | 'offsetY', number>) => void
) => {
  const listener = (ev: PointerEvent) => {
    // update the pointer pos
    const offset = container.getBoundingClientRect();
    callback({ left: ev.pageX, top: ev.pageY, offsetX: offset.x, offsetY: offset.y });
  };

  // Capture pointer coords on move or touchstart
  container.addEventListener('pointermove', listener, { passive: true });

  return () => container.removeEventListener('pointermove', listener);
};

export function useBatchState<T extends Record<string, any>>(initState: T) {
  const [state, updateState] = useState(initState);

  const setState = useCallback((action: Partial<T> | ((preState: T) => T)) => {
    typeof action === 'function' ? updateState(action) : updateState((s) => ({ ...s, ...action }));
  }, []);

  return { state, setState };
}