import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { ApiError, AuditEventDto, AuditSummaryDto, getAuditEvents, getAuditSummary } from '../services/api';
import {
  Shield,
  Activity,
  Eye,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CurrentUser {
  username: string;
  name: string;
  role: string;
  roleLevel: 'Admin' | 'Supervisor' | 'Analyst';
  permissions: {
    canCreateUsers: boolean;
    canApproveRequests: boolean;
    canReviewRequests: boolean;
    canViewReports: boolean;
    canManageBeneficiaries: boolean;
  };
}

interface PageProps {
  currentUser?: CurrentUser | null;
  authToken?: string | null;
  onNavigate?: (page: string) => void;
}

type AuditStatusKey = 'success' | 'failure' | 'unknown';
type AuditCategoryKey = 'general' | 'security' | 'data' | 'system' | 'other';

const STATUS_LABELS: Record<AuditStatusKey, { label: string; badgeClass: string }> = {
  success: {
    label: 'Exitoso',
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
  },
  failure: {
    label: 'Fallido',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
  },
  unknown: {
    label: 'Desconocido',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

const CATEGORY_LABELS: Record<AuditCategoryKey, string> = {
  general: 'General',
  security: 'Seguridad',
  data: 'Datos',
  system: 'Sistema',
  other: 'Otro',
};

const DATE_KEYS = ['occurredAt', 'occurred_at', 'createdAt', 'created_at', 'timestamp'];
const USER_KEYS = ['userName', 'username', 'user', 'user_name', 'actorName', 'performedBy'];
const USER_ID_KEYS = ['userId', 'usuarioId', 'actorId', 'accountId', 'performedById'];
const USER_EMAIL_KEYS = ['userEmail', 'email', 'usuarioEmail', 'actorEmail', 'accountEmail'];
const ACTION_KEYS = ['action', 'event', 'operation'];
const RESOURCE_KEYS = ['resource', 'target', 'entity'];
const DETAIL_KEYS = ['detail', 'description', 'message', 'metadata'];
const CORRELATION_KEYS = ['correlationId', 'correlation_id', 'traceId', 'trace_id'];
const IP_KEYS = ['ipAddress', 'ip', 'clientIp', 'remoteAddress', 'sourceIp', 'direccionIp'];

const SUCCESS_TOKENS = new Set(['success', 'successful', 'true', 'ok', '0']);
const FAILURE_TOKENS = new Set(['failure', 'failed', 'false', 'error', '1']);

const CATEGORY_TOKENS: Record<string, AuditCategoryKey> = {
  general: 'general',
  0: 'general',
  security: 'security',
  1: 'security',
  data: 'data',
  datos: 'data',
  2: 'data',
  system: 'system',
  sistema: 'system',
  3: 'system',
  other: 'other',
  otro: 'other',
  4: 'other',
};

const HOURS_FILTERS: Record<'24h' | '72h' | '168h', number> = {
  '24h': 24,
  '72h': 72,
  '168h': 168,
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const resolveStringField = (source: AuditEventDto, keys: string[], fallback = ''): string => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
};

const resolveAuditDate = (event: AuditEventDto): Date | null => {
  for (const key of DATE_KEYS) {
    const value = event[key];
    if (typeof value === 'string' && value) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return null;
};

const normalizeAuditStatus = (event: AuditEventDto): AuditStatusKey => {
  const raw = event.status;
  if (typeof raw === 'number') {
    return raw === 0 ? 'success' : raw === 1 ? 'failure' : 'unknown';
  }
  if (typeof raw === 'string' && raw.trim()) {
    const normalized = raw.trim().toLowerCase();
    if (SUCCESS_TOKENS.has(normalized)) {
      return 'success';
    }
    if (FAILURE_TOKENS.has(normalized)) {
      return 'failure';
    }
  }
  return 'unknown';
};

const normalizeAuditCategory = (event: AuditEventDto): AuditCategoryKey => {
  const raw = event.category;
  if (typeof raw === 'number' || typeof raw === 'string') {
    const token = String(raw).trim().toLowerCase();
    if (token in CATEGORY_TOKENS) {
      return CATEGORY_TOKENS[token];
    }
  }
  return 'general';
};

const formatDateTime = (value: Date | null): string => {
  if (!value) {
    return '—';
  }
  return value.toLocaleString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatNumber = (value?: number): string => {
  if (value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return value.toLocaleString('es-DO');
};

const formatPercentage = (value?: number): string => {
  if (value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return `${(value * 100).toFixed(1)}%`;
};

export function SystemConfigPage({ authToken }: PageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AuditStatusKey>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AuditCategoryKey>('all');
  const [dateFilter, setDateFilter] = useState<'24h' | '72h' | '168h'>('24h');
  const [auditEvents, setAuditEvents] = useState<AuditEventDto[]>([]);
  const [summary, setSummary] = useState<AuditSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[1]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadAuditData = useCallback(async () => {
    if (!authToken) {
      setError('Debe iniciar sesión nuevamente para consultar la auditoría.');
      setAuditEvents([]);
      setSummary(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [events, summaryResponse] = await Promise.all([
        getAuditEvents(authToken, { take: 200, skip: 0 }),
        getAuditSummary(authToken, HOURS_FILTERS[dateFilter]),
      ]);

      setAuditEvents(events);
      setSummary(summaryResponse ?? null);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error cargando eventos de auditoría', err);
      let message = 'No se pudo obtener el registro de auditoría.';

      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          message = 'No tiene permisos para consultar los eventos de auditoría.';
        } else if (err.message && err.message.trim().length > 0) {
          message = err.message.trim();
        }
      } else if (err instanceof Error && err.message.trim().length > 0) {
        message = err.message.trim();
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, dateFilter]);

  useEffect(() => {
    void loadAuditData();
  }, [loadAuditData]);

  const hoursRangeMs = HOURS_FILTERS[dateFilter] * 60 * 60 * 1000;
  const now = Date.now();

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const sortedEvents = useMemo(() => {
    const events = [...auditEvents];
    events.sort((a, b) => {
      const dateA = resolveAuditDate(a);
      const dateB = resolveAuditDate(b);
      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }
      if (dateA) return -1;
      if (dateB) return 1;
      return 0;
    });
    return events;
  }, [auditEvents]);

  const filteredLogs = useMemo(() => {
    return sortedEvents.filter((event) => {
      const status = normalizeAuditStatus(event);
      const category = normalizeAuditCategory(event);
      const occurredAt = resolveAuditDate(event);

      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && category !== categoryFilter) {
        return false;
      }

      if (occurredAt && now - occurredAt.getTime() > hoursRangeMs) {
        return false;
      }

      if (normalizedSearch) {
        const haystack = [
          resolveStringField(event, USER_KEYS),
          resolveStringField(event, USER_ID_KEYS),
          resolveStringField(event, USER_EMAIL_KEYS),
          resolveStringField(event, ACTION_KEYS),
          resolveStringField(event, RESOURCE_KEYS),
          resolveStringField(event, DETAIL_KEYS),
          resolveStringField(event, IP_KEYS),
          resolveStringField(event, CORRELATION_KEYS),
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [sortedEvents, statusFilter, categoryFilter, normalizedSearch, hoursRangeMs, now]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, dateFilter, normalizedSearch, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / pageSize));

  useEffect(() => {
    setCurrentPage((previous) => {
      if (previous > pageCount) {
        return pageCount;
      }
      if (previous < 1) {
        return 1;
      }
      return previous;
    });
  }, [pageCount]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const startItem = filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem =
    filteredLogs.length === 0 ? 0 : Math.min(filteredLogs.length, currentPage * pageSize);

  const displayedRangeMessage =
    filteredLogs.length === 0
      ? 'Sin resultados para los filtros seleccionados.'
      : `Mostrando ${startItem}-${endItem} de ${filteredLogs.length} eventos filtrados (total cargados: ${auditEvents.length}).`;

  const latestEventDate = useMemo(() => {
    const date = resolveAuditDate(sortedEvents[0] ?? {});
    return formatDateTime(date);
  }, [sortedEvents]);

  const totalEvents = toNumber(summary?.totalEvents) ?? auditEvents.length;
  const successfulEvents = toNumber(summary?.successfulLast24Hours);
  const failedEvents = toNumber(summary?.failedLast24Hours);
  const securityEvents = toNumber(summary?.securityEventsLast24Hours);
  const successRate = summary?.successRateLast24Hours;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dr-dark-gray">Auditoría del Sistema</h1>
        <p className="text-gray-600 mt-1">
          Monitoree la actividad clave del backoffice SIUBEN, identifique incidentes y audite operaciones críticas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-full">
                <Activity className="h-5 w-5 text-dr-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Eventos registrados</p>
                <p className="text-xl font-bold text-dr-dark-gray">
                  {formatNumber(totalEvents)}
                </p>
                <p className="text-xs text-gray-500">Última actualización: {latestEventDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-full">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Éxitos últimas 24h</p>
                <p className="text-xl font-bold text-dr-dark-gray">
                  {formatNumber(successfulEvents)}
                </p>
                <p className="text-xs text-gray-500">
                  Tasa de éxito: {formatPercentage(successRate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fallos últimas 24h</p>
                <p className="text-xl font-bold text-dr-dark-gray">
                  {formatNumber(failedEvents)}
                </p>
                <p className="text-xs text-gray-500">
                  Eventos críticos: {formatNumber(toNumber(summary?.criticalEventsLast24Hours))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2 rounded-full">
                <Eye className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Eventos de seguridad (24h)</p>
                <p className="text-xl font-bold text-dr-dark-gray">
                  {formatNumber(securityEvents)}
                </p>
                <p className="text-xs text-gray-500">
                  Rango consultado: {HOURS_FILTERS[dateFilter]}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por usuario, acción, recurso o detalle..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="min-w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="success">Exitosos</SelectItem>
                  <SelectItem value="failure">Fallidos</SelectItem>
                  <SelectItem value="unknown">Desconocido</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value as typeof categoryFilter)}
              >
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="security">Seguridad</SelectItem>
                  <SelectItem value="data">Datos</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="other">Otra</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as typeof dateFilter)}>
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="Rango de tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Últimas 24 horas</SelectItem>
                  <SelectItem value="72h">Últimas 72 horas</SelectItem>
                  <SelectItem value="168h">Últimos 7 días</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={() => void loadAuditData()}
                className="gap-2 bg-dr-blue hover:bg-dr-blue-dark text-white"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registro de auditoría</CardTitle>
          <CardDescription>{displayedRangeMessage}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Fecha</TableHead>
                  <TableHead className="min-w-[180px]">Usuario</TableHead>
                  <TableHead className="min-w-[140px]">ID Usuario</TableHead>
                  <TableHead className="min-w-[140px]">IP</TableHead>
                  <TableHead className="min-w-[160px]">Acción</TableHead>
                  <TableHead className="min-w-[200px]">Recurso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="min-w-[240px]">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                      Cargando eventos de auditoría...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                      No se encontraron eventos que coincidan con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((event) => {
                    const status = normalizeAuditStatus(event);
                    const category = normalizeAuditCategory(event);
                    const eventDate = formatDateTime(resolveAuditDate(event));
                    const user = resolveStringField(event, USER_KEYS, '—');
                    const userId = resolveStringField(event, USER_ID_KEYS, '—');
                    const userEmail = resolveStringField(event, USER_EMAIL_KEYS, '');
                    const ipAddress = resolveStringField(event, IP_KEYS, '—');
                    const action = resolveStringField(event, ACTION_KEYS, '—');
                    const resource = resolveStringField(event, RESOURCE_KEYS, '—');
                    const detail = resolveStringField(event, DETAIL_KEYS, '—') || '—';

                    let parsedMetadata: string | null = null;
                    if (typeof event.metadataJson === 'string' && event.metadataJson.trim()) {
                      try {
                        const parsed = JSON.parse(event.metadataJson);
                        if (parsed && typeof parsed === 'object') {
                          const entries = Object.entries(parsed as Record<string, unknown>)
                            .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
                            .slice(0, 3);
                          if (entries.length > 0) {
                            parsedMetadata = entries.join(' · ');
                          }
                        }
                      } catch {
                        parsedMetadata = null;
                      }
                    }

                    return (
                      <TableRow key={event.id ?? `${eventDate}-${action}-${resource}`}>
                        <TableCell>{eventDate}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{user || '—'}</span>
                            {userEmail && (
                              <span className="text-xs text-gray-500">{userEmail}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                      <span className="text-sm text-gray-700">{userId || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{ipAddress || '—'}</span>
                    </TableCell>
                        <TableCell>{action}</TableCell>
                        <TableCell className="whitespace-nowrap">{resource}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_LABELS[status].badgeClass}>
                            {STATUS_LABELS[status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{CATEGORY_LABELS[category]}</TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-700 line-clamp-3">{detail}</p>
                          {event.id && (
                            <p className="text-xs text-gray-500 mt-1">ID evento: {event.id}</p>
                          )}
                          {parsedMetadata && (
                            <p className="text-xs text-gray-500 mt-1">Metadata: {parsedMetadata}</p>
                          )}
                          {event.correlationId && (
                            <p className="text-xs text-gray-500 mt-1">ID correlación: {event.correlationId}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            {filteredLogs.length === 0
              ? '0 eventos encontrados.'
              : `Eventos ${startItem}-${endItem} de ${filteredLogs.length} resultados filtrados.`}
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Por página</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  const parsed = Number.parseInt(value, 10);
                  if (!Number.isNaN(parsed)) {
                    setPageSize(parsed);
                  }
                }}
              >
                <SelectTrigger className="h-9 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                disabled={currentPage <= 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <span className="text-sm text-gray-600">
                Página {filteredLogs.length === 0 ? 0 : currentPage} de {filteredLogs.length === 0 ? 0 : pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((previous) => Math.min(pageCount, previous + 1))
                }
                disabled={currentPage >= pageCount || filteredLogs.length === 0}
                className="gap-1"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
