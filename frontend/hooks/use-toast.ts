'use client';

import * as React from 'react';

const TOAST_LIMIT = 3;
const TOAST_DURATION = 5000;
const TOAST_EXIT_DELAY = 300;

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  role?: string;
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  action?: React.ReactNode;
};

type State = {
  toasts: ToastProps[];
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: { type: string; toast?: ToastProps; toastId?: string }) {
  if (action.type === 'ADD_TOAST' && action.toast) {
    const incoming = action.toast;
    const deduped = memoryState.toasts.filter(
      (t) =>
        t.title !== incoming.title ||
        t.description !== incoming.description ||
        t.variant !== incoming.variant
    );
    memoryState = {
      toasts: [incoming, ...deduped].slice(0, TOAST_LIMIT),
    };
  } else if (action.type === 'DISMISS_TOAST') {
    memoryState = {
      toasts: memoryState.toasts.map((t) =>
        t.id === action.toastId || action.toastId === undefined ? { ...t, open: false } : t
      ),
    };
  } else if (action.type === 'REMOVE_TOAST') {
    memoryState = {
      toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
    };
  }
  for (const listener of listeners) listener(memoryState);
}

function subscribeToToasts(onStoreChange: () => void) {
  listeners.push(onStoreChange);
  return () => {
    const index = listeners.indexOf(onStoreChange);
    if (index > -1) listeners.splice(index, 1);
  };
}

function scheduleRemove(toastId: string) {
  setTimeout(() => dispatch({ type: 'REMOVE_TOAST', toastId }), TOAST_EXIT_DELAY);
}

export function toast(props: Omit<ToastProps, 'id'>) {
  const id = genId();

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      duration: props.duration ?? TOAST_DURATION,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss(id);
      },
    },
  });

  return { id, dismiss: () => dismiss(id) };
}

export function dismiss(toastId?: string) {
  const ids = toastId ? [toastId] : memoryState.toasts.map((t) => t.id);
  dispatch({ type: 'DISMISS_TOAST', toastId });
  for (const id of ids) scheduleRemove(id);
}

export function useToast() {
  return { toast, dismiss };
}

export function useToastState(): State {
  return React.useSyncExternalStore(
    subscribeToToasts,
    () => memoryState,
    () => memoryState
  );
}
