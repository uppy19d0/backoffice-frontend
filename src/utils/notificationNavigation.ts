import { DashboardNotification } from '../context/NotificationsContext';

export type NotificationDestination =
  | 'dashboard'
  | 'notifications'
  | 'requests'
  | 'users'
  | 'reports'
  | 'config'
  | 'beneficiaries';

export interface NotificationNavigationTarget {
  page: NotificationDestination;
  requestId?: string;
}

const REQUEST_RELATED_TYPES = new Set([
  'request',
  'request-assignment',
  'request-unassigned',
  'assignment',
  'approval',
]);

const normalizeIdentifier = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeValue = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/[\s_]+/g, '-');
};

export const resolveNotificationNavigationTarget = (
  notification: DashboardNotification,
): NotificationNavigationTarget => {
  const relatedRequestId =
    normalizeIdentifier(notification.relatedRequestId) ??
    normalizeIdentifier(notification.metadata?.requestId) ??
    normalizeIdentifier(notification.metadata?.requestCode) ??
    normalizeIdentifier(notification.metadata?.requestType);

  const normalizedType = normalizeValue(notification.type) ?? 'general';

  if (relatedRequestId || REQUEST_RELATED_TYPES.has(normalizedType)) {
    return {
      page: 'requests',
      requestId: relatedRequestId ?? undefined,
    };
  }

  const channel = normalizeValue(notification.metadata?.channel);
  if (channel) {
    if (channel.includes('user')) {
      return { page: 'users' };
    }
    if (channel.includes('report')) {
      return { page: 'reports' };
    }
    if (channel.includes('config') || channel.includes('setting')) {
      return { page: 'config' };
    }
    if (channel.includes('beneficiary') || channel.includes('padron')) {
      return { page: 'beneficiaries' };
    }
  }

  if (normalizedType === 'dashboard') {
    return { page: 'dashboard' };
  }

  return { page: 'notifications' };
};
