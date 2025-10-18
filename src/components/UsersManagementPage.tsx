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
import { toast } from 'sonner@2.0.3';
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
  updateUserRole,
} from '../services/api';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface CurrentUser {
  username: string;
  name: string;
  role: string;
  roleLevel: 'administrador' | 'manager' | 'analista';
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

const resolveStatusDescriptor = (
  status: AdminUserDto['status'],
): { label: string; className: string } => {
  if (status === null || status === undefined) {
    return { label: 'Desconocido', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  }

  if (typeof status === 'number') {
    switch (status) {
      case 1:
        return { label: 'Activo', className: 'bg-green-100 text-green-800 border-green-200' };
      case 0:
        return { label: 'Inactivo', className: 'bg-red-100 text-red-800 border-red-200' };
      case 2:
        return { label: 'Suspendido', className: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: `Estado ${status}`, className: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  }

  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (['active', 'activo', '1'].includes(normalized)) {
      return { label: 'Activo', className: 'bg-green-100 text-green-800 border-green-200' };
    }
    if (['inactive', 'inactivo', '0'].includes(normalized)) {
      return { label: 'Inactivo', className: 'bg-red-100 text-red-800 border-red-200' };
    }
    if (['suspended', 'suspendido', '2'].includes(normalized)) {
      return { label: 'Suspendido', className: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (['pending', 'pendiente'].includes(normalized)) {
      return { label: 'Pendiente', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
  }

  return { label: 'Desconocido', className: 'bg-gray-100 text-gray-700 border-gray-200' };
};

const isActiveStatus = (status: AdminUserDto['status']): boolean => {
  if (typeof status === 'number') {
    return status === 1;
  }
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    return ['1', 'active', 'activo', 'enabled', 'true'].includes(normalized);
  }
  return false;
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
      return value;
    }
  }
  if (typeof item.name === 'string' && item.name.trim()) {
    return item.name;
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
      setNewUser((prev) => ({ ...prev, role: roleOptions[0].value }));
    }
  }, [roleOptions, newUser.role]);

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
      });

      toast.success('Usuario creado exitosamente.');
      setIsCreateDialogOpen(false);
      setNewUser(INITIAL_FORM_STATE);
      await loadUsers();
    } catch (err) {
      console.error('Error creando usuario', err);
      let message = 'No se pudo crear el usuario. Inténtelo nuevamente.';

      const normalizeMessage = (raw: string) =>
        raw.includes('Passwords must') ? formatPasswordRuleMessage(raw) : raw;

      if (err instanceof ApiError) {
        const details = err.details;
        if (details && typeof details === 'object') {
          if (
            'error' in details &&
            typeof (details as Record<string, unknown>).error === 'string' &&
            (details as Record<string, unknown>).error.trim().length > 0
          ) {
            const raw = ((details as Record<string, unknown>).error as string).trim();
            message = normalizeMessage(raw);
          } else if (
            'message' in details &&
            typeof (details as Record<string, unknown>).message === 'string' &&
            (details as Record<string, unknown>).message.trim().length > 0
          ) {
            const raw = ((details as Record<string, unknown>).message as string).trim();
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
    ? resolveString(roleDialog.user, ['fullName', 'name'], '—')
    : '—';
  const roleDialogUserEmail = roleDialog.user
    ? resolveString(roleDialog.user, ['email', 'userName', 'username'], '')
    : '';
  const passwordDialogUserName = passwordDialog.user
    ? resolveString(passwordDialog.user, ['fullName', 'name'], '—')
    : '—';
  const passwordDialogUserEmail = passwordDialog.user
    ? resolveString(passwordDialog.user, ['email', 'userName', 'username'], '')
    : '';
  const statusDialogTitle =
    statusDialog.action === 'disable' ? 'Suspender usuario' : 'Reactivar usuario';
  const statusDialogDescription =
    statusDialog.action === 'disable'
      ? 'El usuario perderá acceso inmediato al backoffice.'
      : 'El usuario podrá acceder nuevamente al backoffice.';
  const statusDialogUserName = statusDialog.user
    ? resolveString(statusDialog.user, ['fullName', 'name', 'userName', 'username'], 'usuario seleccionado')
    : 'usuario seleccionado';

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

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl text-dr-dark-gray">Gestión de usuarios</CardTitle>
            <CardDescription>
              Consulta los usuarios registrados en el backoffice y crea nuevos perfiles administrativos.
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear nuevo usuario</DialogTitle>
                  <DialogDescription>
                    Complete la información solicitada para agregar un nuevo usuario al sistema SIUBEN.
                  </DialogDescription>
                </DialogHeader>

                {referencesReady ? (
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
                            setNewUser((prev) => ({ ...prev, role: value }))
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
                          onChange={(event) =>
                            setNewUser((prev) => ({ ...prev, role: event.target.value }))
                          }
                          required
                        />
                      )}
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

                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancelar
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
                {isLoadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-gray-500">
                      Cargando usuarios...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-gray-500">
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const fullName = resolveString(user, ['fullName', 'name']);
                    const email = resolveString(user, ['email', 'userName', 'username'], 'Sin correo');
                    const role = resolveString(user, ['role', 'roleName', 'roleKey', 'roleDescription']);
                    const department = resolveString(user, ['departmentName', 'department', 'departmentTitle']);
                    const province = resolveString(user, ['provinceName', 'province', 'provinceTitle']);
                    const statusInfo = resolveStatusDescriptor(user.status);
                    const createdAt = resolveString(user, ['createdAt', 'createdDate'], '');
                    const lastLogin = resolveString(user, ['lastLoginAt', 'lastLogin'], '');
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
                            <span className="font-medium text-dr-dark-gray">{fullName}</span>
                            <span className="text-xs text-gray-500">
                              {resolveString(user, ['jobTitle', 'position'], '')}
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
                          {formatDateTime(lastLogin)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 text-dr-blue hover:bg-dr-blue/10"
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
                                  className="h-9 w-9 p-0 text-amber-600 hover:bg-amber-50"
                                  onClick={() => handleOpenRoleDialog(user)}
                                  aria-label="Actualizar rol"
                                  disabled={roleChangeDisabled}
                                >
                                  <Pencil className="h-4 w-4" />
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
                  })
                )}
              </TableBody>
            </Table>
          </div>
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalle del usuario</DialogTitle>
            <DialogDescription>
              Consulta la información completa del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>

          {viewDialog.isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-dr-blue/30 border-t-dr-blue" />
              <p className="text-sm text-gray-500">Cargando información...</p>
            </div>
          )}

          {!viewDialog.isLoading && viewDialogUser && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-gray-500">Nombre</p>
                <p className="text-sm font-medium text-dr-dark-gray">
                  {resolveString(viewDialogUser, ['fullName', 'name'], '—')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Usuario</p>
                <p className="text-sm text-gray-700">
                  {resolveString(viewDialogUser, ['userName', 'username'], '—')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Correo</p>
                <p className="text-sm text-gray-700">
                  {resolveString(viewDialogUser, ['email'], '—')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Rol</p>
                <p className="text-sm text-gray-700">
                  {resolveString(viewDialogUser, ['role', 'roleName'], '—')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Departamento</p>
                <p className="text-sm text-gray-700">
                  {resolveString(viewDialogUser, ['departmentName', 'department'], '—')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Provincia</p>
                <p className="text-sm text-gray-700">
                  {resolveString(viewDialogUser, ['provinceName', 'province'], '—')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Estado</p>
                <p className="text-sm text-gray-700">
                  {viewDialogStatusInfo ? (
                    <Badge className={viewDialogStatusInfo.className}>
                      {viewDialogStatusInfo.label}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Creado</p>
                <p className="text-sm text-gray-700">
                  {formatDateTime(resolveString(viewDialogUser, ['createdAt', 'createdDate'], ''))}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Último acceso</p>
                <p className="text-sm text-gray-700">
                  {formatDateTime(resolveString(viewDialogUser, ['lastLoginAt', 'lastLogin'], ''))}
                </p>
              </div>
            </div>
          )}

          {!viewDialog.isLoading && !viewDialogUser && (
            <p className="text-sm text-gray-500">No se encontraron datos para este usuario.</p>
          )}

          {viewDialog.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{viewDialog.error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={resetViewDialogState}>
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
