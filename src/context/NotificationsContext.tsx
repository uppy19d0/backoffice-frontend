import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ApiError,
  NotificationDto,
  getNotifications,
  markNotificationRead,
} from '../services/api';

export type NotificationPriority = 'high' | 'medium' | 'low';
export type NotificationTargetRole = 'Admin' | 'Supervisor' | 'Analyst' | 'All';

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  priority: NotificationPriority;
  type: string;
  targetRoles: NotificationTargetRole[];
  source: 'remote' | 'local';
  raw?: NotificationDto;
}

export interface NotificationInput {
  id?: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  type?: string;
  targetRoles?: NotificationTargetRole[];
  createdAt?: string;
}

interface NotificationsContextValue {
  notifications: DashboardNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: (showErrors?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  pushNotification: (input: NotificationInput) => DashboardNotification;
}

interface NotificationsProviderProps {
  children: React.ReactNode;
  currentUser: { role?: string | null; roleLevel?: string | null } | null;
  authToken: string | null;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const NORMALIZED_ROLE_MAP: Record<string, NotificationTargetRole> = {
  admin: 'Admin',
  administrador: 'Admin',
  supervisor: 'Supervisor',
  manager: 'Supervisor',
  analyst: 'Analyst',
  analista: 'Analyst',
};

const ROLE_PRIORITY: NotificationTargetRole[] = ['Admin', 'Supervisor', 'Analyst'];

const generateNotificationId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-notification-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
};

const normalizeToArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value];
};

const mapStringToTargetRole = (value: string): NotificationTargetRole | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === 'all' || normalized === 'todos') {
    return 'All';
  }
  const mapped = NORMALIZED_ROLE_MAP[normalized];
  return mapped ?? null;
};

const extractTargetRolesFromDto = (notification: NotificationDto): NotificationTargetRole[] => {
  const roles = new Set<NotificationTargetRole>();

  const maybeCollect = (value: unknown) => {
    for (const item of normalizeToArray(value)) {
      if (typeof item === 'string') {
        const role = mapStringToTargetRole(item);
        if (role) {
          roles.add(role);
        }
      } else if (typeof item === 'object' && item !== null) {
        const nested = item as Record<string, unknown>;
        if (typeof nested.role === 'string') {
          const role = mapStringToTargetRole(nested.role);
          if (role) {
            roles.add(role);
          }
        }
        maybeCollect(Object.values(nested));
      }
    }
  };

  if (notification) {
    const record = notification as Record<string, unknown>;
    const candidateKeys = [
      'targetRoles',
      'targets',
      'roles',
      'audience',
      'recipientRoles',
      'recipients',
    ];
    candidateKeys.forEach((key) => {
      if (key in record) {
        maybeCollect(record[key]);
      }
    });
    if (record.meta) {
      maybeCollect(record.meta);
    }
    if (record.metadata) {
      maybeCollect(record.metadata);
    }
  }

  if (roles.size === 0) {
    return ['All'];
  }

  return Array.from(roles);
};

const extractPriorityFromDto = (notification: NotificationDto): NotificationPriority => {
  const prioritySource =
    normalizeString(notification.priority) ??
    normalizeString((notification as Record<string, unknown>).severity) ??
    normalizeString((notification as Record<string, unknown>).importance) ??
    '';

  const normalized = prioritySource.toLowerCase();
  if (normalized.includes('high') || normalized.includes('alta')) {
    return 'high';
  }
  if (normalized.includes('low') || normalized.includes('baja')) {
    return 'low';
  }
  return 'medium';
};

const mapNotificationDtoToDashboard = (
  notification: NotificationDto,
  index: number,
): DashboardNotification => {
  const id =
    normalizeString(notification.id) ??
    normalizeString((notification as Record<string, unknown>).notificationId) ??
    normalizeString((notification as Record<string, unknown>).uuid) ??
    `notification-${index}`;

  const title =
    normalizeString(notification.title) ??
    normalizeString((notification as Record<string, unknown>).subject) ??
    'Notificación del sistema';

  const message =
    normalizeString(notification.message) ??
    normalizeString(notification.content) ??
    normalizeString(notification.body) ??
    normalizeString((notification as Record<string, unknown>).description) ??
    title;

  const createdAt =
    normalizeString(notification.createdAt) ??
    normalizeString(notification.timestamp) ??
    normalizeString((notification as Record<string, unknown>).date) ??
    new Date().toISOString();

  const read =
    Boolean(notification.isRead ?? notification.read) ||
    (typeof notification.status === 'string' &&
      notification.status.toLowerCase().includes('read'));

  const type =
    normalizeString(notification.type) ??
    normalizeString((notification as Record<string, unknown>).category) ??
    'system';

  return {
    id,
    title,
    message,
    createdAt,
    read,
    priority: extractPriorityFromDto(notification),
    type,
    targetRoles: extractTargetRolesFromDto(notification),
    source: 'remote',
    raw: notification,
  };
};

const sortNotifications = (notifications: DashboardNotification[]) =>
  [...notifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
      ROLE_PRIORITY.indexOf(a.priority) - ROLE_PRIORITY.indexOf(b.priority),
  );

