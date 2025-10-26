import React, { useEffect, useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { DashboardLayout } from './components/DashboardLayout';
import { NotificationsProvider } from './context/NotificationsContext';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import {
  DashboardOverview,
  BeneficiariesPage,
  RequestsPage,
  ReportsPage,
} from './components/DashboardPages';
import { UsersManagementPage } from './components/UsersManagementPage';
import { SystemConfigPage } from './components/SystemConfigPage';
import {
  ApiError,
  AuthProfile,
  LoginResult,
  getCurrentUser,
  login as loginRequest,
  updateOwnPassword,
} from './services/api';

type RoleLevel = 'administrador' | 'manager' | 'analista';

interface Permissions {
  canCreateUsers: boolean;
  canApproveRequests: boolean;
  canReviewRequests: boolean;
  canViewReports: boolean;
  canManageBeneficiaries: boolean;
}

interface User {
  username: string;
  email?: string;
  name: string;
  role: string;
  roleLevel: RoleLevel;
  permissions: Permissions;
  rawProfile?: Record<string, unknown> | null;
  id?: string;
  jobTitle?: string | null;
  status?: number;
  departmentId?: string | null;
  departmentName?: string | null;
  provinceId?: string | null;
  provinceName?: string | null;
  profile?: AuthProfile | null;
}

const STATUS_FIELD_CANDIDATES = ['status', 'accountStatus', 'state', 'userStatus', 'currentStatus'];
const STATUS_KEYWORD_HINT = 'status';
const ACTIVE_KEYWORDS = ['activo', 'active', 'enabled', '1', 'true'];
const INACTIVE_KEYWORDS = ['inactivo', 'inactive', 'disabled', '0', 'false'];
const SUSPENDED_KEYWORDS = ['suspendido', 'suspendida', 'suspended', '2'];

const normalizeStatusValue = (value: unknown): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const normalized = trimmed.toLowerCase();

    if (SUSPENDED_KEYWORDS.includes(normalized)) {
      return 2;
    }
    if (ACTIVE_KEYWORDS.includes(normalized)) {
      return 1;
    }
    if (INACTIVE_KEYWORDS.includes(normalized)) {
      return 0;
    }

    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const extractStatusFromObject = (source?: Record<string, unknown> | null): number | undefined => {
  if (!source) {
    return undefined;
  }

  for (const candidate of STATUS_FIELD_CANDIDATES) {
    if (candidate in source) {
      const normalized = normalizeStatusValue(source[candidate]);
      if (normalized !== undefined) {
        return normalized;
      }
    }
  }

  for (const [key, rawValue] of Object.entries(source)) {
    if (key.toLowerCase().includes(STATUS_KEYWORD_HINT)) {
      const normalized = normalizeStatusValue(rawValue);
      if (normalized !== undefined) {
        return normalized;
      }
    }
  }

  return undefined;
};

const resolveUserStatus = (user?: User | null): number | undefined => {
  if (!user) {
    return undefined;
  }

  return (
    normalizeStatusValue(user.status) ??
    extractStatusFromObject(user.profile ? (user.profile as unknown as Record<string, unknown>) : null) ??
    extractStatusFromObject(user.rawProfile ?? null)
  );
};

const isSuspendedStatus = (value: unknown): boolean => normalizeStatusValue(value) === 2;

const ROLE_PERMISSIONS: Record<RoleLevel, Permissions> = {
  administrador: {
    canCreateUsers: true,
    canApproveRequests: true,
    canReviewRequests: true,
    canViewReports: true,
    canManageBeneficiaries: true,
  },
  manager: {
    canCreateUsers: false,
    canApproveRequests: true,
    canReviewRequests: true,
    canViewReports: true,
    canManageBeneficiaries: true,
  },
  analista: {
    canCreateUsers: false,
    canApproveRequests: false,
    canReviewRequests: true,
    canViewReports: false,
    canManageBeneficiaries: false,
  },
};

const ROLE_HINTS_ADMIN = ['admin', 'administrador', 'administrator', 'super admin'];
const ROLE_HINTS_MANAGER = ['manager', 'supervisor', 'coordinador', 'coordinator', 'lead', 'jefe', 'gerente'];

const STRING_CANDIDATES = {
  email: ['email', 'userEmail', 'preferred_username', 'upn', 'nameid', 'unique_name'],
  username: ['userName', 'username', 'user', 'email', 'preferred_username'],
  name: ['fullName', 'name', 'given_name', 'displayName'],
  role: ['role', 'roleName', 'roleKey', 'roleDescription', 'position', 'jobTitle'],
};

const USER_CONTAINER_KEYS = ['user', 'profile', 'admin', 'account'];

const NESTED_USER_KEYS = ['data', 'result', 'payload'];

const STORAGE_KEY = 'siuben_session';
const isBrowser = typeof window !== 'undefined';

const base64Decode = (value: string): string => {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(value);
  }

  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).atob === 'function') {
    return (globalThis as any).atob(value);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('utf-8');
  }

  throw new Error('Base64 decode no soportado en este entorno');
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = base64Decode(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const pickFirstString = (
  source: Record<string, unknown> | null | undefined,
  keys: string[],
  fuzzyKeyword?: string,
): string | undefined => {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  if (fuzzyKeyword) {
    const keyword = fuzzyKeyword.toLowerCase();
    for (const [candidateKey, candidateValue] of Object.entries(source)) {
      if (
        typeof candidateValue === 'string' &&
        candidateValue.trim().length > 0 &&
        candidateKey.toLowerCase().includes(keyword)
      ) {
        return candidateValue;
      }
    }
  }

  return undefined;
};

const locateUserObject = (raw: Record<string, unknown>): Record<string, unknown> | null => {
  for (const candidateKey of USER_CONTAINER_KEYS) {
    const candidate = raw[candidateKey];
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }
  }

  for (const nestedKey of NESTED_USER_KEYS) {
    const nested = raw[nestedKey];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      for (const candidateKey of USER_CONTAINER_KEYS) {
        const candidate = (nested as Record<string, unknown>)[candidateKey];
        if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
          return candidate as Record<string, unknown>;
        }
      }
    }
  }

  return null;
};

