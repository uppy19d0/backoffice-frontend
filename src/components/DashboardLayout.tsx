import React, { useCallback, useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Users,
  Settings,
  LogOut,
  Home,
  FileText,
  Bell,
  BellRing,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Calendar,
  TrendingUp,
  UserPlus,
  UserCheck,
  UserMinus,
  ChevronRight,
  Key,
  User,
  Loader2,
} from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";
import governmentLogo from "../assets/Logo-Siuben.png";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { useNotifications, DashboardNotification, NotificationPriority } from "../context/NotificationsContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userPermissions?: {
    canCreateUsers: boolean;
    canApproveRequests: boolean;
    canReviewRequests: boolean;
    canViewReports: boolean;
    canManageBeneficiaries: boolean;
  };
  currentUser?: {
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
  };
  onPasswordChange?: (payload: {
    username: string;
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onValidateCurrentPassword?: (username: string, currentPassword: string) => Promise<boolean>;
  authToken?: string | null;
  forcePasswordChange?: boolean;
}

const getNavigationItems = (permissions?: {
  canCreateUsers: boolean;
  canApproveRequests: boolean;
  canReviewRequests: boolean;
  canViewReports: boolean;
  canManageBeneficiaries: boolean;
}) => {
  const items = [
    { 
      id: "dashboard", 
      label: "Panel Principal", 
      icon: Home, 
      permission: null,
      description: "Vista general del sistema"
    },
    { 
      id: "users", 
      label: "Usuarios", 
      icon: Users, 
      permission: "canCreateUsers",
      description: "Gestión de usuarios del sistema"
    },
    { 
      id: "beneficiaries", 
      label: "Beneficiarios", 
      icon: UserCheck, 
      permission: "canManageBeneficiaries",
      description: "Gestión de beneficiarios"
    },
    { 
      id: "requests", 
      label: "Solicitudes", 
      icon: ClipboardList, 
      permission: "canReviewRequests",
      description: "Revisión de solicitudes"
    },
    { 
      id: "reports", 
      label: "Reportes", 
      icon: FileText, 
      permission: "canViewReports",
      description: "Informes y estadísticas"
    },
    { 
      id: "config", 
      label: "Configuraciones", 
      icon: Settings, 
      permission: "canCreateUsers",
      description: "Logs y configuración del sistema"
    },
  ];

  if (!permissions) {
    return items.filter(item => item.permission === null);
  }

  return items.filter((item) => {
    if (!item.permission) {
      return true;
    }

    return permissions[item.permission as keyof typeof permissions];
  });
};

const notificationPriorityStyles: Record<
  NotificationPriority,
  { color: string; bg: string }
> = {
  high: { color: 'text-red-600', bg: 'bg-red-50' },
  medium: { color: 'text-blue-600', bg: 'bg-blue-50' },
  low: { color: 'text-green-600', bg: 'bg-green-50' },
};

const notificationTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  alert: AlertCircle,
  system: Info,
  request: ClipboardList,
  'request-assignment': UserPlus,
  'request-unassigned': UserMinus,
  assignment: UserPlus,
  approval: CheckCircle,
  general: Bell,
};

const getNotificationVisuals = (notification: DashboardNotification) => {
  const base =
    notificationPriorityStyles[notification.priority] ?? notificationPriorityStyles.medium;
  const Icon =
    notificationTypeIcons[notification.type] ??
    (notification.priority === 'high' ? AlertCircle : Bell);

  return {
    icon: Icon,
    color: base.color,
    bg: base.bg,
  };
};

