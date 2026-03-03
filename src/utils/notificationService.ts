export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

export function showDeadlineNotification(obligationName: string, daysUntil: number): void {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  const isOverdue = daysUntil <= 0;
  const title = isOverdue
    ? `⚠️ Overskredet: ${obligationName}`
    : `📅 Frist nærmer sig: ${obligationName}`;
  const body = isOverdue
    ? 'Fristen er overskredet – marker som indberettet hurtigst muligt.'
    : `${daysUntil} ${daysUntil === 1 ? 'dag' : 'dage'} tilbage til fristen.`;

  new Notification(title, { body, icon: '/favicon.ico' });
}

export function checkAndNotifyUpcoming(
  obligations: Array<{ name: string; daysUntil: number }>
): void {
  obligations
    .filter(o => o.daysUntil <= 7)
    .forEach(o => showDeadlineNotification(o.name, o.daysUntil));
}

export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