const determineRoleLevel = (role: string): RoleLevel => {
  if (!role) {
    return 'administrador';
  }

  const normalized = role.toLowerCase();
  if (['admin', 'administrator', 'administrador'].includes(normalized)) {
    return 'administrador';
  }
  if (['manager', 'supervisor', 'coordinador', 'coordinator'].includes(normalized)) {
    return 'manager';
  }
  if (['analyst', 'analista', 'operator', 'operador'].includes(normalized)) {
    return 'analista';
  }

  if (ROLE_HINTS_ADMIN.some((hint) => normalized.includes(hint))) {
    return 'administrador';
  }

  if (ROLE_HINTS_MANAGER.some((hint) => normalized.includes(hint))) {
    return 'manager';
  }

  return 'analista';
};

interface StoredSession {
  token: string;
  user: User;
  storedAt: number;
}

const getTokenExpiration = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp ?? payload?.expiresOn ?? payload?.expires;

  if (typeof exp === 'number') {
    return exp * 1000;
  }

  if (typeof exp === 'string') {
    const parsed = Number(exp);
    if (!Number.isNaN(parsed)) {
      // Algunos providers ya devuelven el epoch en milisegundos
      return parsed > 10_000_000_000 ? parsed : parsed * 1000;
    }
  }

  return null;
};

const isTokenValid = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true;
  }
  return expiration > Date.now();
};

const persistSession = (session: StoredSession) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('No se pudo guardar la sesión localmente:', error);
  }
};

const readSession = (): StoredSession | null => {
  if (!isBrowser) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token || !parsed?.user) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const clearSession = () => {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEY);
};