export function DashboardLayout({
  children,
  currentPage,
  onPageChange,
  onLogout,
  userName = "Usuario Administrador",
  userRole = "Administrador",
  userPermissions,
  currentUser,
  onPasswordChange,
  onValidateCurrentPassword,
  authToken,
  forcePasswordChange = false,
}: DashboardLayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const isMobile = useIsMobile();
  const canChangePassword = Boolean(onPasswordChange && currentUser);

  const {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    error: notificationsError,
    refresh: refreshNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
  } = useNotifications();

  const openChangePasswordModal = () => {
    if (canChangePassword) {
      setShowChangePasswordModal(true);
    }
  };

  useEffect(() => {
    if (forcePasswordChange && canChangePassword) {
      setShowChangePasswordModal(true);
    }
  }, [forcePasswordChange, canChangePassword]);

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev;
      if (next) {
        void refreshNotifications({ showErrors: true });
      }
      return next;
    });
  };

  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) {
      return 'Hace instantes';
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMinutes < 1) return 'Hace instantes';
    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min${diffMinutes !== 1 ? 's' : ''}`;
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
      return `Hace ${diffHours} h${diffHours !== 1 ? 's' : ''}`;
    }

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    }

    return date.toLocaleString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navigationItems = getNavigationItems(userPermissions);

  const goToNotificationsPage = useCallback(() => {
    setShowNotifications(false);
    void refreshNotifications({ showErrors: true });
    onPageChange('notifications');
  }, [onPageChange, refreshNotifications]);

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find((item) => item.id === currentPage);
    return currentItem?.label || "Panel Principal";
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="main-layout-container flex h-screen w-full bg-dr-light-gray overflow-hidden">
        {/* Sidebar SIUBEN - Auto Layout Vertical Completo */}
        <Sidebar 
          className="siuben-sidebar border-r border-dr-blue/15 shadow-2xl h-full"
          collapsible="icon"
          variant="inset"
          style={{
            '--sidebar-width': '280px',
            '--sidebar-width-mobile': '280px',
            '--sidebar-width-icon': '60px'
          } as React.CSSProperties}
        >
          {/* Header Institucional Oficial - Flex Shrink 0 */}
          <SidebarHeader className="bg-gradient-to-b from-dr-blue via-dr-blue to-dr-blue-dark p-6 group-data-[collapsible=icon]:p-4 relative overflow-hidden flex-shrink-0">
            {/* Patrón de textura gubernamental sutil */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-black/12 pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1)_0%,transparent_50%)] pointer-events-none"></div>
            </div>
            
            <div className="relative flex flex-col items-center gap-4 group-data-[collapsible=icon]:gap-3">
              {/* Logo Container Premium Mejorado */}
              <div className="logo-container-premium relative group-data-[collapsible=icon]:scale-90 transition-all duration-300">
                {/* Anillo exterior con brillo */}
                <div className="absolute -inset-1 bg-gradient-to-r from-white/30 via-white/10 to-white/30 rounded-2xl blur-sm group-data-[collapsible=icon]:rounded-xl"></div>
                
                {/* Contenedor principal del logo */}
                <div className="relative bg-gradient-to-br from-white via-white to-gray-50/95 p-4 group-data-[collapsible=icon]:p-2 rounded-2xl group-data-[collapsible=icon]:rounded-xl shadow-2xl border-2 border-white/40 backdrop-blur-sm group-data-[collapsible=icon]:scale-90">
                  {/* Efecto de cristal interno */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl group-data-[collapsible=icon]:rounded-xl pointer-events-none"></div>
                  
                  {/* Logo optimizado */}
                  <div className="relative flex items-center justify-center">
                    <img
                      src={governmentLogo}
                      alt="SIUBEN - Sistema Único de Beneficiarios República Dominicana"
                      className="h-20 w-auto max-w-none transition-all duration-300 filter drop-shadow-md group-data-[collapsible=icon]:h-10"
                      style={{
                        imageRendering: 'crisp-edges',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                      }}
                    />
                  </div>
                  
                  {/* Reflejo sutil en la parte inferior */}
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>
                
                {/* Sombra proyectada realista */}
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-full h-full bg-black/10 rounded-2xl group-data-[collapsible=icon]:rounded-xl blur-lg -z-10"></div>
              </div>
              
              {/* Información Institucional Oficial Mejorada */}
              <div className="text-center space-y-2 group-data-[collapsible=icon]:hidden transform group-data-[collapsible=icon]:scale-0 transition-all duration-300">
                <div className="space-y-1.5">
                  <h1 className="text-white font-gotham font-bold text-xl tracking-wide drop-shadow-lg">
                    SIUBEN
                  </h1>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-px bg-white/60"></div>
                    <p className="text-white/95 text-xs font-gotham font-bold uppercase tracking-widest px-2 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                      República Dominicana
                    </p>
                    <div className="w-3 h-px bg-white/60"></div>
                  </div>
                </div>
                
                {/* Separador decorativo */}
                <div className="flex items-center justify-center py-2">
                  <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-white/90 text-sm font-arial-rounded font-semibold">
                    Panel Administrativo
                  </p>
                  <p className="text-white/70 text-xs font-arial-rounded">
                    Sistema Gubernamental Oficial
                  </p>
                </div>
              </div>

              <div className="hidden flex-col items-center text-center text-white group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:gap-1">
                <p className="text-sm font-gotham font-bold tracking-wide leading-none">SIUBEN</p>
                <span className="rounded-full bg-white/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/80">
                  RD
                </span>
              </div>
            </div>
          </SidebarHeader>

          {/* Contenido de Navegación - Auto Layout Vertical */}
          <SidebarContent className="flex-1 flex flex-col min-h-0 px-2 py-4 group-data-[collapsible=icon]:px-1">
            <SidebarGroup className="flex-1 flex flex-col min-h-0">
              {/* Contenedor con scroll automático */}
              <div className="navigation-container flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dr-blue/20 hover:scrollbar-thumb-dr-blue/30">
                <SidebarMenu className="space-y-1.5 pb-4">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    const isDisabled =
                      item.permission !== null &&
                      userPermissions &&
                      !userPermissions[item.permission as keyof typeof userPermissions];
                    const isNotificationsItem = item.id === "notifications";

                    if (isNotificationsItem) {
                      const hasUnread = unreadCount > 0;
                      const notificationCountLabel = hasUnread
                        ? unreadCount > 99
                          ? '99+'
                          : unreadCount
                        : '0';
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            onClick={() => {
                              if (isDisabled) return;
                              onPageChange(item.id);
                            }}
                            isActive={isActive}
                            tooltip={item.label}
                            disabled={isDisabled}
                            className={`
                              notification-nav-button group relative w-full flex-col items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-300
                              group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2
                              ${
                                isActive
                                  ? "bg-gradient-to-r from-dr-blue/15 via-white to-white text-dr-dark-gray shadow-lg border-dr-blue/30"
                                  : "bg-white/85 border-slate-200 text-dr-dark-gray hover:border-dr-blue/20 hover:bg-white shadow-sm"
                              }
                              ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}
                            `}
                          >
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-dr-blue/10 via-transparent to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-data-[collapsible=icon]:hidden" />
                            <div className="relative hidden w-full flex-col items-center gap-2 group-data-[collapsible=icon]:flex">
                              <div
                                className={`relative rounded-2xl border p-2 ${
                                  hasUnread
                                    ? "border-dr-blue/40 bg-dr-blue text-white shadow-lg shadow-dr-blue/30"
                                    : "border-slate-200 bg-white text-slate-500"
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                                {hasUnread && (
                                  <>
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-dr-red text-[10px] font-bold text-white shadow-sm">
                                      {notificationCountLabel}
                                    </span>
                                    <span className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full bg-dr-red/60" />
                                  </>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                {item.label}
                              </span>
                            </div>
                            <div className="relative flex w-full items-center gap-3 group-data-[collapsible=icon]:hidden">
                              <div
                                className={`relative rounded-2xl border p-3 shadow-inner ${
                                  hasUnread
                                    ? "border-dr-blue/30 bg-dr-blue/10 text-dr-blue"
                                    : "border-slate-200 bg-white text-slate-500"
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                                {hasUnread && (
                                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-dr-red px-1 text-[11px] font-semibold text-white shadow-sm">
                                    {notificationCountLabel}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-dr-dark-gray leading-tight">
                                  Centro de alertas
                                </p>
                                <p className="text-xs text-slate-500">
                                  {hasUnread ? `${notificationCountLabel} pendientes` : "Todo al día"}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                    hasUnread ? "bg-dr-blue text-white" : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {hasUnread ? "Ver alertas" : "Al día"}
                                </span>
                              </div>
                            </div>
                            {isActive && (
                              <div className="relative z-10 rounded-xl border border-dr-blue/20 bg-dr-blue/10 px-3 py-1 text-[11px] font-semibold text-dr-blue shadow-sm group-data-[collapsible=icon]:hidden">
                                Activo
                              </div>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => {
                            if (isDisabled) return;
                            onPageChange(item.id);
                          }}
                          isActive={isActive}
                          tooltip={item.label}
                          className={`
                            siuben-nav-item group w-full justify-start rounded-xl px-3 py-3 transition-all duration-200 
                            group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2
                            min-h-[44px] relative overflow-hidden
                            ${
                              isActive
                                ? "siuben-nav-item--active bg-gradient-to-r from-gray-100/80 via-gray-50/60 to-white/40 text-dr-dark-gray font-gotham font-bold border-r-3 border-gray-400 shadow-sm"
                                : `text-dr-dark-gray ${
                                    isDisabled
                                      ? "opacity-60 cursor-not-allowed"
                                      : "hover:bg-gradient-to-r hover:from-gray-50/60 hover:to-white/40 hover:text-dr-dark-gray"
                                  } font-gotham font-medium ${isDisabled ? "" : "hover:shadow-sm"}`
                            }
                          `}
                          disabled={isDisabled}
                        >
                          {/* Efecto de overlay sutil en hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                          
                          <Icon
                            className={`relative z-10 h-5 w-5 transition-all duration-200 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5 ${
                              isActive 
                                ? "text-dr-dark-gray drop-shadow-sm" 
                                : "text-gray-600 group-hover:text-dr-dark-gray group-hover:scale-105"
                            }`}
                          />
                          <span className="relative z-10 font-gotham group-data-[collapsible=icon]:hidden">
                            {item.label}
                          </span>
                          <span className="relative z-10 hidden w-full text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 group-data-[collapsible=icon]:block">
                            {item.label}
                          </span>
                          
                          {isActive && (
                            <div className="relative z-10 ml-auto group-data-[collapsible=icon]:hidden">
                              <span className="inline-flex items-center rounded-full bg-dr-blue/10 px-3 py-1 text-[11px] font-semibold text-dr-blue shadow-sm">
                                Activo
                              </span>
                            </div>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer del Usuario - Flex Shrink 0 */}
          <SidebarFooter className="border-t border-dr-blue/15 bg-gradient-to-t from-gray-50/50 to-transparent p-3 group-data-[collapsible=icon]:p-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full p-0 h-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-dr-blue focus-visible:ring-offset-2 rounded-xl">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/80 hover:border-dr-blue/40 hover:bg-dr-blue/5 hover:shadow-lg transition-all duration-200 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2.5">
                    <div className="relative">
                      <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 ring-2 ring-white shadow-md">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="bg-gradient-to-br from-dr-blue to-dr-blue-dark text-white text-xs font-gotham font-bold">
                          {userName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2) || "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left group-data-[collapsible=icon]:hidden">
                      <p className="text-sm font-gotham font-bold text-dr-dark-gray truncate">
                        {userName || "Usuario"}
                      </p>
                      <p className="text-xs text-gray-600 truncate font-arial-rounded font-medium">
                        {userRole || "Administrador"}
                      </p>
                    </div>

                    <div className="group-data-[collapsible=icon]:hidden">
                      <Settings className="h-4 w-4 text-gray-400 group-hover:text-dr-blue transition-colors duration-200" />
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 shadow-xl border-dr-blue/10" align="end" side="right">
                <DropdownMenuLabel className="font-arial-rounded bg-gradient-to-r from-dr-blue/5 to-transparent p-4 border-b border-gray-100">
                  <div className="flex flex-col space-y-1.5">
                    <p className="text-sm font-gotham font-bold text-dr-dark-gray leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground font-arial-rounded font-medium">
                      {userRole}
                    </p>
                    {currentUser && (
                      <p className="text-xs leading-none text-dr-blue font-arial-rounded font-semibold">
                        @{currentUser.username}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canChangePassword && (
                  <>
                    <DropdownMenuItem 
                      onClick={openChangePasswordModal}
                      className="cursor-pointer font-arial-rounded p-3 focus:bg-blue-50 hover:bg-blue-50 group"
                    >
                      <Key className="mr-3 h-4 w-4 text-dr-blue group-hover:scale-105 transition-transform" />
                      <span className="text-dr-blue font-semibold">Cambiar Contraseña</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={goToNotificationsPage}
                  className="cursor-pointer font-arial-rounded p-3 focus:bg-blue-50 hover:bg-blue-50 group"
                >
                  <Bell className="mr-3 h-4 w-4 text-dr-blue group-hover:scale-105 transition-transform" />
                  <span className="text-dr-blue font-semibold">Centro de notificaciones</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="cursor-pointer text-dr-red focus:text-dr-red focus:bg-red-50 hover:bg-red-50 font-arial-rounded p-3 group"
                >
                  <LogOut className="mr-3 h-4 w-4 group-hover:scale-105 transition-transform" />
                  <span className="font-semibold">Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-w-0 w-full h-full">
          {/* Header Principal */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center bg-white border-b border-gray-200 px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-4 w-full">
              <SidebarTrigger className="text-dr-dark-gray hover:bg-gray-100 rounded-md p-2 transition-colors" />
              <div className="h-4 w-px bg-gray-300" />
              
              {/* Título de la Página */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-gotham font-bold text-dr-dark-gray">
                  {getCurrentPageTitle()}
                </h2>
                <p className="text-sm text-gray-600 font-arial-rounded hidden sm:block">
                  Sistema Único de Beneficiarios - República Dominicana
                </p>
              </div>
              
              {/* Acciones del Header */}
              <div className="flex items-center gap-3">
                {/* Notificaciones */}
                <div className="relative">
                  <button
                    className="relative text-dr-dark-gray hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-lg p-2.5 transition-all duration-300 group"
                    onClick={handleToggleNotifications}
                    aria-label="Notificaciones"
                  >
                    {unreadCount > 0 ? (
                      <BellRing className="h-5 w-5 text-indigo-600 animate-pulse" />
                    ) : (
                      <Bell className="h-5 w-5 group-hover:text-indigo-600 transition-colors" />
                    )}
                    {unreadCount > 0 && (
                      <div className="absolute -top-0.5 -right-0.5">
                        {/* Animación de ping sutil */}
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>

                        {/* Contador principal */}
                        <span className="relative inline-flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-lg border border-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Panel de Notificaciones */}
                  {showNotifications && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowNotifications(false)}
                      />

                      {/* Panel de Notificaciones */}
                      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <h3 className="font-semibold text-gray-900">
                                Notificaciones
                              </h3>
                              {unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[22px] h-5 bg-red-500 text-white text-[11px] font-bold rounded-full px-1.5 shadow-sm">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                            </div>
                            {unreadCount > 0 && (
                              <button
                                onClick={() => {
                                  void markAllNotificationsAsRead();
                                }}
                                disabled={isLoadingNotifications}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Marcar todas como leídas
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Lista de Notificaciones */}
                        {notificationsError && (
                          <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100 font-arial-rounded text-left">
                            {notificationsError}
                          </div>
                        )}
                        <div className="max-h-80 overflow-y-auto">
                          <div className="p-2">
                            {isLoadingNotifications ? (
                              <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <p className="text-sm font-arial-rounded">Cargando notificaciones...</p>
                              </div>
                            ) : notifications.length === 0 ? (
                              <div className="text-center py-12 text-gray-500">
                                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-gotham font-semibold">No hay notificaciones</p>
                                <p className="text-sm font-arial-rounded">Todas las notificaciones aparecerán aquí</p>
                              </div>
                            ) : (
                              notifications.map((notification) => {
                                const visuals = getNotificationVisuals(notification);
                                const Icon = visuals.icon;
                                return (
                                  <div
                                    key={notification.id}
                                    className={`
                                      relative p-3.5 rounded-lg mb-2 cursor-pointer transition-all duration-200 border
                                      ${
                                        notification.read
                                          ? "bg-white hover:bg-gray-50 border-gray-200"
                                          : "bg-blue-50 hover:bg-blue-100 border-blue-200 shadow-sm"
                                      }
                                    `}
                                    onClick={() => {
                                      void markNotificationAsRead(notification.id);
                                    }}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* Icono */}
                                      <div
                                        className={`${visuals.bg} p-2 rounded-lg flex-shrink-0`}
                                      >
                                        <Icon
                                          className={`h-4 w-4 ${visuals.color}`}
                                        />
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        {/* Título */}
                                        <div className="flex items-center gap-2 mb-1">
                                          <p
                                            className={`text-sm text-gray-900 ${
                                              !notification.read ? "font-semibold" : "font-normal"
                                            }`}
                                          >
                                            {notification.title}
                                          </p>
                                          {!notification.read && (
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                          )}
                                        </div>

                                        {/* Mensaje */}
                                        <p className={`text-xs mb-1.5 line-clamp-2 ${
                                          notification.read ? 'text-gray-500' : 'text-gray-600'
                                        }`}>
                                          {notification.message}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <Clock className="h-3 w-3" />
                                          <span>{getRelativeTime(notification.createdAt)}</span>
                                          {notification.priority === "high" && (
                                            <>
                                              <span className="text-gray-400">•</span>
                                              <span className="text-red-600 font-medium">Urgente</span>
                                            </>
                                          )}
                                          {notification.priority === "medium" && (
                                            <>
                                              <span className="text-gray-400">•</span>
                                              <span className="text-blue-600 font-medium">Importante</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                          <button
                            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors text-center"
                            onClick={goToNotificationsPage}
                          >
                            Ver todas las notificaciones
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Botón de Cambiar Contraseña - Mobile Only */}
                {canChangePassword && (
                  <button
                    onClick={openChangePasswordModal}
                    className="relative text-dr-blue hover:bg-blue-50 rounded-lg p-2 transition-all duration-200 md:hidden"
                    title="Cambiar Contraseña"
                  >
                    <Key className="h-5 w-5" />
                  </button>
                )}

                {/* Enhanced User Avatar with Dropdown - Desktop Only */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-8 w-8 rounded-full hidden md:flex hover:ring-2 hover:ring-dr-blue/30 transition-all duration-200 cursor-pointer">
                      <Avatar className="h-8 w-8 ring-2 ring-gray-200 shadow-sm">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="bg-dr-blue text-white text-xs font-bold">
                          {userName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2) || "AD"}
                        </AvatarFallback>
                      </Avatar>
                      {/* Indicator que es clickeable */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-dr-blue rounded-full flex items-center justify-center">
                        <Settings className="h-2 w-2 text-white" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userRole}
                        </p>
                        {currentUser && (
                          <p className="text-xs leading-none text-muted-foreground">
                            @{currentUser.username}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {canChangePassword && (
                      <>
                        <DropdownMenuItem 
                          onClick={openChangePasswordModal}
                          className="cursor-pointer focus:bg-blue-50"
                        >
                          <Key className="mr-2 h-4 w-4 text-dr-blue" />
                          <span className="text-dr-blue font-medium">Cambiar Contraseña</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem 
                      onClick={goToNotificationsPage}
                      className="cursor-pointer focus:bg-blue-50"
                    >
                      <Bell className="mr-2 h-4 w-4 text-dr-blue" />
                      <span className="text-dr-blue font-medium">Centro de notificaciones</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content with proper container - Altura completa */}
          <main className="flex-1 overflow-auto bg-dr-light-gray h-full">
            <div className="w-full max-w-none mx-auto p-4 md:p-6 h-full">
              {/* Enhanced Main Content with Premium Separation */}
              <div className="main-content-area relative flex-1 min-w-0 h-full">
                {/* Subtle content background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-50/20 to-transparent pointer-events-none -z-10"></div>
                <div className="relative z-10 w-full h-full">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Modal de Cambio de Contraseña */}
      {canChangePassword && currentUser && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          currentUser={currentUser}
          onPasswordChange={onPasswordChange}
          onValidateCurrentPassword={onValidateCurrentPassword}
          forceChange={forcePasswordChange}
        />
      )}
    </SidebarProvider>
  );
}
