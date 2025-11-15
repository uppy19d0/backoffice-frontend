import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  AlertCircle,
  Ban,
  Building2,
  CheckCircle2,
  Eye,
  Key,
  Mail,
  MapPin,
  Pencil,
  RefreshCw,
  Shield,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminUserDto,
  ApiError,
  ReferenceItem,
  disableUser,
  createUser,
  enableUser,
  getAdminUsers,
  getUserById,
  getDepartments,
  getNonAdminUsers,
  getProvinces,
  getRoles,
  resetUserPassword,
  updateUser,
  updateUserRole,
} from '../services/api';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

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
  rawProfile?: Record<string, unknown> | null;
}

interface UsersManagementPageProps {
  currentUser?: CurrentUser | null;
  authToken: string | null;
  onNavigate?: (page: string) => void;
}

interface ViewDialogState {
  open: boolean;
  userId: string | null;
  summary: AdminUserDto | null;
  details: AdminUserDto | null;
  isLoading: boolean;
  error: string | null;
}

interface RoleDialogState {
  open: boolean;
  userId: string | null;
  user: AdminUserDto | null;
  selectedRole: string;
  isSubmitting: boolean;
  error: string | null;
}

interface PasswordDialogState {
  open: boolean;
  userId: string | null;
  user: AdminUserDto | null;
  newPassword: string;
  isSubmitting: boolean;
  error: string | null;
}

interface EditDialogState {
  open: boolean;
  userId: string | null;
  user: AdminUserDto | null;
  formData: {
    displayName: string;
    email: string;
    jobTitle: string;
    department: string;
    province: string;
  };
  isSubmitting: boolean;
  error: string | null;
}

type StatusAction = 'enable' | 'disable';

interface StatusDialogState {
  open: boolean;
  userId: string | null;
  user: AdminUserDto | null;
  action: StatusAction;
  isSubmitting: boolean;
  error: string | null;
}

const resolveString = (
  source: Record<string, unknown> | undefined,
  keys: string[],
  fallback = '—',
): string => {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
};

type NormalizedStatusKey = 'active' | 'inactive' | 'suspended' | 'pending' | 'unknown';

const STATUS_KEYWORD_MAP: Record<Exclude<NormalizedStatusKey, 'unknown'>, string[]> = {
  active: ['active', 'activo', 'enabled', 'habilitado', 'true', '1'],
  inactive: ['inactive', 'inactivo', 'disabled', 'deshabilitado', 'false', '0'],
  suspended: ['suspended', 'suspendido', 'suspension', '2'],
  pending: ['pending', 'pendiente', 'review', 'en_revision'],
};

const STATUS_ROLE_HINTS: Array<{ tokens: string[]; label: string }> = [
  { tokens: ['supervisor', 'manager', 'coordinador', 'coordinator'], label: 'Supervisor' },
  { tokens: ['analista', 'analyst'], label: 'Analista' },
  { tokens: ['admin', 'administrador', 'administrator'], label: 'Administrador' },
];

const SUPERVISOR_ROLE_KEYWORDS = [
  'supervisor',
  'supervisora',
  'manager',
  'coordinador',
  'coordinator',
  'gerente',
  'director',
  'jefe',
  'encargado',
  'encargada',
];

const SUPERVISOR_REQUIRED_ROLE_KEYWORDS = ['analista', 'analist', 'analyst', 'gestor', 'gestora'];

const normalizeMatchString = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const detectRoleHint = (normalized: string): string | null => {
  for (const { tokens, label } of STATUS_ROLE_HINTS) {
    if (tokens.some((token) => normalized.includes(token))) {
      return label;
    }
  }
  return null;
};

const normalizeStatusKey = (status: unknown): { key: NormalizedStatusKey; roleHint: string | null } => {
  if (status === null || status === undefined) {
    return { key: 'unknown', roleHint: null };
  }

  if (typeof status === 'number') {
    if (status === 1) return { key: 'active', roleHint: null };
    if (status === 0) return { key: 'inactive', roleHint: null };
    if (status === 2) return { key: 'suspended', roleHint: null };
    return { key: 'unknown', roleHint: null };
  }

  if (typeof status === 'string') {
    const normalized = status.trim().toLowerCase();
    if (!normalized) {
      return { key: 'unknown', roleHint: null };
    }

    for (const [key, tokens] of Object.entries(STATUS_KEYWORD_MAP) as Array<
      [Exclude<NormalizedStatusKey, 'unknown'>, string[]]
    >) {
      if (
        tokens.some(
          (token) =>
            normalized === token ||
            normalized.includes(token) ||
            normalized.replace(/[\s_-]+/g, '') === token.replace(/[\s_-]+/g, ''),
        )
      ) {
        return { key, roleHint: detectRoleHint(normalized) };
      }
    }

    // Fallback for common numeric strings
    if (!Number.isNaN(Number.parseInt(normalized, 10))) {
      return normalizeStatusKey(Number.parseInt(normalized, 10));
    }

    return { key: 'unknown', roleHint: detectRoleHint(normalized) };
  }

  if (typeof status === 'boolean') {
    return { key: status ? 'active' : 'inactive', roleHint: null };
  }

  return { key: 'unknown', roleHint: null };
};