const normalizeRoleKey = (
  role?: string | null,
  roleLevel?: string | null,
): NotificationTargetRole => {
  const normalizeValue = (value?: string | null) =>
    value ? value.trim().toLowerCase() : '';

  const roleValue = normalizeValue(role);
  if (roleValue && NORMALIZED_ROLE_MAP[roleValue]) {
    return NORMALIZED_ROLE_MAP[roleValue];
  }

  const levelValue = normalizeValue(roleLevel);
  if (levelValue && NORMALIZED_ROLE_MAP[levelValue]) {
    return NORMALIZED_ROLE_MAP[levelValue];
  }

  return 'All';
};

const shouldDisplayNotification = (
  notification: DashboardNotification,
  currentRole: NotificationTargetRole,
): boolean => {
  const targets = notification.targetRoles.length > 0 ? notification.targetRoles : ['All'];
  if (targets.includes('All')) {
    return true;
  }
  return targets.includes(currentRole);
};

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({
  children,
  currentUser,
  authToken,
}) => {
  const [remoteNotifications, setRemoteNotifications] = useState<DashboardNotification[]>([]);
  const [localNotifications, setLocalNotifications] = useState<DashboardNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRole = useMemo(
    () => normalizeRoleKey(currentUser?.role, currentUser?.roleLevel),
    [currentUser?.role, currentUser?.roleLevel],
  );

  const refresh = useCallback(
    async (showError = false) => {
      if (!authToken) {
        setRemoteNotifications([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getNotifications(authToken, { includeRead: true, take: 100 });
        const mapped = data.map((notification, index) =>
          mapNotificationDtoToDashboard(notification, index),
        );
        setRemoteNotifications(sortNotifications(mapped));
        setError(null);
      } catch (err) {
        console.error('Error loading notifications', err);
        const message =
          err instanceof ApiError && err.message
            ? err.message
            : err instanceof Error && err.message
              ? err.message
              : 'No se pudieron cargar las notificaciones.';
        if (showError) {
          setError(message);
        } else {
          setError(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [authToken],
  );

  const pushNotification = useCallback(
    (input: NotificationInput): DashboardNotification => {
      const notification: DashboardNotification = {
        id: input.id ?? generateNotificationId(),
        title: input.title,
        message: input.message,
        createdAt: input.createdAt ?? new Date().toISOString(),
        read: false,
        priority: input.priority ?? 'medium',
        type: input.type ?? 'system',
        targetRoles: input.targetRoles && input.targetRoles.length > 0 ? input.targetRoles : ['All'],
        source: 'local',
      };

      setLocalNotifications((prev) =>
        sortNotifications([notification, ...prev.filter((item) => item.id !== notification.id)]),
      );

      return notification;
    },
    [],
  );

  const markAsRead = useCallback(
    async (id: string) => {
      setRemoteNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      );
      setLocalNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      );

      if (!authToken) {
        return;
      }

      try {
        await markNotificationRead(authToken, id);
      } catch (err) {
        console.warn(`No se pudo marcar la notificación ${id} como leída en el servidor.`, err);
      }
    },
    [authToken],
  );

  const markAllAsRead = useCallback(async () => {
    const remoteIds = remoteNotifications.filter((notification) => !notification.read).map((n) => n.id);

    setRemoteNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    setLocalNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));

    if (!authToken || remoteIds.length === 0) {
      return;
    }

    await Promise.all(
      remoteIds.map((id) =>
        markNotificationRead(authToken, id).catch((err) =>
          console.warn(`No se pudo marcar la notificación ${id} como leída.`, err),
        ),
      ),
    );
  }, [authToken, remoteNotifications]);

  useEffect(() => {
    if (!authToken) {
      setRemoteNotifications([]);
      return;
    }
    void refresh();
  }, [authToken, refresh]);

  const combinedNotifications = useMemo(() => {
    const map = new Map<string, DashboardNotification>();
    for (const notification of remoteNotifications) {
      map.set(notification.id, notification);
    }
    for (const notification of localNotifications) {
      map.set(notification.id, notification);
    }
    return sortNotifications(Array.from(map.values()));
  }, [remoteNotifications, localNotifications]);

  const visibleNotifications = useMemo(
    () =>
      combinedNotifications.filter((notification) =>
        shouldDisplayNotification(notification, currentRole),
      ),
    [combinedNotifications, currentRole],
  );

  const unreadCount = useMemo(
    () => visibleNotifications.filter((notification) => !notification.read).length,
    [visibleNotifications],
  );

  const contextValue: NotificationsContextValue = useMemo(
    () => ({
      notifications: visibleNotifications,
      unreadCount,
      isLoading,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
      pushNotification,
    }),
    [
      visibleNotifications,
      unreadCount,
      isLoading,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
      pushNotification,
    ],
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const context = useContext(NotificationsContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      refresh: async () => {},
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      pushNotification: (input: NotificationInput) => ({
        id: input.id ?? generateNotificationId(),
        title: input.title,
        message: input.message,
        createdAt: input.createdAt ?? new Date().toISOString(),
        read: false,
        priority: input.priority ?? 'medium',
        type: input.type ?? 'system',
        targetRoles: input.targetRoles && input.targetRoles.length > 0 ? input.targetRoles : ['All'],
        source: 'local',
      }),
    };
  }
  return context;
};
