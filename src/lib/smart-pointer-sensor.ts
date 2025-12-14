import type { PointerEvent } from 'react';
import { PointerSensor } from '@dnd-kit/core';
import type { PointerSensorOptions } from '@dnd-kit/core';

function shouldHandleEvent(element: HTMLElement | null): boolean {
  let cur = element;
  while (cur) {
    if (cur.dataset?.noDnd === 'true') {
      return false;
    }
    cur = cur.parentElement;
  }
  return true;
}

export class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: (
        { nativeEvent: event }: PointerEvent,
        { onActivation }: PointerSensorOptions
      ): boolean => {
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          !shouldHandleEvent(event.target as HTMLElement)
        ) {
          return false;
        }
        onActivation?.({ event });
        return true;
      },
    },
  ];
}
