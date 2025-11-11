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

const buildAuthorizationHeader = (token: string): string =>
  token.startsWith('Bearer ') ? token : `Bearer ${token}`;

const normalisePath = (path: string): string => (path.startsWith('/') ? path : `/${path}`);

const extractErrorDetails = async (response: Response): Promise<{ message: string; details?: unknown }> => {
  let details: unknown;
  try {
    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      details = await response.json();
    } else {
      const text = await response.text();
      details = text || undefined;
    }
  } catch {
    details = undefined;
  }

  const message =
    (typeof details === 'object' &&
      details &&
      'message' in details &&
      typeof (details as Record<string, unknown>).message === 'string' &&
      (details as Record<string, unknown>).message)
      ? ((details as Record<string, unknown>).message as string)
      : `Solicitud fallida (${response.status})`;

  return { message, details };
};

async function fetchReportBlob(
  path: string,
  token: string,
  accept: string = 'application/octet-stream',
): Promise<Blob> {
  const url = `${API_BASE_URL}${normalisePath(path)}`;
  const headers = new Headers({
    Authorization: buildAuthorizationHeader(token),
    Accept: accept,
  });

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const { message, details } = await extractErrorDetails(response);
    throw new ApiError(message, response.status, details);
  }

  return response.blob();
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

const COLLECTION_KEY_CANDIDATES = [
  'items',
  'data',
  'results',
  'value',
  'values',
  'records',
  'rows',
  'entries',
  'notifications',
  'list',
  'collection',
  'payload',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const extractArrayFromPayload = (
  payload: unknown,
  visited: WeakSet<object> = new WeakSet(),
): unknown[] | null => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload) || visited.has(payload)) {
    return null;
  }

  visited.add(payload);

  for (const key of COLLECTION_KEY_CANDIDATES) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const key of COLLECTION_KEY_CANDIDATES) {
    const value = payload[key];
    if (isRecord(value)) {
      const nested = extractArrayFromPayload(value, visited);
      if (nested) {
        return nested;
      }
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const value of Object.values(payload)) {
    if (isRecord(value)) {
      const nested = extractArrayFromPayload(value, visited);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

/**
 * Normalises array-like responses (plain array, { items: [] }, { data: [] })
 * and nested variants frequently seen in backends ({ data: { items: [] } }, etc.).
 */
function normalizeCollection<T = Record<string, unknown>>(payload: unknown): T[] {
  const collection = extractArrayFromPayload(payload);
  return Array.isArray(collection) ? (collection as T[]) : [];
}

export interface AdminUserDto extends Record<string, unknown> {
  id?: string;
  userId?: string;
  email?: string;
  userName?: string;
  fullName?: string;
  name?: string;
  jobTitle?: string;
  role?: string;
  roleId?: string;
  supervisorId?: string | null;
  supervisorName?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  status?: number | string;
  departmentId?: string | null;
  departmentName?: string | null;
  provinceId?: string | null;
  provinceName?: string | null;
  createdAt?: string;
  createdDate?: string;
  lastAccessAt?: string;
  LastAccessAt?: string;
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

export async function getUserById(token: string, userId: string): Promise<AdminUserDto> {
  return apiFetch<AdminUserDto>(`/admin/users/${encodeURIComponent(userId)}`, { token });
}

export interface CreateUserPayload extends Record<string, unknown> {
  email: string;
  fullName: string;
  jobTitle?: string | null;
  role: string;
  departmentId?: string | null;
  provinceId?: string | null;
  status: number;
  tempPassword: string;
  supervisorId?: string | null;
}

export async function createUser(token: string, payload: CreateUserPayload): Promise<void> {
  await apiFetch('/admin/users', {
    method: 'POST',
    token,
    body: payload,
  });
}

export interface UpdateUserPayload extends Record<string, unknown> {
  fullName?: string;
  email?: string;
  jobTitle?: string | null;
  department?: string | null;
  departmentId?: string | null;
  province?: string | null;
  provinceId?: string | null;
}

export async function updateUser(
  token: string,
  userId: string,
  payload: UpdateUserPayload,
): Promise<void> {
  await apiFetch(`/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export interface UpdateUserRolePayload extends Record<string, unknown> {
  roleId: string;
}

export async function updateUserRole(
  token: string,
  userId: string,
  payload: UpdateUserRolePayload,
): Promise<void> {
  await apiFetch(`/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function resetUserPassword(
  token: string,
  userId: string,
  newPassword: string,
): Promise<void> {
  await apiFetch(`/admin/users/${encodeURIComponent(userId)}/password`, {
    method: 'POST',
    token,
    body: { newPassword },
  });
}

export async function enableUser(token: string, userId: string): Promise<void> {
  await apiFetch(`/admin/users/${encodeURIComponent(userId)}/enable`, {
    method: 'POST',
    token,
  });
}

export async function disableUser(token: string, userId: string): Promise<void> {
  await apiFetch(`/admin/users/${encodeURIComponent(userId)}/disable`, {
    method: 'POST',
    token,
  });
}

export interface UpdateOwnPasswordPayload extends Record<string, unknown> {
  currentPassword: string;
  newPassword: string;
}

export async function updateOwnPassword(
  token: string,
  payload: UpdateOwnPasswordPayload,
): Promise<void> {
  await apiFetch('/auth/me/password', {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export interface AuditEventDto extends Record<string, unknown> {
  id?: string;
  occurredAt?: string;
  userId?: string | null;
  userName?: string | null;
  action?: string;
  resource?: string;
  status?: number | string;
  category?: number | string;
  detail?: string | null;
  metadataJson?: string | null;
  correlationId?: string | null;
}

export interface AuditSummaryDto extends Record<string, unknown> {
  totalEvents?: number;
  successfulLast24Hours?: number;
  successRateLast24Hours?: number;
  failedLast24Hours?: number;
  securityEventsLast24Hours?: number;
  criticalEventsLast24Hours?: number;
}

export interface ListAuditEventsOptions {
  take?: number;
  skip?: number;
}

export async function getAuditEvents(
  token: string,
  options: ListAuditEventsOptions = {},
): Promise<AuditEventDto[]> {
  const params = new URLSearchParams();
  if (typeof options.take === 'number') {
    params.set('take', String(options.take));
  }
  if (typeof options.skip === 'number') {
    params.set('skip', String(options.skip));
  }

  const path = params.toString() ? `/audit?${params.toString()}` : '/audit';
  const response = await apiFetch<unknown>(path, { token });
  return normalizeCollection<AuditEventDto>(response);
}

export async function getAuditSummary(token: string, hours = 24): Promise<AuditSummaryDto> {
  const clampedHours = Math.min(Math.max(Math.trunc(hours), 1), 168);
  const params = new URLSearchParams({ hours: String(clampedHours) });
  return apiFetch<AuditSummaryDto>(`/audit/summary?${params.toString()}`, { token });
}

export interface PadronRecordDto {
  nationalId?: string;
  householdId?: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  povertyLevel?: string;
  municipality?: string;
  province?: string;
  section?: string;
  neighborhood?: string;
  address?: string;
  educationLevel?: string;
  literacyStatus?: string;
  relationship?: string;
  isHeadOfHousehold?: boolean;
  interviewDate?: string;
  rawRecord?: string;
}

export interface PadronDataDto {
  found?: boolean;
  records?: PadronRecordDto[];
  headOfHousehold?: PadronRecordDto;
  rawPayload?: string;
}

export interface BeneficiaryDto extends Record<string, unknown> {
  id?: string;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  email?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  assignedTo?: string | null;
  assignedToId?: string | null;
  assignedToEmail?: string | null;
  assignedAnalystId?: string | null;
  assignedAnalystName?: string | null;
  assignedAnalystEmail?: string | null;
  assignedAnalyst?: Record<string, unknown> | null;
  assignedSupervisorId?: string | null;
  assignedSupervisorName?: string | null;
  assignedSupervisor?: Record<string, unknown> | null;
  assignmentDate?: string | null;
  assignmentNotes?: string | null;
  padronData?: PadronDataDto | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

const normalizePagedResult = <T>(payload: unknown): PagedResult<T> => {
  const fallback: PagedResult<T> = {
    items: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: 0,
  };

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const items =
    Array.isArray(record.items) && record.items.length >= 0
      ? (record.items as T[])
      : Array.isArray(record.data) && record.data.length >= 0
        ? (record.data as T[])
        : Array.isArray(record.results) && record.results.length >= 0
          ? (record.results as T[])
          : [];

  const totalCount =
    typeof record.totalCount === 'number'
      ? record.totalCount
      : typeof record.count === 'number'
        ? record.count
        : items.length;

  const pageNumber =
    typeof record.pageNumber === 'number'
      ? record.pageNumber
      : typeof record.page === 'number'
        ? record.page
        : 1;

  const pageSize =
    typeof record.pageSize === 'number'
      ? record.pageSize
      : typeof record.limit === 'number'
        ? record.limit
        : items.length;

  const totalPages =
    typeof record.totalPages === 'number'
      ? record.totalPages
      : pageSize > 0
        ? Math.max(1, Math.ceil(totalCount / pageSize))
        : undefined;

  const hasPreviousPage =
    typeof record.hasPreviousPage === 'boolean'
      ? record.hasPreviousPage
      : pageNumber > 1;

  const hasNextPage =
    typeof record.hasNextPage === 'boolean'
      ? record.hasNextPage
      : typeof totalPages === 'number'
        ? pageNumber < totalPages
        : false;

  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPreviousPage,
    hasNextPage,
  };
};

export interface SearchBeneficiariesOptions {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  assignedTo?: string;
  onlyAssigned?: boolean;
  supervisorId?: string;
  includeAssignments?: boolean;
}

export async function searchBeneficiaries(
  token: string,
  {
    search,
    pageNumber = 1,
    pageSize = 25,
    assignedTo,
    onlyAssigned,
    supervisorId,
    includeAssignments,
  }: SearchBeneficiariesOptions = {},
): Promise<PagedResult<BeneficiaryDto>> {
  const params = new URLSearchParams();
  if (search && search.trim().length > 0) {
    params.set('search', search.trim());
  }
  params.set('pageNumber', String(Math.max(1, pageNumber)));
  params.set('pageSize', String(Math.min(Math.max(1, pageSize), 200)));
  if (assignedTo && assignedTo.trim().length > 0) {
    params.set('assignedTo', assignedTo.trim());
  }
  if (typeof onlyAssigned === 'boolean') {
    params.set('onlyAssigned', String(onlyAssigned));
  }
  if (supervisorId && supervisorId.trim().length > 0) {
    params.set('supervisorId', supervisorId.trim());
  }
  if (typeof includeAssignments === 'boolean') {
    params.set('includeAssignments', String(includeAssignments));
  }

  const response = await apiFetch<unknown>(`/admin/beneficiaries?${params.toString()}`, {
    token,
  });

  return normalizePagedResult<BeneficiaryDto>(response);
}

export async function getAssignedBeneficiaries(
  token: string,
  {
    search,
    pageNumber = 1,
    pageSize = 25,
    includeAssignments,
  }: Omit<SearchBeneficiariesOptions, 'assignedTo' | 'onlyAssigned' | 'supervisorId'> = {},
): Promise<PagedResult<BeneficiaryDto>> {
  const params = new URLSearchParams();
  if (search && search.trim().length > 0) {
    params.set('search', search.trim());
  }
  params.set('pageNumber', String(Math.max(1, pageNumber)));
  params.set('pageSize', String(Math.min(Math.max(1, pageSize), 200)));
  if (typeof includeAssignments === 'boolean') {
    params.set('includeAssignments', String(includeAssignments));
  }

  const response = await apiFetch<unknown>(`/admin/beneficiaries/assigned?${params.toString()}`, {
    token,
  });

  return normalizePagedResult<BeneficiaryDto>(response);
}

export interface AssignBeneficiaryPayload extends Record<string, unknown> {
  analystId: string;
  notes?: string;
}

export async function assignBeneficiaryToAnalyst(
  token: string,
  beneficiaryId: string,
  payload: AssignBeneficiaryPayload,
): Promise<void> {
  await apiFetch(`/admin/beneficiaries/${encodeURIComponent(beneficiaryId)}/assign`, {
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
  mustChangePassword?: boolean;
  requirePasswordChange?: boolean;
  passwordChangeRequired?: boolean;
  needsPasswordChange?: boolean;
  isFirstLogin?: boolean;
  temporaryPassword?: boolean;
}

export async function getCurrentUser(token: string): Promise<AuthProfile> {
  return apiFetch<AuthProfile>('/auth/me', { token });
}

export interface NotificationDto extends Record<string, unknown> {
  id?: string;
  title?: string;
  message?: string;
  metadataJson?: string | null;
  relatedRequestId?: string | null;
  content?: string;
  body?: string;
  createdAt?: string;
  timestamp?: string;
  readAt?: string | null;
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

export interface UnreadNotificationsCountResponse {
  count?: number;
}

export async function getNotifications(
  token: string,
  options: ListNotificationsOptions = {},
): Promise<NotificationDto[]> {
  const { includeRead = false, take = 50, skip } = options;
  const query = new URLSearchParams();
  if (includeRead !== undefined) {
    query.set('includeRead', String(includeRead));
  }
  if (take !== undefined) {
    query.set('take', String(take));
  }
  if (skip !== undefined) {
    query.set('skip', String(skip));
  }

  const path = query.toString() ? `/notifications?${query}` : '/notifications';
  const response = await apiFetch<unknown>(path, { token });
  return normalizeCollection<NotificationDto>(response);
}

export async function getUnreadNotificationsCount(token: string): Promise<number> {
  const response = await apiFetch<number | UnreadNotificationsCountResponse>(
    '/notifications/unread-count',
    { token },
  );

  if (typeof response === 'number') {
    return Number.isFinite(response) ? response : 0;
  }

  if (response && typeof response.count === 'number') {
    return Number.isFinite(response.count) ? response.count : 0;
  }

  return 0;
}

export async function markNotificationRead(token: string, notificationId: string): Promise<void> {
  await apiFetch(`/notifications/${notificationId}/read`, {
    method: 'POST',
    token,
  });
}

export interface RequestDto extends Record<string, unknown> {
  id?: string;
  beneficiaryId?: string | null;
  requestTypeId?: string | null;
  requestTypeCode?: string | null;
  requestTypeName?: string | null;
  requestTypeNameSpanish?: string | null;
  nameSpanish?: string | null;
  status?: string;
  statusName?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  externalReference?: string | null;
  assignedAnalystId?: string | null;
  assignedAnalystName?: string | null;
  assignedByUserId?: string | null;
  assignedByName?: string | null;
  assignedAt?: string | null;
  assignmentNotes?: string | null;
  beneficiary?: BeneficiaryDto | null;
  documents?: Array<{
    fileName?: string;
    contentType?: string;
    storageUri?: string;
    fileSizeBytes?: number;
  }> | string[] | null;
  // Campos legacy para compatibilidad
  applicant?: string;
  cedula?: string;
  date?: string;
  province?: string;
  type?: string;
  address?: string;
  phone?: string;
  email?: string;
  householdSize?: number;
  monthlyIncome?: string;
  reason?: string;
  description?: string;
  assignedTo?: string | null;
  reviewedBy?: string | null;
  reviewDate?: string | null;
  priority?: string;
  assignmentDate?: string | null;
  auditLogs?: RequestAuditLogDto[] | null;
  auditTrail?: RequestAuditLogDto[] | null;
  actionHistory?: RequestAuditLogDto[] | null;
  documentAccessLogs?: DocumentAccessLogDto[] | null;
  documentLogs?: DocumentAccessLogDto[] | null;
}

export interface ListRequestsOptions {
  status?: string;
  priority?: string;
  search?: string;
  take?: number;
  skip?: number;
}

export async function getRequests(
  token: string,
  options: ListRequestsOptions = {},
): Promise<RequestDto[]> {
  const params = new URLSearchParams();
  if (options.status) {
    params.set('status', options.status);
  }
  if (options.priority) {
    params.set('priority', options.priority);
  }
  if (options.search) {
    params.set('search', options.search);
  }
  if (typeof options.take === 'number') {
    params.set('take', String(options.take));
  }
  if (typeof options.skip === 'number') {
    params.set('skip', String(options.skip));
  }

  const path = params.toString() ? `/requests?${params.toString()}` : '/requests';
  const response = await apiFetch<unknown>(path, { token });
  return normalizeCollection<RequestDto>(response);
}

export async function getAssignedRequests(
  token: string,
  options: ListRequestsOptions = {},
): Promise<RequestDto[]> {
  const params = new URLSearchParams();
  if (options.status) {
    params.set('status', options.status);
  }
  if (options.priority) {
    params.set('priority', options.priority);
  }
  if (options.search) {
    params.set('search', options.search);
  }
  if (typeof options.take === 'number') {
    params.set('take', String(options.take));
  }
  if (typeof options.skip === 'number') {
    params.set('skip', String(options.skip));
  }

  const path = params.toString() ? `/requests/assigned?${params.toString()}` : '/requests/assigned';
  const response = await apiFetch<unknown>(path, { token });
  return normalizeCollection<RequestDto>(response);
}

export async function getRequestById(token: string, requestId: string): Promise<RequestDto> {
  return apiFetch<RequestDto>(`/requests/${encodeURIComponent(requestId)}`, {
    method: 'GET',
    token,
  });
}

export interface AssignRequestPayload extends Record<string, unknown> {
  analystId: string;
  notes?: string;
}

export async function assignRequest(
  token: string,
  requestId: string,
  payload: AssignRequestPayload,
): Promise<RequestDto | null> {
  return apiFetch<RequestDto | null>(`/requests/${encodeURIComponent(requestId)}/assign`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export interface AssignableUserDto extends Record<string, unknown> {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  roleCode?: string;
  departmentId?: string;
  departmentName?: string;
  isSameDepartment?: boolean;
}

export interface RequestAuditLogDto extends Record<string, unknown> {
  id?: string | number | null;
  action?: string | null;
  description?: string | null;
  detail?: string | null;
  notes?: string | null;
  userId?: string | number | null;
  userName?: string | null;
  userEmail?: string | null;
  performedBy?: string | null;
  ipAddress?: string | null;
  clientIp?: string | null;
  createdAt?: string | null;
  occurredAt?: string | null;
  timestamp?: string | null;
  eventDate?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface DocumentAccessLogDto extends Record<string, unknown> {
  id?: string | number | null;
  action?: string | null;
  documentName?: string | null;
  fileName?: string | null;
  resource?: string | null;
  outcome?: string | null;
  description?: string | null;
  detail?: string | null;
  userId?: string | number | null;
  userName?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  clientIp?: string | null;
  createdAt?: string | null;
  occurredAt?: string | null;
  timestamp?: string | null;
  eventDate?: string | null;
}

export interface GetAssignableUsersOptions {
  role?: string;
  includeRelatedRoles?: boolean;
  departmentId?: string;
  prioritizeDepartmentId?: string;
}

export async function getAssignableUsers(
  token: string,
  options: GetAssignableUsersOptions = {}
): Promise<AssignableUserDto[]> {
  const params = new URLSearchParams();
  if (options.role) {
    params.set('role', options.role);
  }
  if (typeof options.includeRelatedRoles === 'boolean') {
    params.set('includeRelatedRoles', String(options.includeRelatedRoles));
  }
  if (options.departmentId) {
    params.set('departmentId', options.departmentId);
  }
  if (options.prioritizeDepartmentId) {
    params.set('prioritizeDepartmentId', options.prioritizeDepartmentId);
  }

  const path = params.toString() ? `/requests/assignable-users?${params}` : '/requests/assignable-users';
  const response = await apiFetch<unknown>(path, { token });
  return normalizeCollection<AssignableUserDto>(response);
}

export interface UnassignRequestPayload extends Record<string, unknown> {
  notes?: string;
}

export async function unassignRequest(
  token: string,
  requestId: string,
  payload: UnassignRequestPayload = {}
): Promise<RequestDto | null> {
  return apiFetch<RequestDto | null>(`/requests/${encodeURIComponent(requestId)}/unassign`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export interface UpdateRequestStatusPayload extends Record<string, unknown> {
  status: number;
  notes?: string;
}

export async function updateRequestStatus(
  token: string,
  requestId: string,
  payload: UpdateRequestStatusPayload
): Promise<RequestDto | null> {
  return apiFetch<RequestDto | null>(`/requests/${encodeURIComponent(requestId)}/status`, {
    method: 'POST',
    token,
    body: payload,
  });
}

// Generic endpoint to change status using any valid status string
export interface ChangeRequestStatusPayload extends Record<string, unknown> {
  status: string;
  notes?: string;
}

export async function changeRequestStatus(
  token: string,
  requestId: string,
  payload: ChangeRequestStatusPayload
): Promise<RequestDto | null> {
  return apiFetch<RequestDto | null>(`/requests/${encodeURIComponent(requestId)}/status`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

// Specific action endpoints
export interface RequestActionPayload extends Record<string, unknown> {
  notes?: string;
}

export async function approveRequest(
  token: string,
  requestId: string,
  payload: RequestActionPayload = {}
): Promise<RequestDto | null> {
  return apiFetch<RequestDto | null>(`/requests/${encodeURIComponent(requestId)}/approve`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function rejectRequest(
  token: string,
  requestId: string,
  payload: RequestActionPayload = {}
): Promise<RequestDto | null> {
  return apiFetch<RequestDto | null>(`/requests/${encodeURIComponent(requestId)}/reject`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function completeRequest(
  token: string,
  requestId: string,
  payload: RequestActionPayload = {}
): Promise<RequestDto | null> {
  return apiFetch<RequestDto | null>(`/requests/${encodeURIComponent(requestId)}/complete`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function cancelRequest(
  token: string,
  requestId: string,
  payload: RequestActionPayload = {}
): Promise<RequestDto | null> {
  return apiFetch<RequestDto | null>(`/requests/${encodeURIComponent(requestId)}/cancel`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function reviewRequest(
  token: string,
  requestId: string,
  payload: RequestActionPayload = {}
): Promise<RequestDto | null> {
  return apiFetch<RequestDto | null>(`/requests/${encodeURIComponent(requestId)}/review`, {
    method: 'POST',
    token,
    body: payload,
  });
}

// Report DTOs matching backend
export interface RequestCountReportDto extends Record<string, unknown> {
  totalRequests?: number;
  pendingRequests?: number;
  assignedRequests?: number;
  inReviewRequests?: number;
  approvedRequests?: number;
  rejectedRequests?: number;
}

export interface MonthlyRequestReportDto extends Record<string, unknown> {
  year?: number;
  month?: number;
  totalRequests?: number;
  requestsByStatus?: Record<string, number>;
  requestsByType?: Record<string, number>;
}

export interface MonthlyData extends Record<string, unknown> {
  month?: number;
  monthName?: string;
  totalRequests?: number;
  pendingRequests?: number;
  approvedRequests?: number;
  rejectedRequests?: number;
}

export interface AnnualRequestReportDto extends Record<string, unknown> {
  year?: number;
  totalRequests?: number;
  monthlyData?: MonthlyData[];
}

export interface ActiveUsersReportDto extends Record<string, unknown> {
  totalActiveUsers?: number;
  usersByDepartment?: Record<string, number>;
  usersByProvince?: Record<string, number>;
  recentLogins?: number;
}

export interface UsersByRoleItem extends Record<string, unknown> {
  roleName?: string;
  userCount?: number;
  users?: Array<{
    userId?: string;
    userName?: string;
    email?: string;
  }>;
}

export interface UsersByRoleReportResponse extends Record<string, unknown> {
  totalUsers?: number;
  roleGroups?: UsersByRoleItem[];
}

// Report API functions
export async function getRequestCountReport(token: string): Promise<RequestCountReportDto> {
  return apiFetch<RequestCountReportDto>('/reports/requests/count', { token });
}

export async function getMonthlyRequestReport(
  token: string,
  year: number,
  month: number,
): Promise<MonthlyRequestReportDto> {
  return apiFetch<MonthlyRequestReportDto>(`/reports/requests/monthly/${year}/${month}`, { token });
}

export async function getAnnualRequestReport(
  token: string,
  year: number,
): Promise<AnnualRequestReportDto> {
  return apiFetch<AnnualRequestReportDto>(`/reports/requests/annual/${year}`, { token });
}

export async function getActiveUsersReport(token: string): Promise<ActiveUsersReportDto> {
  return apiFetch<ActiveUsersReportDto>('/reports/users/active', { token });
}

export async function getUsersByRoleReport(token: string): Promise<UsersByRoleReportResponse> {
  return apiFetch<UsersByRoleReportResponse>('/reports/users/by-role', { token });
}

// Report download functions
export async function downloadRequestCountReportPDF(token: string): Promise<Blob> {
  return fetchReportBlob('/reports/requests/count/pdf', token, 'application/pdf');
}

export async function downloadRequestCountReportExcel(token: string): Promise<Blob> {
  return fetchReportBlob(
    '/reports/requests/count/excel',
    token,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
  );
}

export async function downloadMonthlyRequestReportPDF(
  token: string,
  year: number,
  month: number,
): Promise<Blob> {
  return fetchReportBlob(
    `/reports/requests/monthly/${year}/${month}/pdf`,
    token,
    'application/pdf',
  );
}

export async function downloadMonthlyRequestReportExcel(
  token: string,
  year: number,
  month: number,
): Promise<Blob> {
  return fetchReportBlob(
    `/reports/requests/monthly/${year}/${month}/excel`,
    token,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
  );
}

export async function downloadAnnualRequestReportPDF(
  token: string,
  year: number,
): Promise<Blob> {
  return fetchReportBlob(
    `/reports/requests/annual/${year}/pdf`,
    token,
    'application/pdf',
  );
}

export async function downloadAnnualRequestReportExcel(
  token: string,
  year: number,
): Promise<Blob> {
  return fetchReportBlob(
    `/reports/requests/annual/${year}/excel`,
    token,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
  );
}

export async function downloadActiveUsersReportPDF(token: string): Promise<Blob> {
  return fetchReportBlob('/reports/users/active/pdf', token, 'application/pdf');
}

export async function downloadActiveUsersReportExcel(token: string): Promise<Blob> {
  return fetchReportBlob(
    '/reports/users/active/excel',
    token,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
  );
}

export async function downloadUsersByRoleReportPDF(token: string): Promise<Blob> {
  return fetchReportBlob('/reports/users/by-role/pdf', token, 'application/pdf');
}

export async function downloadUsersByRoleReportExcel(token: string): Promise<Blob> {
  return fetchReportBlob(
    '/reports/users/by-role/excel',
    token,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
  );
}

// Helper function to download blob as file
export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