const buildUserFromSources = ({
  loginResult,
  profile,
  fallbackEmail,
  existingRawProfile,
}: {
  loginResult?: LoginResult;
  profile?: AuthProfile | null;
  fallbackEmail: string;
  existingRawProfile?: Record<string, unknown> | null;
}): User => {
  const rawFromLogin =
    loginResult
      ? locateUserObject(loginResult.raw) ?? decodeJwtPayload(loginResult.token)
      : null;

  const rawProfile =
    rawFromLogin ??
    existingRawProfile ??
    (profile ? (profile as Record<string, unknown>) : null);

  const profileRecord = profile ? (profile as unknown as Record<string, unknown>) : null;
  const status =
    normalizeStatusValue(profile?.status) ??
    extractStatusFromObject(profileRecord) ??
    extractStatusFromObject(rawProfile) ??
    (loginResult ? extractStatusFromObject(loginResult.raw) : undefined);

  const email =
    profile?.email ??
    pickFirstString(rawProfile, STRING_CANDIDATES.email, 'email') ??
    fallbackEmail;

  const username =
    profile?.email ??
    pickFirstString(rawProfile, STRING_CANDIDATES.username, 'name') ??
    email ??
    fallbackEmail;

  const name =
    profile?.displayName ??
    pickFirstString(rawProfile, STRING_CANDIDATES.name, 'name') ??
    username;

  const role =
    profile?.role ??
    pickFirstString(rawProfile, STRING_CANDIDATES.role, 'role') ??
    'Administrador';

  const roleLevel = determineRoleLevel(role);

  const departmentName =
    profile?.departmentName ??
    pickFirstString(rawProfile, ['departmentName', 'department'], 'department');

  const provinceName =
    profile?.provinceName ??
    pickFirstString(rawProfile, ['provinceName', 'province'], 'province');

  return {
    username,
    email,
    name,
    role,
    roleLevel,
    permissions: ROLE_PERMISSIONS[roleLevel],
    rawProfile,
    id: profile?.id ?? pickFirstString(rawProfile, ['id'], 'id'),
    jobTitle:
      (profile?.jobTitle ?? pickFirstString(rawProfile, ['jobTitle', 'position'], 'job')) ?? null,
    status,
    departmentId: profile?.departmentId ?? pickFirstString(rawProfile, ['departmentId'], 'department'),
    departmentName,
    provinceId: profile?.provinceId ?? pickFirstString(rawProfile, ['provinceId'], 'province'),
    provinceName,
    profile: profile ?? null,
  };
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (currentPage === 'users' && currentUser && !currentUser.permissions.canCreateUsers) {
      setCurrentPage('dashboard');
    }
  }, [currentPage, currentUser]);

  useEffect(() => {
    if (isAuthenticated || sessionChecked) {
      return;
    }

    const storedSession = readSession();
    if (!storedSession) {
      setSessionChecked(true);
      return;
    }

    if (!isTokenValid(storedSession.token)) {
      clearSession();
      setSessionChecked(true);
      return;
    }

    const storedStatus = resolveUserStatus(storedSession.user);
    if (isSuspendedStatus(storedStatus)) {
      clearSession();
      setLoginError('Su cuenta está suspendida. Comuníquese con el administrador del sistema.');
      setSessionChecked(true);
      return;
    }

    setAuthToken(storedSession.token);
    setCurrentUser(storedSession.user);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
    setLoginError('');
    setSessionChecked(true);

    (async () => {
      try {
        const profile = await getCurrentUser(storedSession.token);
        const updatedUser = buildUserFromSources({
          profile,
          fallbackEmail: storedSession.user.email ?? storedSession.user.username ?? '',
          existingRawProfile: storedSession.user.rawProfile ?? null,
        });
        const updatedStatus = resolveUserStatus(updatedUser);
        if (isSuspendedStatus(updatedStatus)) {
          clearSession();
          setIsAuthenticated(false);
          setCurrentUser(null);
          setAuthToken(null);
          setCurrentPage('dashboard');
          setLoginError('Su cuenta está suspendida. Comuníquese con el administrador del sistema.');
          return;
        }
        setCurrentUser(updatedUser);
        persistSession({
          token: storedSession.token,
          user: updatedUser,
          storedAt: Date.now(),
        });
      } catch (error) {
        console.warn('No se pudo actualizar el perfil almacenado.', error);
      }
    })();
  }, [isAuthenticated, sessionChecked]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const result = await loginRequest(email, password);
      let profile: AuthProfile | null = null;
      try {
        profile = await getCurrentUser(result.token);
      } catch (profileError) {
        console.warn('No se pudo obtener el perfil del usuario:', profileError);
      }
      const user = buildUserFromSources({
        loginResult: result,
        profile,
        fallbackEmail: email,
      });

      const statusValue = resolveUserStatus(user);
      if (isSuspendedStatus(statusValue)) {
        setLoginError('Su cuenta está suspendida. Comuníquese con el administrador del sistema.');
        return;
      }

      setAuthToken(result.token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      persistSession({
        token: result.token,
        user,
        storedAt: Date.now(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if ([400, 401, 403].includes(error.status ?? 0)) {
          setLoginError('Credenciales incorrectas. Verifique su correo y contraseña.');
        } else if (error.message && error.message.trim().length > 0) {
          setLoginError(error.message);
        } else {
          setLoginError('No se pudo completar el inicio de sesión. Intente nuevamente.');
        }
      } else if (error instanceof TypeError) {
        const message = error.message ?? '';
        if (/NetworkError/i.test(message) || /Failed to fetch/i.test(message)) {
          setLoginError('No fue posible contactar al servidor. Verifique su conexión e intente nuevamente.');
        } else {
          setLoginError('Ocurrió un error al iniciar sesión. Intente nuevamente.');
        }
      } else if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        setLoginError('No se pudo iniciar sesión. Intente nuevamente.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthToken(null);
    setCurrentPage('dashboard');
    setLoginError('');
    clearSession();
  };

  const handlePasswordChange = async ({
    username: _username,
    currentPassword,
    newPassword,
  }: {
    username: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!authToken) {
      return {
        success: false,
        error: 'La sesión expiró. Inicie nuevamente para actualizar su contraseña.',
      };
    }

    try {
      await updateOwnPassword(authToken, { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      console.error('Error actualizando contraseña del usuario', error);
      let message = 'No se pudo actualizar la contraseña. Intente nuevamente.';

      if (error instanceof ApiError) {
        if (error.status === 401) {
          handleLogout();
          message = 'La sesión expiró. Inicie nuevamente.';
        } else if (error.details && typeof error.details === 'object') {
          const details = error.details as Record<string, unknown>;
          const detailMessage =
            (typeof details.message === 'string' && details.message.trim()) ||
            (typeof details.error === 'string' && details.error.trim()) ||
            null;
          if (detailMessage) {
            message = detailMessage;
          } else if (error.message && error.message.trim().length > 0) {
            message = error.message.trim();
          }
        } else if (error.message && error.message.trim().length > 0) {
          message = error.message.trim();
        }
      } else if (error instanceof Error && error.message.trim().length > 0) {
        message = error.message.trim();
      }

      return { success: false, error: message };
    }
  };

  if (!isAuthenticated) {
    if (!sessionChecked) {
      return null;
    }
    return (
      <LoginForm
        onLogin={handleLogin}
        error={loginError}
        isLoading={isLoggingIn}
      />
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardOverview
            currentUser={currentUser}
            authToken={authToken}
            onNavigate={setCurrentPage}
          />
        );
      case 'users':
        if (!currentUser?.permissions.canCreateUsers) {
          return (
            <section className="flex flex-1 items-center justify-center">
              <div className="max-w-md text-center space-y-4 p-6 rounded-lg border border-amber-200 bg-amber-50 shadow-sm">
                <h2 className="text-xl font-semibold text-amber-800">
                  Acceso restringido
                </h2>
                <p className="text-sm text-amber-700">
                  Solo los administradores pueden gestionar usuarios del sistema.
                  Comuníquese con el área de TI si necesita permisos adicionales.
                </p>
              </div>
            </section>
          );
        }
        return (
          <UsersManagementPage
            currentUser={currentUser}
            authToken={authToken}
            onNavigate={setCurrentPage}
          />
        );
      case 'beneficiaries':
        return (
          <BeneficiariesPage
            currentUser={currentUser}
            authToken={authToken}
            onNavigate={setCurrentPage}
          />
        );
      case 'requests':
        return (
          <RequestsPage
            currentUser={currentUser}
            authToken={authToken}
            onNavigate={setCurrentPage}
          />
        );
      case 'reports':
        return (
          <ReportsPage
            currentUser={currentUser}
            authToken={authToken}
            onNavigate={setCurrentPage}
          />
        );
      case 'config':
        return (
          <SystemConfigPage
            currentUser={currentUser}
            authToken={authToken}
            onNavigate={setCurrentPage}
          />
        );
      default:
        return (
          <DashboardOverview
            currentUser={currentUser}
            authToken={authToken}
            onNavigate={setCurrentPage}
          />
        );
    }
  };

  return (
    <div className="dashboard-main-container">
      <TooltipProvider>
        <NotificationsProvider currentUser={currentUser} authToken={authToken}>
          <DashboardLayout
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onLogout={handleLogout}
            userName={currentUser?.name}
            userRole={currentUser?.role}
            userPermissions={currentUser?.permissions}
            currentUser={currentUser}
            authToken={authToken}
            onPasswordChange={handlePasswordChange}
          >
            {renderCurrentPage()}
          </DashboardLayout>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'white',
                color: 'var(--dr-dark-gray)',
                border: '1px solid #DEE2E6',
              },
            }}
          />
        </NotificationsProvider>
      </TooltipProvider>
    </div>
  );
}

export default App;
