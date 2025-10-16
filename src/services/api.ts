const DEFAULT_BASE_URL = 'https://siuben-backoffice-api.azurewebsites.net';

/**
 * Central configuration for the Siuben Backoffice API.
 * Use VITE_API_BASE_URL to override the default host when needed.
 */
export const API_BASE_URL = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL)
    : DEFAULT_BASE_URL
).replace(/\/+$/, '');

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type PrimitiveBody = BodyInit | null | undefined;

interface ApiFetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
  token?: string;
  /**
   * When an object is provided it is JSON.stringified automatically.
   */
  body?: PrimitiveBody | Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Low-level fetch wrapper that injects the base URL, handles JSON serialization,
 * and normalises API errors.
 */
export async function apiFetch<TResponse = unknown>(
  path: string,
  { token, body, headers = {}, ...init }: ApiFetchOptions = {},
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const requestHeaders = new Headers(headers);

  const isJsonBody =
    body &&
    !(body instanceof FormData) &&
    typeof body === 'object' &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer);

  if (token) {
    requestHeaders.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
  }

  if (isJsonBody) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const requestInit: RequestInit = {
    ...init,
    headers: requestHeaders,
  };

  if (!requestInit.credentials) {
    requestInit.credentials = 'omit';
  }

  if (body !== undefined) {
    requestInit.body =
      isJsonBody && body
        ? JSON.stringify(body)
        : (body as PrimitiveBody);
  }

  const response = await fetch(url, requestInit);

  if (!response.ok) {
    let details: unknown;
    try {
      const contentType = response.headers.get('Content-Type') ?? '';
      if (contentType.includes('application/json')) {
        details = await response.json();
      } else {
        details = await response.text();
      }
    } catch {
      details = undefined;
    }

    const message =
      (typeof details === 'object' && details && 'message' in details && typeof (details as any).message === 'string'
        ? (details as any).message
        : `Solicitud fallida (${response.status})`);

    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const responseContentType = response.headers.get('Content-Type') ?? '';
  if (!responseContentType.includes('application/json')) {
    // Return text or blob depending on caller expectations; default to text.
    return (await response.text()) as unknown as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export interface LoginResult {
  token: string;
  refreshToken?: string;
  raw: Record<string, unknown>;
}

const TOKEN_CANDIDATES = [
  'token',
  'jwt',
  'jwtToken',
  'accessToken',
  'access_token',
  'bearerToken',
];

const REFRESH_TOKEN_CANDIDATES = [
  'refreshToken',
  'refresh_token',
  'refreshJwt',
];

/**
 * Performs login against /auth/login and extracts a bearer token even if the backend
 * changes the exact property name.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const raw = await apiFetch<Record<string, unknown>>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  const token = TOKEN_CANDIDATES
    .map((key) => raw[key] ?? (typeof raw.data === 'object' && raw.data ? (raw.data as Record<string, unknown>)[key] : undefined))
    .find((value): value is string => typeof value === 'string' && value.length > 0);

  if (!token) {
    throw new ApiError('La respuesta de autenticación no incluye un token válido.');
  }

  const refreshToken = REFRESH_TOKEN_CANDIDATES
    .map((key) => raw[key] ?? (typeof raw.data === 'object' && raw.data ? (raw.data as Record<string, unknown>)[key] : undefined))
    .find((value): value is string => typeof value === 'string' && value.length > 0);

  return {
    token,
    refreshToken,
    raw,
  };
}

/**
 * Normalises array-like responses (plain array, { items: [] }, { data: [] }).
 */
function normalizeCollection<T = Record<string, unknown>>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const container = payload as Record<string, unknown>;
    if (Array.isArray(container.items)) {
      return container.items as T[];
    }
    if (Array.isArray(container.data)) {
      return container.data as T[];
    }
    if (Array.isArray(container.results)) {
      return container.results as T[];
    }
  }

  return [];
}

export interface AdminUserDto extends Record<string, unknown> {
  id?: string;
  email?: string;
  userName?: string;
  fullName?: string;
  name?: string;
  jobTitle?: string;
  role?: string;
  status?: number | string;
  departmentId?: string | null;
  departmentName?: string | null;
  provinceId?: string | null;
  provinceName?: string | null;
  createdAt?: string;
  createdDate?: string;
  lastLoginAt?: string;
  lastLogin?: string;
}

export interface ReferenceItem extends Record<string, unknown> {
  id?: string;
  code?: string;
  key?: string;
  name?: string;
  description?: string;
}

export async function getAdminUsers(token: string): Promise<AdminUserDto[]> {
  const response = await apiFetch<unknown>('/admin/users/admins', { token });
  return normalizeCollection<AdminUserDto>(response);
}

export async function getNonAdminUsers(token: string): Promise<AdminUserDto[]> {
  const response = await apiFetch<unknown>('/admin/users/non-admins', { token });
  return normalizeCollection<AdminUserDto>(response);
}

export async function getRoles(token: string): Promise<ReferenceItem[]> {
  const response = await apiFetch<unknown>('/admin/roles', { token });
  return normalizeCollection<ReferenceItem>(response);
}

export async function getDepartments(token: string): Promise<ReferenceItem[]> {
  const response = await apiFetch<unknown>('/admin/departments', { token });
  return normalizeCollection<ReferenceItem>(response);
}

export async function getProvinces(token: string): Promise<ReferenceItem[]> {
  const response = await apiFetch<unknown>('/admin/provinces', { token });
  return normalizeCollection<ReferenceItem>(response);
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  jobTitle?: string | null;
  role: string;
  departmentId?: string | null;
  provinceId?: string | null;
  status: number;
  tempPassword: string;
}

export async function createUser(token: string, payload: CreateUserPayload): Promise<void> {
  await apiFetch('/admin/users', {
    method: 'POST',
    token,
    body: payload,
  });
}

export interface AuthProfile extends Record<string, unknown> {
  id?: string;
  email?: string;
  displayName?: string;
  jobTitle?: string | null;
  status?: number;
  departmentId?: string | null;
  departmentName?: string | null;
  provinceId?: string | null;
  provinceName?: string | null;
  role?: string;
}

export async function getCurrentUser(token: string): Promise<AuthProfile> {
  return apiFetch<AuthProfile>('/auth/me', { token });
}

export interface NotificationDto extends Record<string, unknown> {
  id?: string;
  title?: string;
  message?: string;
  content?: string;
  body?: string;
  createdAt?: string;
  timestamp?: string;
  isRead?: boolean;
  read?: boolean;
  status?: string;
  priority?: string;
  type?: string;
}

export interface ListNotificationsOptions {
  includeRead?: boolean;
  take?: number;
  skip?: number;
}

export async function getNotifications(
  token: string,
  options: ListNotificationsOptions = {},
): Promise<NotificationDto[]> {
  const query = new URLSearchParams();
  if (options.includeRead !== undefined) {
    query.set('includeRead', String(options.includeRead));
  }
  if (options.take !== undefined) {
    query.set('take', String(options.take));
  }
  if (options.skip !== undefined) {
    query.set('skip', String(options.skip));
  }

  const path = query.toString() ? `/notifications?${query}` : '/notifications';
  const response = await apiFetch<unknown>(path, { token });
  return normalizeCollection<NotificationDto>(response);
}

export async function markNotificationRead(token: string, notificationId: string): Promise<void> {
  await apiFetch(`/notifications/${notificationId}/read`, {
    method: 'POST',
    token,
  });
}
