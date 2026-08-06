'use client';

import * as React from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  role?: string;
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

export function toast(props: Omit<ToastProps, 'id'>) {
  const id = genId();
  const dismissToast = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismissToast();
      },
    },
  });

  setTimeout(() => dispatch({ type: 'REMOVE_TOAST', toastId: id }), TOAST_REMOVE_DELAY);

  return { id, dismiss: dismissToast };
}

export function dismiss(toastId?: string) {
  dispatch({ type: 'DISMISS_TOAST', toastId });
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
