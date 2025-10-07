import React, { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { DashboardLayout } from './components/DashboardLayout';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { 
  DashboardOverview,
  BeneficiariesPage,
  RequestsPage,
  ReportsPage
} from './components/DashboardPages';
import { UsersManagementPage } from './components/UsersManagementPage';
import { SystemConfigPage } from './components/SystemConfigPage';

interface User {
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
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Estado para manejar cambios de usuarios desde la gestión
  const [systemUsers, setSystemUsers] = useState(() => {
    // Inicializar usuarios del sistema que pueden cambiar
    return {
      'admin': { 
        password: 'admin123', 
        name: 'Dr. María Elena Santos', 
        role: 'Administrador General SIUBEN',
        roleLevel: 'administrador' as const,
        permissions: {
          canCreateUsers: true,
          canApproveRequests: true,
          canReviewRequests: true,
          canViewReports: true,
          canManageBeneficiaries: true,
        }
      },
      'administrador': { 
        password: 'siuben2025', 
        name: 'Lic. Carlos Rafael Peña', 
        role: 'Administrador del Sistema',
        roleLevel: 'administrador' as const,
        permissions: {
          canCreateUsers: true,
          canApproveRequests: true,
          canReviewRequests: true,
          canViewReports: true,
          canManageBeneficiaries: true,
        }
      },
      'manager': { 
        password: 'manager123', 
        name: 'Lic. Ana Patricia Jiménez', 
        role: 'Gerente de Operaciones',
        roleLevel: 'manager' as const,
        permissions: {
          canCreateUsers: false,
          canApproveRequests: true,
          canReviewRequests: true,
          canViewReports: true,
          canManageBeneficiaries: true,
        }
      },
      'supervisor': { 
        password: 'supervisor123', 
        name: 'Ing. Roberto Carlos Mendoza', 
        role: 'Supervisor Regional',
        roleLevel: 'manager' as const,
        permissions: {
          canCreateUsers: false,
          canApproveRequests: true,
          canReviewRequests: true,
          canViewReports: true,
          canManageBeneficiaries: true,
        }
      },
      'analista': { 
        password: 'analista123', 
        name: 'Lic. Esperanza María Rodríguez', 
        role: 'Analista de Solicitudes',
        roleLevel: 'analista' as const,
        permissions: {
          canCreateUsers: false,
          canApproveRequests: false,
          canReviewRequests: true,
          canViewReports: false,
          canManageBeneficiaries: false,
        }
      },
      'operador': { 
        password: 'operador123', 
        name: 'Lic. Juan Miguel Valdez', 
        role: 'Analista Regional',
        roleLevel: 'analista' as const,
        permissions: {
          canCreateUsers: false,
          canApproveRequests: false,
          canReviewRequests: true,
          canViewReports: false,
          canManageBeneficiaries: false,
        }
      }
    };
  });

  // Función para actualizar un usuario del sistema
  const updateSystemUser = (username: string, updates: Partial<typeof systemUsers[keyof typeof systemUsers]>) => {
    setSystemUsers(prev => ({
      ...prev,
      [username]: {
        ...prev[username as keyof typeof prev],
        ...updates
      }
    }));

    // Si el usuario actualizado es el actual, actualizar la sesión
    if (currentUser && currentUser.username === username) {
      setCurrentUser(prevUser => ({
        ...prevUser!,
        ...updates
      }));
    }
  };

  // Función para obtener permisos basados en el roleLevel
  const getPermissionsByRole = (roleLevel: 'administrador' | 'manager' | 'analista') => {
    switch (roleLevel) {
      case 'administrador':
        return {
          canCreateUsers: true,
          canApproveRequests: true,
          canReviewRequests: true,
          canViewReports: true,
          canManageBeneficiaries: true,
        };
      case 'manager':
        return {
          canCreateUsers: false,
          canApproveRequests: true,
          canReviewRequests: true,
          canViewReports: true,
          canManageBeneficiaries: true,
        };
      case 'analista':
        return {
          canCreateUsers: false,
          canApproveRequests: false,
          canReviewRequests: true,
          canViewReports: false,
          canManageBeneficiaries: false,
        };
      default:
        return {
          canCreateUsers: false,
          canApproveRequests: false,
          canReviewRequests: false,
          canViewReports: false,
          canManageBeneficiaries: false,
        };
    }
  };

  // Función para validar contraseña actual
  const handleValidateCurrentPassword = async (username: string, currentPassword: string): Promise<boolean> => {
    try {
      const userData = systemUsers[username as keyof typeof systemUsers];
      return userData ? userData.password === currentPassword : false;
    } catch (error) {
      console.error('Error al validar contraseña:', error);
      return false;
    }
  };

  // Función para cambiar contraseña del usuario actual
  const handlePasswordChange = async (username: string, newPassword: string): Promise<boolean> => {
    try {
      // Verificar que el usuario existe en el sistema
      if (!systemUsers[username as keyof typeof systemUsers]) {
        return false;
      }

      // Actualizar la contraseña en el sistema
      setSystemUsers(prev => ({
        ...prev,
        [username]: {
          ...prev[username as keyof typeof prev],
          password: newPassword
        }
      }));

      // Si es el usuario actual, mantener la sesión activa
      if (currentUser && currentUser.username === username) {
        // La sesión permanece activa, no es necesario hacer logout
        console.log(`Contraseña actualizada para el usuario: ${username}`);
      }

      return true;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      return false;
    }
  };

  // Mock authentication for SIUBEN system with role-based access
  const handleLogin = async (username: string, password: string) => {
    setIsLoggingIn(true);
    setLoginError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Usar systemUsers en lugar de usuarios hardcodeados
    const userData = systemUsers[username as keyof typeof systemUsers];
    
    if (userData && userData.password === password) {
      setCurrentUser({
        username: username,
        name: userData.name,
        role: userData.role,
        roleLevel: userData.roleLevel,
        permissions: userData.permissions
      });
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    } else {
      setLoginError('Usuario o contraseña incorrectos. Verifique sus credenciales.');
    }

    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setLoginError('');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview currentUser={currentUser} />;
      case 'users':
        return <UsersManagementPage 
          currentUser={currentUser} 
          onUpdateUser={updateSystemUser}
          getPermissionsByRole={getPermissionsByRole}
        />;
      case 'beneficiaries':
        return <BeneficiariesPage currentUser={currentUser} />;
      case 'requests':
        return <RequestsPage currentUser={currentUser} />;
      case 'reports':
        return <ReportsPage currentUser={currentUser} />;
      case 'config':
        return <SystemConfigPage currentUser={currentUser} />;
      default:
        return <DashboardOverview currentUser={currentUser} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginForm
        onLogin={handleLogin}
        error={loginError}
        isLoading={isLoggingIn}
      />
    );
  }

  return (
    <div className="dashboard-main-container">
      <TooltipProvider>
        <DashboardLayout
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onLogout={handleLogout}
          userName={currentUser?.name}
          userRole={currentUser?.role}
          userPermissions={currentUser?.permissions}
          currentUser={currentUser}
          onPasswordChange={handlePasswordChange}
          onValidateCurrentPassword={handleValidateCurrentPassword}
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
      </TooltipProvider>
    </div>
  );
}

export default App;