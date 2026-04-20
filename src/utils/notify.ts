type NotifyType = 'success' | 'error' | 'warning' | 'info';
type DispatchFn = (type: NotifyType, message: string) => void;

let _dispatch: DispatchFn | null = null;

export function registerNotifyDispatch(fn: DispatchFn) {
  _dispatch = fn;
}

const make = (type: NotifyType) => (message: string) => _dispatch?.(type, message);

export const notify = {
  success: make('success'),
  error:   make('error'),
  warning: make('warning'),
  info:    make('info'),
};
