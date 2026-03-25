interface DismissAlertAction {
  type: 'HIDE_ALERT';
}

interface ShowAlertParams {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: unknown;
}

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: unknown;
}

export function dismissAlert(): DismissAlertAction {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertParams): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