const resolveStatusDescriptor = (
  status: AdminUserDto['status'],
): { label: string; className: string } => {
  const { key, roleHint } = normalizeStatusKey(status);

  const appendRoleHint = (label: string) => (roleHint ? `${label} (${roleHint})` : label);

  switch (key) {
    case 'active':
      return {
        label: appendRoleHint('Activo'),
        className: 'bg-green-100 text-green-800 border-green-200',
      };
    case 'inactive':
      return {
        label: appendRoleHint('Inactivo'),
        className: 'bg-red-100 text-red-800 border-red-200',
      };
    case 'suspended':
      return {
        label: appendRoleHint('Suspendido'),
        className: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'pending':
      return {
        label: appendRoleHint('Pendiente'),
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    default:
      return {
        label: typeof status === 'string' && status.trim() ? status : 'Desconocido',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      };
  }
};

const isActiveStatus = (status: AdminUserDto['status']): boolean => {
  return normalizeStatusKey(status).key === 'active';
};

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const resolveOptionValue = (item: ReferenceItem): string => {
  const candidates = ['code', 'id', 'key', 'value'];
  for (const candidate of candidates) {
    const value = item[candidate];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  if (typeof item.name === 'string' && item.name.trim()) {
    return item.name.trim();
  }
  if (typeof item.name === 'number') {
    return String(item.name);
  }
  return String(item.id ?? item.code ?? item.key ?? item.name ?? '');
};

const resolveOptionLabel = (item: ReferenceItem): string => {
  const candidates = ['name', 'description', 'label', 'code'];
  for (const candidate of candidates) {
    const value = item[candidate];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return resolveOptionValue(item);
};

const normalizeSelectCandidate = (candidate: unknown): string | null => {
  if (candidate === null || candidate === undefined) {
    return null;
  }
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    return trimmed.length > 0 && trimmed !== '—' ? trimmed : null;
  }
  if (typeof candidate === 'number') {
    return String(candidate);
  }
  return null;
};

const resolveOptionSelection = (
  options: { value: string; label: string }[],
  candidates: unknown[],
): { value: string; matched: boolean } => {
  const normalizedCandidates = candidates
    .map((candidate) => normalizeSelectCandidate(candidate))
    .filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of normalizedCandidates) {
    const matchByValue = options.find((option) => option.value === candidate);
    if (matchByValue) {
      return { value: matchByValue.value, matched: true };
    }

    const matchByLabel = options.find(
      (option) => option.label.toLowerCase() === candidate.toLowerCase(),
    );
    if (matchByLabel) {
      return { value: matchByLabel.value, matched: true };
    }
  }

  return { value: normalizedCandidates[0] ?? 'none', matched: false };
};

const USER_IDENTIFIER_KEYS = [
  'id',
  'userId',
  'code',
  'userCode',
  'username',
  'userName',
  'email',
];

const resolveUserIdentifier = (user: AdminUserDto): string | null => {
  const record = user as Record<string, unknown>;
  for (const key of USER_IDENTIFIER_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
};

const UNASSIGNED_VALUE = '__none__';

const INITIAL_FORM_STATE = {
  email: '',
  fullName: '',
  jobTitle: '',
  role: '',
  supervisorId: UNASSIGNED_VALUE,
  departmentId: UNASSIGNED_VALUE,
  provinceId: UNASSIGNED_VALUE,
  status: '1',
  tempPassword: '',
};

const PASSWORD_RULE_TRANSLATIONS: Record<string, string> = {
  'Passwords must have at least one non alphanumeric character.':
    'La contraseña debe incluir al menos un carácter especial (no alfanumérico).',
  "Passwords must have at least one lowercase ('a'-'z').":
    'La contraseña debe incluir al menos una letra minúscula (a-z).',
  "Passwords must have at least one uppercase ('A'-'Z').":
    'La contraseña debe incluir al menos una letra mayúscula (A-Z).',
};

const formatPasswordRuleMessage = (message: string): string => {
  const example = 'Ejemplo válido: Cambio#123!';
  const parts = message
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return message;
  }

  const translated = parts.map((part) => PASSWORD_RULE_TRANSLATIONS[part] ?? part);
  return [example, ...translated.map((rule) => `- ${rule}`)].join('\n');
};

export function UsersManagementPage({ currentUser, authToken }: UsersManagementPageProps) {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [roles, setRoles] = useState<ReferenceItem[]>([]);
  const [departments, setDepartments] = useState<ReferenceItem[]>([]);
  const [provinces, setProvinces] = useState<ReferenceItem[]>([]);

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createServersideError, setCreateServersideError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState<typeof INITIAL_FORM_STATE>(INITIAL_FORM_STATE);

  const [viewDialog, setViewDialog] = useState<ViewDialogState>({
    open: false,
    userId: null,
    summary: null,
    details: null,
    isLoading: false,
    error: null,
  });

  const [roleDialog, setRoleDialog] = useState<RoleDialogState>({
    open: false,
    userId: null,
    user: null,
    selectedRole: '',
    isSubmitting: false,
    error: null,
  });

  const [passwordDialog, setPasswordDialog] = useState<PasswordDialogState>({
    open: false,
    userId: null,
    user: null,
    newPassword: '',
    isSubmitting: false,
    error: null,
  });

  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    userId: null,
    user: null,
    formData: {
      displayName: '',
      email: '',
      jobTitle: '',
      department: 'none',
      province: 'none',
    },
    isSubmitting: false,
    error: null,
  });

  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    userId: null,
    user: null,
    action: 'disable',
    isSubmitting: false,
    error: null,
  });

  const canCreateUsers = currentUser?.permissions.canCreateUsers === true;
  const roleOptions = useMemo(
    () =>
      roles.map((role) => {
        const record = role as Record<string, unknown>;
        const value =
          typeof record.name === 'string' && record.name.trim().length > 0
            ? (record.name as string).trim()
            : resolveOptionValue(role);
        const label =
          typeof record.displayName === 'string' && record.displayName.trim().length > 0
            ? (record.displayName as string).trim()
            : resolveOptionLabel(role) || value;

        return { value, label };
      }),
    [roles],
  );

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        value: resolveOptionValue(department),
        label: resolveOptionLabel(department),
      })),
    [departments],
  );

  const provinceOptions = useMemo(
    () =>
      provinces.map((province) => ({
        value: resolveOptionValue(province),
        label: resolveOptionLabel(province),
      })),
    [provinces],
  );

  const supervisorOptions = useMemo(() => {
    const seen = new Set<string>();
    const candidates: Array<{ value: string; label: string; isPreferred: boolean }> = [];

    for (const user of users) {
      const identifier = resolveUserIdentifier(user);
      if (!identifier || seen.has(identifier)) {
        continue;
      }

      const name = resolveString(user, ['fullName', 'name'], '').trim();
      const email = resolveString(user, ['email', 'userName', 'username'], '').trim();
      const role = resolveString(user, ['role', 'roleName', 'roleDescription'], '').trim();
      const jobTitle = resolveString(user, ['jobTitle'], '').trim();

      const primary = name || email || identifier;
      const descriptor = role || jobTitle || '';
      const label = descriptor ? `${primary} — ${descriptor}` : primary;

      const normalizedDescriptor = normalizeMatchString(`${descriptor} ${primary}`);
      const isPreferred = SUPERVISOR_ROLE_KEYWORDS.some((keyword) =>
        normalizedDescriptor.includes(keyword),
      );

      candidates.push({ value: identifier, label, isPreferred });
      seen.add(identifier);
    }

    candidates.sort((a, b) => {
      if (a.isPreferred !== b.isPreferred) {
        return a.isPreferred ? -1 : 1;
      }
      return a.label.localeCompare(b.label, 'es', { sensitivity: 'base' });
    });

    return candidates.map(({ value, label }) => ({ value, label }));
  }, [users]);

  const roleRequiresSupervisor = useCallback(
    (roleValue: string): boolean => {
      if (!roleValue) {
        return false;
      }

      const option = roleOptions.find((role) => role.value === roleValue);
      const searchText = `${option?.label ?? ''} ${roleValue}`;
      const normalized = normalizeMatchString(searchText);

      return SUPERVISOR_REQUIRED_ROLE_KEYWORDS.some((keyword) => normalized.includes(keyword));
    },
    [roleOptions],
  );

  const requiresSupervisor = useMemo(
    () => (newUser.role ? roleRequiresSupervisor(newUser.role) : false),
    [newUser.role, roleRequiresSupervisor],
  );

  const referencesReady =
    roleOptions.length > 0 ||
    departmentOptions.length > 0 ||
    provinceOptions.length > 0 ||
    !isLoadingReferences;

  const loadUsers = useCallback(async () => {
    if (!authToken) {
      setUsers([]);
      return;
    }

    setIsLoadingUsers(true);
    setError(null);

    try {
      const [admins, nonAdmins] = await Promise.all([
        getAdminUsers(authToken),
        getNonAdminUsers(authToken),
      ]);
      setUsers([...admins, ...nonAdmins]);
    } catch (err) {
      console.error('Error cargando usuarios', err);
      let message = 'No se pudo obtener la lista de usuarios.';

      if (err instanceof ApiError) {
        if (err.status === 401) {
          message = 'La sesión caducó o es inválida. Inicie sesión nuevamente.';
        } else if (err.status === 403) {
          message = 'Su cuenta no tiene permisos para consultar usuarios en el backoffice.';
        } else if (typeof err.message === 'string' && err.message.trim()) {
          message = err.message;
        }
      } else if (err instanceof TypeError) {
        const text = err.message ?? '';
        if (/Failed to fetch/i.test(text) || /NetworkError/i.test(text)) {
          message = 'No se pudo contactar al servicio de usuarios. Verifique su conexión o la configuración de CORS en la API.';
        } else {
          message = text || message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [authToken]);

  const loadReferences = useCallback(async () => {
    if (!authToken) {
      setRoles([]);
      setDepartments([]);
      setProvinces([]);
      return;
    }

    setIsLoadingReferences(true);

    try {
      const [rolesResponse, departmentsResponse, provincesResponse] = await Promise.all([
        getRoles(authToken),
        getDepartments(authToken),
        getProvinces(authToken),
      ]);

      setRoles(rolesResponse);
      setDepartments(departmentsResponse);
      setProvinces(provincesResponse);
    } catch (err) {
      console.error('Error cargando catálogos', err);
      toast.error('No se pudieron cargar los catálogos de referencia.');
    } finally {
      setIsLoadingReferences(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !canCreateUsers) {
      return;
    }
    loadUsers();
    loadReferences();
  }, [authToken, canCreateUsers, loadUsers, loadReferences]);

  useEffect(() => {
    if (!newUser.role && roleOptions.length > 0) {
      setNewUser((prev) => ({
        ...prev,
        role: roleOptions[0].value,
        supervisorId: roleRequiresSupervisor(roleOptions[0].value)
          ? prev.supervisorId
          : UNASSIGNED_VALUE,
      }));
    }
  }, [roleOptions, newUser.role, roleRequiresSupervisor]);

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      if (!canCreateUsers) {
        toast.warning('Su cuenta no tiene permisos para crear usuarios.');
        setIsCreateDialogOpen(false);
        return;
      }

      setCreateError(null);
      setNewUser(INITIAL_FORM_STATE);
      setIsCreateDialogOpen(true);
      if (!referencesReady && !isLoadingReferences) {
        loadReferences();
      }
      return;
    }

    setIsCreateDialogOpen(false);
    setIsCreating(false);
    setCreateError(null);
  };

  const handleSubmitNewUser = async () => {
    if (!authToken) {
      setCreateError('Debe iniciar sesión nuevamente para crear usuarios.');
      return;
    }

    if (!newUser.email || !newUser.fullName || !newUser.role || !newUser.tempPassword) {
      setCreateError('Complete los campos requeridos (correo, nombre, rol y contraseña temporal).');
      return;
    }

    const supervisorIdValue =
      !newUser.supervisorId || newUser.supervisorId === UNASSIGNED_VALUE
        ? null
        : newUser.supervisorId;

    if (requiresSupervisor && !supervisorIdValue) {
      setCreateError(
        supervisorOptions.length === 0
          ? 'No hay supervisores disponibles. Actualice la lista de usuarios o cree un supervisor antes de continuar.'
          : 'Seleccione el supervisor responsable para este usuario.',
      );
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreateServersideError(null);

    try {
      const departmentIdValue =
        !newUser.departmentId || newUser.departmentId === UNASSIGNED_VALUE
          ? null
          : newUser.departmentId;
      const provinceIdValue =
        !newUser.provinceId || newUser.provinceId === UNASSIGNED_VALUE
          ? null
          : newUser.provinceId;

      await createUser(authToken, {
        email: newUser.email.trim(),
        fullName: newUser.fullName.trim(),
        jobTitle: newUser.jobTitle.trim() || null,
        role: newUser.role,
        departmentId: departmentIdValue,
        provinceId: provinceIdValue,
        status: Number.parseInt(newUser.status, 10),
        tempPassword: newUser.tempPassword,
        supervisorId: supervisorIdValue,
      });

      toast.success('Usuario creado exitosamente.');

      await loadUsers();

      // Limpiar formulario y mantener el diálogo abierto para crear más usuarios
      setNewUser(INITIAL_FORM_STATE);
      setCreateError(null);
      setCreateServersideError(null);
    } catch (err) {
      console.error('Error creando usuario', err);
      let message = 'No se pudo crear el usuario. Inténtelo nuevamente.';

      const normalizeMessage = (raw: string) =>
        raw.includes('Passwords must') ? formatPasswordRuleMessage(raw) : raw;

      if (err instanceof ApiError) {
        const details = err.details;
        if (details && typeof details === 'object') {
          const detailsObj = details as Record<string, unknown>;
          if (
            'error' in detailsObj &&
            typeof detailsObj.error === 'string' &&
            detailsObj.error.trim().length > 0
          ) {
            const raw = (detailsObj.error as string).trim();
            message = normalizeMessage(raw);
          } else if (
            'message' in detailsObj &&
            typeof detailsObj.message === 'string' &&
            detailsObj.message.trim().length > 0
          ) {
            const raw = (detailsObj.message as string).trim();
            message = normalizeMessage(raw);
          }
        } else if (err.message.trim().length > 0) {
          message = normalizeMessage(err.message.trim());
        }
      } else if (err instanceof Error && err.message.trim().length > 0) {
        message = normalizeMessage(err.message.trim());
      }

      setCreateServersideError(message);
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const resetViewDialogState = () =>
    setViewDialog({
      open: false,
      userId: null,
      summary: null,
      details: null,
      isLoading: false,
      error: null,
    });

  const resetRoleDialogState = () =>
    setRoleDialog({
      open: false,
      userId: null,
      user: null,
      selectedRole: '',
      isSubmitting: false,
      error: null,
    });

  const resetPasswordDialogState = () =>
    setPasswordDialog({
      open: false,
      userId: null,
      user: null,
      newPassword: '',
      isSubmitting: false,
      error: null,
    });

  const resetEditDialogState = () =>
    setEditDialog({
      open: false,
      userId: null,
      user: null,
      formData: {
        displayName: '',
        email: '',
        jobTitle: '',
        department: 'none',
        province: 'none',
      },
      isSubmitting: false,
      error: null,
    });

  const resetStatusDialogState = () =>
    setStatusDialog({
      open: false,
      userId: null,
      user: null,
      action: 'disable',
      isSubmitting: false,
      error: null,
    });

  const handleOpenViewDialog = async (user: AdminUserDto) => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para consultar los detalles del usuario.');
      return;
    }

    const identifier = resolveUserIdentifier(user);
    if (!identifier) {
      toast.error('No se pudo determinar el identificador del usuario seleccionado.');
      return;
    }

    setViewDialog({
      open: true,
      userId: identifier,
      summary: user,
      details: null,
      isLoading: true,
      error: null,
    });

    try {
      const details = await getUserById(authToken, identifier);
      setViewDialog((prev) => ({
        ...prev,
        details,
        isLoading: false,
      }));
    } catch (err) {
      console.error('Error obteniendo detalle de usuario', err);
      let message = 'No se pudo obtener la información del usuario.';

      if (err instanceof ApiError && typeof err.message === 'string' && err.message.trim()) {
        message = err.message.trim();
      } else if (err instanceof Error && typeof err.message === 'string' && err.message.trim()) {
        message = err.message.trim();
      }

      setViewDialog((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      toast.error(message);
    }
  };

  const handleOpenRoleDialog = (user: AdminUserDto) => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para actualizar el rol del usuario.');
      return;
    }

    const identifier = resolveUserIdentifier(user);
    if (!identifier) {
      toast.error('No se pudo determinar el identificador del usuario seleccionado.');
      return;
    }

    if (roleOptions.length === 0 && !isLoadingReferences) {
      void loadReferences();
      toast('No hay roles disponibles. Solicitando catálogos...');
    }

    const record = user as Record<string, unknown>;
    const candidateValues = [
      record.roleId,
      record.roleKey,
      record.roleCode,
      record.role,
    ];

    let initialRole = '';
    for (const candidate of candidateValues) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        const normalized = candidate.trim();
        const matchByValue = roleOptions.find((role) => role.value === normalized);
        if (matchByValue) {
          initialRole = matchByValue.value;
          break;
        }
        const matchByLabel = roleOptions.find(
          (role) => role.label.toLowerCase() === normalized.toLowerCase(),
        );
        if (matchByLabel) {
          initialRole = matchByLabel.value;
          break;
        }
      }
    }

    if (!initialRole && roleOptions.length > 0) {
      initialRole = roleOptions[0].value;
    }

    setRoleDialog({
      open: true,
      userId: identifier,
      user,
      selectedRole: initialRole,
      isSubmitting: false,
      error: null,
    });
  };

  const handleSubmitRoleDialog = async () => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para actualizar el rol del usuario.');
      return;
    }

    if (!roleDialog.userId) {
      toast.error('No se pudo determinar el identificador del usuario.');
      return;
    }

    if (!roleDialog.selectedRole) {
      setRoleDialog((prev) => ({
        ...prev,
        error: 'Seleccione un rol válido.',
      }));
      return;
    }

    setRoleDialog((prev) => ({
      ...prev,
      isSubmitting: true,
      error: null,
    }));

    try {
      await updateUserRole(authToken, roleDialog.userId, { roleId: roleDialog.selectedRole });
      toast.success('Rol actualizado correctamente.');
      resetRoleDialogState();
      await loadUsers();
    } catch (err) {
      console.error('Error actualizando rol de usuario', err);
      let message = 'No se pudo actualizar el rol del usuario.';

      if (err instanceof ApiError && typeof err.message === 'string' && err.message.trim()) {
        message = err.message.trim();
      } else if (err instanceof Error && typeof err.message === 'string' && err.message.trim()) {
        message = err.message.trim();
      }

      setRoleDialog((prev) => ({
        ...prev,
        isSubmitting: false,
        error: message,
      }));
      toast.error(message);
    }
  };

  const handleOpenPasswordDialog = (user: AdminUserDto) => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para restablecer la contraseña.');
      return;
    }

    const identifier = resolveUserIdentifier(user);
    if (!identifier) {
      toast.error('No se pudo determinar el identificador del usuario seleccionado.');
      return;
    }

    setPasswordDialog({
      open: true,
      userId: identifier,
      user,
      newPassword: '',
      isSubmitting: false,
      error: null,
    });
  };

  const handleSubmitPasswordDialog = async () => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para restablecer la contraseña.');
      return;
    }

    if (!passwordDialog.userId) {
      toast.error('No se pudo determinar el identificador del usuario.');
      return;
    }

    if (!passwordDialog.newPassword || passwordDialog.newPassword.trim().length < 8) {
      setPasswordDialog((prev) => ({
        ...prev,
        error: 'Ingrese una contraseña temporal con al menos 8 caracteres.',
      }));
      return;
    }

    setPasswordDialog((prev) => ({
      ...prev,
      isSubmitting: true,
      error: null,
    }));

    try {
      await resetUserPassword(authToken, passwordDialog.userId, passwordDialog.newPassword.trim());
      toast.success('Contraseña restablecida correctamente.');
      resetPasswordDialogState();
    } catch (err) {
      console.error('Error restableciendo contraseña', err);
      let message = 'No se pudo restablecer la contraseña del usuario.';

      if (err instanceof ApiError && typeof err.message === 'string' && err.message.trim()) {
        message = err.message.trim();
      } else if (err instanceof Error && typeof err.message === 'string' && err.message.trim()) {
        message = err.message.trim();
      }

      setPasswordDialog((prev) => ({
        ...prev,
        isSubmitting: false,
        error: message,
      }));
      toast.error(message);
    }
  };

  const handleOpenEditDialog = (user: AdminUserDto) => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para editar el usuario.');
      return;
    }

    if (!referencesReady && !isLoadingReferences) {
      void loadReferences();
    }

    const record = user as Record<string, unknown>;
    const departmentSelection = resolveOptionSelection(departmentOptions, [
      record.departmentId,
      record.department,
      record.departmentName,
    ]);
    const provinceSelection = resolveOptionSelection(provinceOptions, [
      record.provinceId,
      record.province,
      record.provinceName,
    ]);

    const formData = {
      displayName: resolveString(user, ['displayName', 'name'], ''),
      email: resolveString(user, ['email'], ''),
      jobTitle: resolveString(user, ['jobTitle'], ''),
      department: departmentSelection.value,
      province: provinceSelection.value,
    };

    setEditDialog({
      open: true,
      userId: user.userId || user.id || null,
      user,
      formData,
      isSubmitting: false,
      error: null,
    });
  };

  const handleSubmitEditDialog = async () => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para editar el usuario.');
      return;
    }

    if (!editDialog.userId) {
      toast.error('ID de usuario no válido.');
      return;
    }

    const { displayName, email, jobTitle, department, province } = editDialog.formData;

    if (!displayName.trim() || !email.trim()) {
      setEditDialog(prev => ({
        ...prev,
        error: 'El nombre completo y el email son obligatorios.',
      }));
      return;
    }

    setEditDialog(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const departmentIdValue = department === 'none' ? null : department;
      const provinceIdValue = province === 'none' ? null : province;

      const payload = {
        displayName: displayName.trim(),
        email: email.trim(),
        jobTitle: jobTitle.trim() || null,
        department: departmentIdValue,
        departmentId: departmentIdValue,
        province: provinceIdValue,
        provinceId: provinceIdValue,
      };

      await updateUser(authToken, editDialog.userId, payload);

      toast.success('Usuario actualizado correctamente.');
      resetEditDialogState();
      await loadUsers();
    } catch (err) {
      console.error('Error actualizando usuario', err);
      let message = 'No se pudo actualizar el usuario.';
      
      if (err instanceof ApiError) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      setEditDialog(prev => ({
        ...prev,
        isSubmitting: false,
        error: message,
      }));
      toast.error(message);
    }
  };

  const handleOpenStatusDialog = (user: AdminUserDto, action: StatusAction) => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para actualizar el estado del usuario.');
      return;
    }

    const identifier = resolveUserIdentifier(user);
    if (!identifier) {
      toast.error('No se pudo determinar el identificador del usuario seleccionado.');
      return;
    }

    setStatusDialog({
      open: true,
      userId: identifier,
      user,
      action,
      isSubmitting: false,
      error: null,
    });
  };

  const handleConfirmStatusDialog = async () => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para actualizar el estado del usuario.');
      return;
    }

    if (!statusDialog.userId) {
      toast.error('No se pudo determinar el identificador del usuario.');
      return;
    }

    setStatusDialog((prev) => ({
      ...prev,
      isSubmitting: true,
      error: null,
    }));

    try {
      if (statusDialog.action === 'disable') {
        await disableUser(authToken, statusDialog.userId);
        toast.success('Usuario deshabilitado correctamente.');
      } else {
        await enableUser(authToken, statusDialog.userId);
        toast.success('Usuario habilitado correctamente.');
      }

      resetStatusDialogState();
      await loadUsers();
    } catch (err) {
      console.error('Error actualizando estado de usuario', err);
      let message =
        statusDialog.action === 'disable'
          ? 'No se pudo deshabilitar al usuario.'
          : 'No se pudo habilitar al usuario.';

      if (err instanceof ApiError && typeof err.message === 'string' && err.message.trim()) {
        message = err.message.trim();
      } else if (err instanceof Error && typeof err.message === 'string' && err.message.trim()) {
        message = err.message.trim();
      }

      setStatusDialog((prev) => ({
        ...prev,
        isSubmitting: false,
        error: message,
      }));
      toast.error(message);
    }
  };

  const viewDialogUser = viewDialog.details ?? viewDialog.summary;
  const viewDialogStatusInfo = viewDialogUser
    ? resolveStatusDescriptor(viewDialogUser.status)
    : null;
  const roleDialogUserName = roleDialog.user
    ? resolveString(roleDialog.user, ['displayName', 'fullName', 'name', 'email'], '—')
    : '—';
  const roleDialogUserEmail = roleDialog.user
    ? resolveString(roleDialog.user, ['email'], '')
    : '';
  const passwordDialogUserName = passwordDialog.user
    ? resolveString(passwordDialog.user, ['displayName', 'fullName', 'name', 'email'], '—')
    : '—';
  const passwordDialogUserEmail = passwordDialog.user
    ? resolveString(passwordDialog.user, ['email'], '')
    : '';
  const statusDialogTitle =
    statusDialog.action === 'disable' ? 'Suspender usuario' : 'Reactivar usuario';
  const statusDialogDescription =
    statusDialog.action === 'disable'
      ? 'El usuario perderá acceso inmediato al backoffice.'
      : 'El usuario podrá acceder nuevamente al backoffice.';
  const statusDialogUserName = statusDialog.user
    ? resolveString(statusDialog.user, ['displayName', 'fullName', 'name', 'email'], 'usuario seleccionado')
    : 'usuario seleccionado';

  // Calculate statistics
  const activeUsers = users.filter(u => {
    const status = typeof u.status === 'string' ? u.status.toLowerCase() : String(u.status);
    return status === 'active' || status === '1';
  }).length;
  const inactiveUsers = users.filter(u => {
    const status = typeof u.status === 'string' ? u.status.toLowerCase() : String(u.status);
    return status === 'inactive' || status === '0';
  }).length;
  const suspendedUsers = users.filter(u => {
    const status = typeof u.status === 'string' ? u.status.toLowerCase() : String(u.status);
    return status === 'suspended' || status === '2';
  }).length;
  const supervisors = users.filter(u => {
    const role = (u.role || '').toLowerCase();
    return role.includes('supervisor') || role.includes('manager');
  }).length;

  return (
    <div className="space-y-6">
      {!authToken && (
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Inicie sesión nuevamente para gestionar usuarios.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-dr-blue bg-gradient-to-br from-blue-50/50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-dr-blue/10 p-3 rounded-xl">
                <Shield className="h-6 w-6 text-dr-blue" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Usuarios</p>
                <p className="text-2xl font-bold text-dr-dark-gray mt-0.5">
                  {users.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Activos</p>
                <p className="text-2xl font-bold text-dr-dark-gray mt-0.5">{activeUsers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {users.length > 0 ? `${((activeUsers / users.length) * 100).toFixed(0)}% del total` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-3 rounded-xl">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Supervisores</p>
                <p className="text-2xl font-bold text-dr-dark-gray mt-0.5">{supervisors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-3 rounded-xl">
                <Ban className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Inactivos/Suspendidos</p>
                <p className="text-2xl font-bold text-dr-dark-gray mt-0.5">{inactiveUsers + suspendedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>
                {isLoadingUsers ? 'Cargando...' : `${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={loadUsers}
              disabled={isLoadingUsers || !authToken}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  disabled={!authToken || !canCreateUsers}
                  className="gap-2 bg-dr-blue hover:bg-dr-blue-dark text-white"
                >
                  <UserPlus className="h-4 w-4" />
                  Nuevo usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear nuevo usuario</DialogTitle>
                  <DialogDescription>
                    Complete la información solicitada para agregar un nuevo usuario al sistema SIUBEN.
                  </DialogDescription>
                </DialogHeader>

                {referencesReady ? (
                  <>
                    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-dr-blue/10 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-dr-blue" />
                          </div>
                          <CardTitle className="text-base">Guía de Creación de Usuarios</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-700 font-medium mb-2">
                            Para una gestión efectiva del equipo, siga este orden recomendado:
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-dr-blue text-white flex items-center justify-center text-xs font-bold">
                              1
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-dr-blue mb-1">Crear Supervisor(es)</p>
                              <p className="text-gray-600 text-xs leading-relaxed">
                                Los supervisores coordinan equipos y supervisan el trabajo de los analistas.
                                Tienen permisos para revisar y aprobar solicitudes, gestionar usuarios y acceder a reportes completos.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                              2
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-green-700 mb-1">Crear Analista(s)</p>
                              <p className="text-gray-600 text-xs leading-relaxed">
                                Los analistas procesan solicitudes y gestionan beneficiarios. Cada analista debe tener un supervisor asignado.
                                Asegúrese de seleccionar el supervisor correspondiente al crear el analista.
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-xs text-amber-900">
                            <strong>💡 Consejo:</strong> Después de crear un usuario exitosamente, el formulario se limpiará automáticamente
                            pero el diálogo permanecerá abierto para facilitar la creación de múltiples usuarios.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-user-email">Correo electrónico</Label>
                      <Input
                        id="new-user-email"
                        type="email"
                        placeholder="usuario@siuben.gob.do"
                        value={newUser.email}
                        onChange={(event) =>
                          setNewUser((prev) => ({ ...prev, email: event.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-fullName">Nombre completo</Label>
                      <Input
                        id="new-user-fullName"
                        placeholder="Nombre y apellidos"
                        value={newUser.fullName}
                        onChange={(event) =>
                          setNewUser((prev) => ({ ...prev, fullName: event.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-jobTitle">Cargo</Label>
                      <Input
                        id="new-user-jobTitle"
                        placeholder="Analista, Coordinador, etc."
                        value={newUser.jobTitle}
                        onChange={(event) =>
                          setNewUser((prev) => ({ ...prev, jobTitle: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rol</Label>
                      {roleOptions.length > 0 ? (
                        <Select
                          value={newUser.role}
                          onValueChange={(value) =>
                            setNewUser((prev) => ({
                              ...prev,
                              role: value,
                              supervisorId: roleRequiresSupervisor(value)
                                ? prev.supervisorId
                                : UNASSIGNED_VALUE,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Rol (ej. Admin, Analyst)"
                          value={newUser.role}
                          onChange={(event) => {
                            const value = event.target.value;
                            setNewUser((prev) => ({
                              ...prev,
                              role: value,
                              supervisorId: roleRequiresSupervisor(value)
                                ? prev.supervisorId
                                : UNASSIGNED_VALUE,
                            }));
                          }}
                          required
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Supervisor responsable
                        {requiresSupervisor ? (
                          <span className="ml-1 text-red-600">*</span>
                        ) : null}
                      </Label>
                      {supervisorOptions.length > 0 ? (
                        <Select
                          value={newUser.supervisorId}
                          onValueChange={(value) =>
                            setNewUser((prev) => ({ ...prev, supervisorId: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un supervisor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNASSIGNED_VALUE}>Sin supervisor asignado</SelectItem>
                            {supervisorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600">
                          {isLoadingUsers
                            ? 'Cargando supervisores disponibles...'
                            : 'No se encontraron supervisores activos. Actualice la lista o cree un supervisor primero.'}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        {requiresSupervisor
                          ? 'Seleccione el supervisor responsable para este usuario.'
                          : 'Opcional. Puede asignarlo más adelante si es necesario.'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      {departmentOptions.length > 0 ? (
                        <Select
                          value={newUser.departmentId}
                          onValueChange={(value) =>
                            setNewUser((prev) => ({ ...prev, departmentId: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNASSIGNED_VALUE}>Sin asignar</SelectItem>
                            {departmentOptions.map((dept) => (
                              <SelectItem key={dept.value} value={dept.value}>
                                {dept.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Departamento (escriba el nombre)"
                          value={newUser.departmentId === UNASSIGNED_VALUE ? '' : newUser.departmentId}
                          onChange={(event) =>
                            setNewUser((prev) => ({
                              ...prev,
                              departmentId:
                                event.target.value.trim() === ''
                                  ? UNASSIGNED_VALUE
                                  : event.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Provincia</Label>
                      {provinceOptions.length > 0 ? (
                        <Select
                          value={newUser.provinceId}
                          onValueChange={(value) =>
                            setNewUser((prev) => ({ ...prev, provinceId: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una provincia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNASSIGNED_VALUE}>Sin asignar</SelectItem>
                            {provinceOptions.map((province) => (
                              <SelectItem key={province.value} value={province.value}>
                                {province.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Provincia (escriba el nombre)"
                          value={newUser.provinceId === UNASSIGNED_VALUE ? '' : newUser.provinceId}
                          onChange={(event) =>
                            setNewUser((prev) => ({
                              ...prev,
                              provinceId:
                                event.target.value.trim() === ''
                                  ? UNASSIGNED_VALUE
                                  : event.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={newUser.status}
                        onValueChange={(value) =>
                          setNewUser((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Activo</SelectItem>
                          <SelectItem value="0">Inactivo</SelectItem>
                          <SelectItem value="2">Suspendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-tempPassword">Contraseña temporal</Label>
                      <Input
                        id="new-user-tempPassword"
                        type="password"
                        placeholder="Temporal#123"
                        value={newUser.tempPassword}
                        onChange={(event) =>
                          setNewUser((prev) => ({ ...prev, tempPassword: event.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-dr-blue/30 border-t-dr-blue" />
                    <p className="text-sm text-gray-600 text-center">
                      Cargando catálogos y configuraciones necesarias para crear usuarios...
                    </p>
                  </div>
                )}

                {(createError || createServersideError) && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 space-y-1">
                      {createError && <p>{createError}</p>}
                      {createServersideError &&
                        createServersideError.split('\n').map((line, idx) => (
                          <p key={`server-error-${idx}`}>{line}</p>
                        ))}
                    </AlertDescription>
                  </Alert>
                )}

                <DialogFooter className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="button"
                    className="bg-dr-blue hover:bg-dr-blue-dark text-white"
                    onClick={handleSubmitNewUser}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creando...' : 'Crear usuario'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert className="m-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dr-blue mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Cargando usuarios del sistema...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay usuarios registrados</p>
              </div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Departamento</TableHead>
                  <TableHead className="hidden lg:table-cell">Provincia</TableHead>
                  <TableHead className="hidden xl:table-cell">Creado</TableHead>
                  <TableHead className="hidden xl:table-cell">Último acceso</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                    const displayName = resolveString(user, ['displayName', 'fullName', 'name', 'email'], 'Usuario');
                    const email = resolveString(user, ['email'], 'Sin correo');
                    const role = resolveString(user, ['role'], '—');
                    const department = resolveString(user, ['departmentName'], '—');
                    const province = resolveString(user, ['provinceName'], '—');
                    const statusInfo = resolveStatusDescriptor(user.status);
                    const createdAt = resolveString(user, ['createdAt'], '');
                    const lastAccess = resolveString(user, ['lastAccessAt'], '');
                    const identifier = resolveUserIdentifier(user);
                    const isActive = isActiveStatus(user.status);
                    const statusAction: StatusAction = isActive ? 'disable' : 'enable';
                    const StatusIcon = isActive ? Ban : CheckCircle2;
                    const statusTooltip =
                      statusAction === 'disable' ? 'Suspender usuario' : 'Reactivar usuario';
                    const managementDisabled = !authToken || !canCreateUsers;
                    const roleChangeDisabled = managementDisabled || roleOptions.length === 0;
                    const passwordResetDisabled = managementDisabled;
                    const statusChangeDisabled = managementDisabled;

                    return (
                      <TableRow key={identifier ?? user.id ?? `${email}-${role}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-dr-dark-gray">{displayName}</span>
                            <span className="text-xs text-gray-500">
                              {user.jobTitle || ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-dr-blue">{email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            {department}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {province}
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-gray-600">
                          {formatDateTime(createdAt)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-gray-600">
                          {formatDateTime(lastAccess)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleOpenViewDialog(user)}
                                  aria-label="Ver detalles"
                                  disabled={!authToken}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalles</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 text-green-600 hover:bg-green-50"
                                  onClick={() => handleOpenEditDialog(user)}
                                  aria-label="Editar usuario"
                                  disabled={roleChangeDisabled}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {roleChangeDisabled ? 'Permiso requerido' : 'Editar usuario'}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 text-amber-600 hover:bg-amber-50"
                                  onClick={() => handleOpenRoleDialog(user)}
                                  aria-label="Actualizar rol"
                                  disabled={roleChangeDisabled}
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {roleChangeDisabled ? 'Permiso requerido' : 'Actualizar rol'}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 text-purple-600 hover:bg-purple-50"
                                  onClick={() => handleOpenPasswordDialog(user)}
                                  aria-label="Restablecer contraseña"
                                  disabled={passwordResetDisabled}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {passwordResetDisabled
                                  ? 'Permiso requerido'
                                  : 'Restablecer contraseña'}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className={`h-9 w-9 p-0 ${statusAction === 'disable' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                  onClick={() => handleOpenStatusDialog(user, statusAction)}
                                  aria-label={statusTooltip}
                                  disabled={statusChangeDisabled}
                                >
                                  <StatusIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {statusChangeDisabled ? 'Permiso requerido' : statusTooltip}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {isLoadingReferences && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Cargando catálogos de roles, departamentos y provincias...
          </AlertDescription>
        </Alert>
      )}

      {currentUser?.permissions.canCreateUsers !== true && (
        <>
          <Separator />
          <Alert className="border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Su cuenta no tiene permisos para crear o modificar usuarios. Solo puede consultar la información.
            </AlertDescription>
          </Alert>
        </>
      )}

      <Dialog
        open={viewDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            resetViewDialogState();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 -m-6 mb-0 p-6 rounded-t-lg">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-dr-dark-gray">
                {viewDialogUser ? resolveString(viewDialogUser, ['displayName', 'fullName', 'name', 'email'], 'Usuario') : 'Detalle del usuario'}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {viewDialogUser && (
                  <>
                    <Badge variant="outline" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      {resolveString(viewDialogUser, ['email'], '—')}
                    </Badge>
                    {viewDialogStatusInfo && (
                      <Badge className={`${viewDialogStatusInfo.className} text-xs`}>
                        {viewDialogStatusInfo.label}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {viewDialog.isLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-dr-blue/30 border-t-dr-blue" />
                <p className="text-sm text-gray-500 font-medium">Cargando información...</p>
              </div>
            )}

            {!viewDialog.isLoading && viewDialogUser && (
              <>
                {/* Información Personal */}
                <Card className="border-l-4 border-l-dr-blue">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-dr-blue" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Nombre de Usuario</p>
                      <p className="text-sm font-medium text-dr-dark-gray">
                        {resolveString(viewDialogUser, ['displayName', 'fullName', 'name'], '—')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Correo Electrónico</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-dr-blue">
                          {resolveString(viewDialogUser, ['email'], '—')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Información Laboral */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      Información Laboral
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Rol</p>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <p className="text-sm font-medium text-gray-700">
                          {resolveString(viewDialogUser, ['role', 'roleName'], '—')}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Cargo</p>
                      <p className="text-sm text-gray-700">
                        {resolveString(viewDialogUser, ['jobTitle'], '—')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Departamento</p>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-700">
                          {resolveString(viewDialogUser, ['departmentName', 'department'], '—')}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Provincia</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-700">
                          {resolveString(viewDialogUser, ['provinceName', 'province'], '—')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Información del Sistema */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Información del Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Estado</p>
                      <div>
                        {viewDialogStatusInfo ? (
                          <Badge className={`${viewDialogStatusInfo.className} font-medium`}>
                            {viewDialogStatusInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Fecha de Creación</p>
                      <p className="text-sm text-gray-700">
                        {formatDateTime(resolveString(viewDialogUser, ['createdAt', 'createdDate'], ''))}
                      </p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Último Acceso</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {formatDateTime(resolveString(viewDialogUser, ['lastAccessAt', 'LastAccessAt', 'lastLoginAt', 'lastLogin'], ''))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!viewDialog.isLoading && !viewDialogUser && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No se encontraron datos para este usuario.</p>
              </div>
            )}

            {viewDialog.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{viewDialog.error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button variant="outline" onClick={resetViewDialogState} className="w-full sm:w-auto">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={roleDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            resetRoleDialogState();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar rol</DialogTitle>
            <DialogDescription>
              Seleccione el rol que debe tener el usuario en el sistema SIUBEN.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Usuario</p>
              <p className="text-sm font-medium text-dr-dark-gray">{roleDialogUserName}</p>
              {roleDialogUserEmail && (
                <p className="text-xs text-gray-500">{roleDialogUserEmail}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role-select">Rol asignado</Label>
              <Select
                value={roleDialog.selectedRole}
                onValueChange={(value) =>
                  setRoleDialog((prev) => ({
                    ...prev,
                    selectedRole: value,
                    error: null,
                  }))
                }
                disabled={roleOptions.length === 0}
              >
                <SelectTrigger id="user-role-select">
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {roleDialog.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{roleDialog.error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetRoleDialogState}
              disabled={roleDialog.isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-dr-blue hover:bg-dr-blue-dark text-white"
              onClick={handleSubmitRoleDialog}
              disabled={roleDialog.isSubmitting || !roleDialog.selectedRole}
            >
              {roleDialog.isSubmitting ? 'Guardando...' : 'Actualizar rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            resetPasswordDialogState();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              Defina una nueva contraseña temporal que el usuario deberá cambiar al iniciar sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Usuario</p>
              <p className="text-sm font-medium text-dr-dark-gray">{passwordDialogUserName}</p>
              {passwordDialogUserEmail && (
                <p className="text-xs text-gray-500">{passwordDialogUserEmail}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-new-password">Nueva contraseña temporal</Label>
              <Input
                id="user-new-password"
                type="password"
                placeholder="Temporal#123"
                value={passwordDialog.newPassword}
                onChange={(event) =>
                  setPasswordDialog((prev) => ({
                    ...prev,
                    newPassword: event.target.value,
                    error: null,
                  }))
                }
                disabled={passwordDialog.isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Debe contener al menos 8 caracteres y cumplir con las políticas de seguridad.
              </p>
            </div>
            {passwordDialog.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {passwordDialog.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetPasswordDialogState}
              disabled={passwordDialog.isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-dr-blue hover:bg-dr-blue-dark text-white"
              onClick={handleSubmitPasswordDialog}
              disabled={passwordDialog.isSubmitting}
            >
              {passwordDialog.isSubmitting ? 'Actualizando...' : 'Restablecer contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            resetEditDialogState();
          }
        }}
      >
        <DialogContent className="w-full max-w-sm sm:max-w-md max-h-[75vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualice la información del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>

          {editDialog.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{editDialog.error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="edit-fullName" className="text-sm font-medium">Nombre Completo *</Label>
              <Input
                id="edit-fullName"
                value={editDialog.formData.displayName}
                onChange={(e) =>
                  setEditDialog(prev => ({
                    ...prev,
                    formData: { ...prev.formData, displayName: e.target.value },
                  }))
                }
                disabled={editDialog.isSubmitting}
                placeholder="Ingrese el nombre completo"
                className="h-9"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="edit-email" className="text-sm font-medium">Correo Electrónico *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editDialog.formData.email}
                onChange={(e) =>
                  setEditDialog(prev => ({
                    ...prev,
                    formData: { ...prev.formData, email: e.target.value },
                  }))
                }
                disabled={editDialog.isSubmitting}
                placeholder="correo@ejemplo.com"
                className="h-9"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="edit-jobTitle" className="text-sm font-medium">Cargo</Label>
              <Input
                id="edit-jobTitle"
                value={editDialog.formData.jobTitle}
                onChange={(e) =>
                  setEditDialog(prev => ({
                    ...prev,
                    formData: { ...prev.formData, jobTitle: e.target.value },
                  }))
                }
                disabled={editDialog.isSubmitting}
                placeholder="Ingrese el cargo"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label htmlFor="edit-department" className="text-sm font-medium">Departamento</Label>
                <Select
                  value={editDialog.formData.department}
                  onValueChange={(value) =>
                    setEditDialog(prev => ({
                      ...prev,
                      formData: { ...prev.formData, department: value },
                    }))
                  }
                  disabled={editDialog.isSubmitting}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin departamento</SelectItem>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="edit-province" className="text-sm font-medium">Provincia</Label>
                <Select
                  value={editDialog.formData.province}
                  onValueChange={(value) =>
                    setEditDialog(prev => ({
                      ...prev,
                      formData: { ...prev.formData, province: value },
                    }))
                  }
                  disabled={editDialog.isSubmitting}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin provincia</SelectItem>
                    {provinceOptions.map((province) => (
                      <SelectItem key={province.value} value={province.value}>
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetEditDialogState}
              disabled={editDialog.isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmitEditDialog}
              disabled={editDialog.isSubmitting}
            >
              {editDialog.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={statusDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            resetStatusDialogState();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialogDescription}
              <br />
              <span className="font-medium text-dr-dark-gray">{statusDialogUserName}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {statusDialog.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{statusDialog.error}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusDialog.isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusDialog}
              disabled={statusDialog.isSubmitting}
              className={
                statusDialog.action === 'disable'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }
            >
              {statusDialog.isSubmitting
                ? 'Procesando...'
                : statusDialog.action === 'disable'
                  ? 'Suspender'
                  : 'Reactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
