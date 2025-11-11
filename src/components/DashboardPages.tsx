import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getRequests,
  getAssignedRequests,
  getRequestById,
  assignRequest,
  getAssignableUsers,
  unassignRequest,
  updateRequestStatus,
  changeRequestStatus,
  approveRequest,
  rejectRequest,
  completeRequest,
  cancelRequest,
  reviewRequest,
  getRequestCountReport,
  getMonthlyRequestReport,
  getAnnualRequestReport,
  getActiveUsersReport,
  getUsersByRoleReport,
  downloadRequestCountReportPDF,
  downloadRequestCountReportExcel,
  downloadMonthlyRequestReportPDF,
  downloadMonthlyRequestReportExcel,
  downloadAnnualRequestReportPDF,
  downloadAnnualRequestReportExcel,
  downloadActiveUsersReportPDF,
  downloadActiveUsersReportExcel,
  downloadUsersByRoleReportPDF,
  downloadUsersByRoleReportExcel,
  downloadBlobAsFile,
  getNonAdminUsers,
  assignBeneficiaryToAnalyst,
  RequestDto,
  AssignableUserDto
} from '../services/api';

interface CurrentUser {
  username: string;
  email?: string | null;
  name: string;
  role: string;
  roleLevel: 'Admin' | 'Supervisor' | 'Analyst';
  id?: string | null;
  departmentName?: string | null;
  departmentId?: string | null;
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import {
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  MoreHorizontal,
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  ClipboardList,
  Eye,
  UserPlus,
  UserMinus,
  Calendar,
  MapPin,
  Mail,
  Upload,
  Edit3,
  X,
  Settings,
  Phone,
  Home,
  CreditCard,
  User,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  MessageSquare,
  Shield,
  Info,
  ArrowRight,
  Plus,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  FileUser,
  Building2,
  GraduationCap,
  IdCard
} from 'lucide-react';
import {
  ApiError,
  AdminUserDto,
  BeneficiaryDto,
  SearchBeneficiariesOptions,
  searchBeneficiaries,
} from '../services/api';
import { useNotifications } from '../context/NotificationsContext';

// Mock data for available analysts
const availableAnalysts = [
  { id: 'analista', name: 'Lic. Esperanza María Rodríguez', role: 'Analista de Solicitudes' },
  { id: 'operador', name: 'Lic. Juan Miguel Valdez', role: 'Analista Regional' },
  { id: 'analyst3', name: 'Lic. Carmen Rosa Herrera', role: 'Analista de Evaluación' },
  { id: 'analyst4', name: 'Lic. Miguel Ángel Castro', role: 'Analista de Documentos' }
];

const isValidGuid = (value?: string | null): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
};

// Helper functions
const getRequestTypeIcon = (type: string) => {
  switch (type) {
    case 'document_upload':
      return <Upload className="h-4 w-4" />;
    case 'info_update':
      return <Edit3 className="h-4 w-4" />;
    case 'benefit_application':
      return <UserPlus className="h-4 w-4" />;
    case 'address_change':
      return <MapPin className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getRequestTypeName = (type: string) => {
  switch (type) {
    case 'document_upload':
      return 'Carga de Documentos';
    case 'info_update':
      return 'Actualización de Información';
    case 'benefit_application':
      return 'Solicitud de Beneficio';
    case 'address_change':
      return 'Cambio de Dirección';
    default:
      return 'Otros';
  }
};

const getStatusBadge = (status: string | number) => {
  // Convertir número a string si es necesario
  const statusStr = typeof status === 'number' ? String(status) : status;

  // Mapeo de números y estados en inglés a estados normalizados (basado en BeneficiaryRequestStatus.cs)
  const statusMap: Record<string, string> = {
    '1': 'pending',     // Pendiente
    '2': 'review',      // En Revisión
    '3': 'approved',    // Aprobada
    '4': 'rejected',    // Rechazada
    '5': 'completed',   // Completada
    '6': 'cancelled',   // Cancelada
    // Mapeo de estados en inglés
    'Approved': 'approved',
    'Pending': 'pending',
    'Review': 'review',
    'Rejected': 'rejected',
    'Completed': 'completed',
    'Cancelled': 'cancelled',
  };

  const normalizedStatus = statusMap[statusStr] || statusStr.toLowerCase();

  switch (normalizedStatus) {
    case 'pending':
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 font-semibold shadow-sm">
        <Clock className="h-3.5 w-3.5 mr-1.5" />
        Pendiente
      </Badge>;
    case 'review':
      return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 font-semibold shadow-sm">
        <Eye className="h-3.5 w-3.5 mr-1.5" />
        En Revisión
      </Badge>;
    case 'approved':
      return <Badge className="bg-green-500/10 text-green-700 border-green-500/20 font-semibold shadow-sm">
        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
        Aprobada
      </Badge>;
    case 'rejected':
      return <Badge className="bg-red-500/10 text-red-700 border-red-500/20 font-semibold shadow-sm">
        <XCircle className="h-3.5 w-3.5 mr-1.5" />
        Rechazada
      </Badge>;
    case 'completed':
      return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-semibold shadow-sm">
        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        Completada
      </Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/20 font-semibold shadow-sm">
        <X className="h-3.5 w-3.5 mr-1.5" />
        Cancelada
      </Badge>;
    default:
      return <Badge variant="outline" className="shadow-sm">{statusStr}</Badge>;
  }
};

const getBeneficiaryStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Activo
      </Badge>;
    case 'suspended':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Suspendido
      </Badge>;
    case 'inactive':
      return <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Inactivo
      </Badge>;
    case 'pending':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Alta</Badge>;
    case 'medium':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Media</Badge>;
    case 'low':
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Baja</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

// Dashboard Overview Page
export function DashboardOverview({ currentUser, authToken, onNavigate }: PageProps) {
  const [requestCountReport, setRequestCountReport] = useState<any>(null);
  const [activeUsersReport, setActiveUsersReport] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const roleLabel = currentUser?.role ?? '';
  const normalizedRoleLabel = roleLabel.trim().toLowerCase();
  const normalizedRoleLevel =
    typeof currentUser?.roleLevel === 'string'
      ? currentUser.roleLevel.trim().toLowerCase()
      : '';
  const isAdmin =
    normalizedRoleLabel.includes('admin') ||
    normalizedRoleLabel.includes('administrador') ||
    normalizedRoleLevel === 'admin';
  const isSupervisor =
    normalizedRoleLabel.includes('supervisor') ||
    normalizedRoleLabel.includes('manager') ||
    normalizedRoleLevel === 'supervisor';
  const isAnalyst =
    normalizedRoleLabel.includes('analyst') ||
    normalizedRoleLabel.includes('analista') ||
    normalizedRoleLevel === 'analyst';

  // Load stats from backend
  useEffect(() => {
    const loadStats = async () => {
      if (!authToken) return;
      
      try {
        setIsLoadingStats(true);
        const [requestCount, activeUsers] = await Promise.all([
          getRequestCountReport(authToken).catch(() => null),
          getActiveUsersReport(authToken).catch(() => null),
        ]);
        
        setRequestCountReport(requestCount);
        setActiveUsersReport(activeUsers);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [authToken]);

  const formatNumber = (num: number | undefined) => {
    if (!num) return '0';
    return num.toLocaleString('es-DO');
  };

  // Estadísticas específicas por rol
  const getStatsForRole = () => {
    if (isAdmin) {
      return [
        {
          title: 'Total Solicitudes',
          value: formatNumber(requestCountReport?.totalRequests),
          change: 'En el sistema',
          icon: ClipboardList,
          color: 'text-dr-blue',
          bg: 'bg-blue-50'
        },
        {
          title: 'Usuarios Activos',
          value: formatNumber(activeUsersReport?.totalActiveUsers),
          change: 'En el sistema',
          icon: UserPlus,
          color: 'text-dr-blue',
          bg: 'bg-blue-50'
        },
        {
          title: 'Solicitudes Pendientes',
          value: formatNumber(requestCountReport?.pendingRequests),
          change: 'Por asignar',
          icon: Clock,
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        },
        {
          title: 'Solicitudes Aprobadas',
          value: formatNumber(requestCountReport?.approvedRequests),
          change: 'Completadas',
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50'
        },
      ];
    } else if (isSupervisor) {
      return [
        {
          title: 'Solicitudes sin Asignar',
          value: formatNumber(requestCountReport?.pendingRequests),
          change: 'Requieren asignación',
          icon: ClipboardList,
          color: 'text-dr-blue',
          bg: 'bg-blue-50'
        },
        {
          title: 'Solicitudes Asignadas',
          value: formatNumber(requestCountReport?.assignedRequests),
          change: 'En proceso',
          icon: Clock,
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        },
        {
          title: 'Solicitudes Aprobadas',
          value: formatNumber(requestCountReport?.approvedRequests),
          change: 'Completadas',
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50'
        },
        {
          title: 'En Revisión',
          value: formatNumber(requestCountReport?.inReviewRequests),
          change: 'Requieren aprobación',
          icon: Users,
          color: 'text-purple-600',
          bg: 'bg-purple-50'
        },
      ];
    } else {
      return [
        {
          title: 'Solicitudes Asignadas',
          value: formatNumber(requestCountReport?.assignedRequests),
          change: 'A mi cargo',
          icon: ClipboardList,
          color: 'text-dr-blue',
          bg: 'bg-blue-50'
        },
        {
          title: 'En Revisión',
          value: formatNumber(requestCountReport?.inReviewRequests),
          change: 'Requieren atención',
          icon: Clock,
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        },
        {
          title: 'Completadas',
          value: formatNumber(requestCountReport?.approvedRequests),
          change: 'Aprobadas',
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50'
        },
        {
          title: 'Mi Eficiencia',
          value: '94%',
          change: 'este mes',
          icon: TrendingUp,
          color: 'text-green-600',
          bg: 'bg-green-50'
        },
      ];
    }
  };

  const stats = getStatsForRole();
  const pendingAssignments = requestCountReport?.pendingRequests ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative bg-gradient-to-r from-dr-blue to-dr-blue-light p-8 rounded-xl border border-gray-200 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full transform translate-x-8 -translate-y-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-4 translate-y-4"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-12 bg-white/30 rounded-full"></div>
            <h1 className="text-3xl font-bold text-white">
              Bienvenido, {currentUser?.name?.split(' ')[0] || 'Usuario'}
            </h1>
          </div>
          <p className="text-blue-100 text-lg max-w-3xl">
            {isAdmin 
              ? 'Panel de administración general para la gestión completa del Sistema Único de Beneficiarios'
              : isSupervisor
              ? 'Panel de supervisión para la revisión y aprobación de solicitudes de beneficiarios'
              : 'Panel de análisis para la evaluación de solicitudes de beneficiarios'
            }
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-12 h-0.5 bg-white/40"></div>
            <span className="text-white/80 text-sm uppercase tracking-wider">{currentUser?.role || 'SIUBEN'}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-dr-dark-gray line-clamp-2">{stat.title}</CardTitle>
                <div className={`${stat.bg} p-2 rounded-full flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-dr-dark-gray">{stat.value}</div>
                <p className="text-xs text-gray-600 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin Quick Actions */}
      {isAdmin && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-dr-dark-gray">Acciones Rápidas de Administrador</CardTitle>
            <CardDescription className="text-gray-600">
              Herramientas administrativas de uso frecuente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto p-4 border-gray-300"
                onClick={() => onNavigate?.('users')}
              >
                <div className="flex flex-col items-center gap-2">
                  <UserPlus className="h-6 w-6 text-dr-blue" />
                  <span className="text-sm font-medium">Crear Usuario</span>
                  <span className="text-xs text-gray-500">Agregar nuevo usuario</span>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-4 border-gray-300"
                onClick={() => onNavigate?.('reports')}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6 text-dr-blue" />
                  <span className="text-sm font-medium">Generar Reporte</span>
                  <span className="text-xs text-gray-500">Reportes del sistema</span>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-4 border-gray-300"
                onClick={() => onNavigate?.('config')}
              >
                <div className="flex flex-col items-center gap-2">
                  <Settings className="h-6 w-6 text-dr-blue" />
                  <span className="text-sm font-medium">Configuraciones</span>
                  <span className="text-xs text-gray-500">Ajustes del sistema</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manager Quick Actions */}
      {isSupervisor && (
        <Card className="border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="text-dr-dark-gray flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-dr-blue" />
              Gestión de Asignaciones
            </CardTitle>
            <CardDescription className="text-gray-600">
              Distribuya las solicitudes entre su equipo de analistas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Solicitudes sin asignar</p>
                    <p className="text-2xl font-bold text-dr-dark-gray">
                      {formatNumber(pendingAssignments)}
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-dr-blue hover:bg-dr-blue-dark"
                  onClick={() => onNavigate?.('requests')}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Asignar Ahora
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-medium text-gray-600">Asignadas Hoy</p>
                  </div>
                  <p className="text-xl font-bold text-dr-dark-gray">12</p>
                </div>
                
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-dr-blue" />
                    <p className="text-xs font-medium text-gray-600">Analistas Activos</p>
                  </div>
                  <p className="text-xl font-bold text-dr-dark-gray">4</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Requests Management Page
export function RequestsPage({ currentUser, authToken }: PageProps) {
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [selectedAnalyst, setSelectedAnalyst] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [unassignNotes, setUnassignNotes] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('');
  const [statusChangeNotes, setStatusChangeNotes] = useState('');
  const [isSubmittingStatusChange, setIsSubmittingStatusChange] = useState(false);
  const [statusChangeError, setStatusChangeError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting states
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { pushNotification } = useNotifications();
  const previousRequestIdsRef = useRef<Set<string>>(new Set());
  const requestsInitializedRef = useRef(false);

  const roleString = currentUser?.role ?? '';
  const normalizedRoleString = roleString.trim().toLowerCase();
  const normalizedRoleLevel =
    typeof currentUser?.roleLevel === 'string'
      ? currentUser.roleLevel.trim().toLowerCase()
      : '';
  const isSupervisorRole =
    normalizedRoleString.includes('supervisor') ||
    normalizedRoleString.includes('manager') ||
    normalizedRoleLevel === 'supervisor';
  const isAdminRole =
    normalizedRoleString.includes('admin') ||
    normalizedRoleString.includes('administrador') ||
    normalizedRoleLevel === 'admin';
  const isAnalystRole =
    normalizedRoleString.includes('analyst') ||
    normalizedRoleString.includes('analista') ||
    normalizedRoleLevel === 'analyst';
  const [analysts, setAnalysts] = useState<AnalystOption[]>(FALLBACK_ANALYST_OPTIONS);
  const [usingFallbackAnalysts, setUsingFallbackAnalysts] = useState(true);
  const [hasLoadedAnalysts, setHasLoadedAnalysts] = useState(false);
  const [isLoadingAnalysts, setIsLoadingAnalysts] = useState(false);
  const [assignDialogError, setAssignDialogError] = useState<string | null>(null);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const trackRequests = useCallback(
    (data: RequestDto[], allowNotifications: boolean) => {
      const currentIds = new Set<string>();
      const newRequests: RequestDto[] = [];

      data.forEach((request) => {
        const id = resolveRequestId(request);
        if (!id) {
          return;
        }
        currentIds.add(id);
        if (
          requestsInitializedRef.current &&
          allowNotifications &&
          !previousRequestIdsRef.current.has(id)
        ) {
          newRequests.push(request);
        }
      });

      previousRequestIdsRef.current = currentIds;
      if (!requestsInitializedRef.current) {
        requestsInitializedRef.current = true;
      }

      if (allowNotifications && newRequests.length > 0 && isSupervisorRole) {
        newRequests.forEach((request) => {
          const id = resolveRequestId(request);
          if (!id) {
            return;
          }
          pushNotification({
            id: `request-${id}-new`,
            title: 'Nueva solicitud recibida',
            message:
              request.applicant
                ? `Se registró la solicitud #${id} de ${request.applicant}.`
                : `Se registró la solicitud #${id}.`,
            priority: 'medium',
            type: 'request',
            targetRoles: ['Supervisor'],
          });
        });
      }
    },
    [isSupervisorRole, pushNotification],
  );
  // Load requests from backend
  const loadRequests = useCallback(async () => {
    if (!authToken) {
      setLoadError('No hay token de autenticación');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      // Analysts only see their assigned requests
      console.log('[RequestsPage] Loading requests, isAnalystRole:', isAnalystRole);
      const data = isAnalystRole
        ? await getAssignedRequests(authToken)
        : await getRequests(authToken);
      console.log('[RequestsPage] Loaded requests:', data.length, 'items');
      setRequests(data);
      trackRequests(data, true);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      setLoadError(error instanceof Error ? error.message : 'Error cargando solicitudes');
      toast.error('Error al cargar las solicitudes del sistema');
    } finally {
      setIsLoading(false);
    }
  }, [authToken, trackRequests, isAnalystRole]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const loadAnalystOptions = useCallback(async () => {
    if (!authToken) {
      return;
    }

    const departmentUuid = isValidGuid(currentUser?.departmentId)
      ? currentUser?.departmentId?.trim() ?? null
      : null;

    setIsLoadingAnalysts(true);
    setAssignDialogError(null);

    try {
      // Try to use the new assignable users endpoint first
      try {
        const assignableUsers = await getAssignableUsers(authToken, {
          includeRelatedRoles: true,
          ...(departmentUuid
            ? {
                departmentId: departmentUuid,
                prioritizeDepartmentId: departmentUuid,
              }
            : {}),
        });

        if (assignableUsers.length > 0) {
          const mapped = assignableUsers
            .map((user): AnalystOption | null => {
              const rawId =
                typeof user.id === 'number'
                  ? String(user.id)
                  : typeof user.id === 'string'
                    ? user.id
                    : null;
              const id = rawId?.trim();
              if (!id) {
                return null;
              }

              const baseName =
                typeof user.fullName === 'string' && user.fullName.trim().length > 0
                  ? user.fullName.trim()
                  : null;
              const fallbackName =
                typeof user.email === 'string' && user.email.trim().length > 0
                  ? user.email.trim()
                  : id;

              return {
                id,
                name: baseName ?? fallbackName,
                email: user.email ?? null,
                role: user.role ?? user.roleCode ?? null,
                departmentName: user.departmentName ?? null,
                isSameDepartment:
                  typeof user.isSameDepartment === 'boolean' ? user.isSameDepartment : null,
              };
            })
            .filter((option): option is AnalystOption => option !== null)
            .sort((a, b) => {
              const aSame = a.isSameDepartment ? 1 : 0;
              const bSame = b.isSameDepartment ? 1 : 0;
              return bSame - aSame;
            });

          setAnalysts(mapped);
          setUsingFallbackAnalysts(false);
          setHasLoadedAnalysts(true);
          return;
        }
      } catch (assignableUsersError) {
        console.log('Assignable users endpoint not available, falling back to getNonAdminUsers');
      }

      // Fallback to the original method
      const users = await getNonAdminUsers(authToken);
      const mapped = mapAdminUsersToAnalystOptions(users, currentUser);

      if (mapped.length === 0) {
        setAnalysts(FALLBACK_ANALYST_OPTIONS);
        setAssignDialogError('No se encontraron analistas disponibles en el sistema.');
        setUsingFallbackAnalysts(true);
      } else {
        setAnalysts(mapped);
        setUsingFallbackAnalysts(false);
      }
      setHasLoadedAnalysts(true);
    } catch (err) {
      console.error('Error cargando analistas', err);
      let message = 'No se pudieron cargar los analistas disponibles.';
      if (err instanceof ApiError && err.message && err.message.trim()) {
        message = err.message.trim();
      } else if (err instanceof Error && err.message && err.message.trim()) {
        message = err.message.trim();
      }
      setAssignDialogError(message);
      if (!hasLoadedAnalysts) {
        setAnalysts(FALLBACK_ANALYST_OPTIONS);
      }
      setUsingFallbackAnalysts(true);
      setHasLoadedAnalysts(true);
    } finally {
      setIsLoadingAnalysts(false);
    }
  }, [authToken, hasLoadedAnalysts, currentUser]);

  useEffect(() => {
    if ((isSupervisorRole || isAdminRole) && !hasLoadedAnalysts && authToken) {
      void loadAnalystOptions();
    }
  }, [authToken, hasLoadedAnalysts, isAdminRole, isSupervisorRole, loadAnalystOptions]);

  useEffect(() => {
    if (!showAssignModal || !selectedRequest || analysts.length === 0) {
      return;
    }

    setSelectedAnalyst((previous) => {
      if (previous && analysts.some((analyst) => analyst.id === previous)) {
        return previous;
      }

      const info = extractRequestAssigneeInfo(selectedRequest);

      if (info.id) {
        const matchById = analysts.find(
          (analyst) => analyst.id.toLowerCase() === info.id!.toLowerCase(),
        );
        if (matchById) {
          return matchById.id;
        }
      }

      if (info.email) {
        const matchByEmail = analysts.find(
          (analyst) => analyst.email?.toLowerCase() === info.email!.toLowerCase(),
        );
        if (matchByEmail) {
          return matchByEmail.id;
        }
      }

      if (info.name) {
        const matchByName = analysts.find(
          (analyst) => analyst.name.toLowerCase() === info.name!.toLowerCase(),
        );
        if (matchByName) {
          return matchByName.id;
        }
      }

      return '';
    });
  }, [analysts, selectedRequest, showAssignModal]);

  // Helper function to normalize status (convert number to string in Spanish)
  const normalizeStatus = (status: string | number): string => {
    const statusMap: Record<string, string> = {
      '0': 'pendiente',
      '1': 'pendiente',
      '2': 'en revisión',
      '3': 'aprobada',
      '4': 'rechazada',
      '5': 'completada',
      '6': 'cancelada',
      'pending': 'pendiente',
      'pendiente': 'pendiente',
      'assigned': 'asignada',
      'asignada': 'asignada',
      'review': 'en revisión',
      'en revisión': 'en revisión',
      'approved': 'aprobada',
      'aprobada': 'aprobada',
      'rejected': 'rechazada',
      'rechazada': 'rechazada',
      'completed': 'completada',
      'completada': 'completada',
      'cancelled': 'cancelada',
      'cancelada': 'cancelada',
    };
    const raw =
      typeof status === 'number'
        ? String(status)
        : typeof status === 'string'
          ? status.trim().toLowerCase()
          : '';
    if (!raw) {
      return '';
    }
    return statusMap[raw] || raw;
  };

  // Filter requests based on user role
  const getFilteredRequests = () => {
    // Analysts already get filtered requests from the API (/requests/assigned)
    // so no need to filter again here
    let filteredRequests = requests;

    // Search filter
    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter((req) => {
        const assigneeName = resolveRequestAssigneeName(req);
        const fullName = req.beneficiary
          ? `${req.beneficiary.firstName || ''} ${req.beneficiary.lastName || ''}`.trim()
          : req.applicant || '';
        const nationalId = req.beneficiary?.nationalId || req.cedula || '';

        return (
          fullName.toLowerCase().includes(normalizedSearch) ||
          nationalId.toLowerCase().includes(normalizedSearch) ||
          req.id?.toLowerCase().includes(normalizedSearch) ||
          req.externalReference?.toLowerCase().includes(normalizedSearch) ||
          (assigneeName ? assigneeName.toLowerCase().includes(normalizedSearch) : false)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => normalizeStatus(req.status) === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => {
        const typeCode = req.requestTypeCode || req.type;
        return typeCode === typeFilter;
      });
    }

    // Sorting
    filteredRequests = [...filteredRequests].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'id':
          aValue = a.id || '';
          bValue = b.id || '';
          break;
        case 'applicant':
          const aFullName = a.beneficiary
            ? `${a.beneficiary.firstName || ''} ${a.beneficiary.lastName || ''}`.trim().toLowerCase()
            : (a.applicant?.toLowerCase() || '');
          const bFullName = b.beneficiary
            ? `${b.beneficiary.firstName || ''} ${b.beneficiary.lastName || ''}`.trim().toLowerCase()
            : (b.applicant?.toLowerCase() || '');
          aValue = aFullName;
          bValue = bFullName;
          break;
        case 'status':
          aValue = normalizeStatus(a.status);
          bValue = normalizeStatus(b.status);
          break;
        case 'assignedTo':
          aValue = resolveRequestAssigneeName(a)?.toLowerCase() || '';
          bValue = resolveRequestAssigneeName(b)?.toLowerCase() || '';
          break;
        case 'date':
        default:
          // Parse dates for sorting
          aValue = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          bValue = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          break;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filteredRequests;
  };

  const filteredRequests = getFilteredRequests();

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const { outOfTeamAnalystsCount, teamAnalystsCount } = useMemo(() => {
    if (isAdminRole) {
      return { outOfTeamAnalystsCount: 0, teamAnalystsCount: analysts.length };
    }
    const outCount = analysts.filter((analyst) => analyst.isSameDepartment === false).length;
    return { outOfTeamAnalystsCount: outCount, teamAnalystsCount: analysts.length - outCount };
  }, [analysts, isAdminRole]);

  const handleViewRequest = async (request: RequestDto) => {
    try {
      // Cargar datos completos de la solicitud individual (con beneficiary y padronData)
      const fullRequest = await getRequestById(authToken, request.id!);
      setSelectedRequest(fullRequest);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error loading request details:', error);
      // Si falla, usar los datos básicos que ya tenemos
      setSelectedRequest(request);
      setShowViewModal(true);
    }
  };

  const handleAssignRequest = (request: RequestDto) => {
    setAssignDialogError(
      usingFallbackAnalysts && hasLoadedAnalysts
        ? 'El listado de analistas no está disponible. Solicite a un supervisor la asignación o espere a que se sincronice la información.'
        : null,
    );
    setSelectedRequest(request);
    setAssignmentNotes('');
    if (!hasLoadedAnalysts && !isLoadingAnalysts) {
      void loadAnalystOptions();
    }
    setShowAssignModal(true);
  };

  const handleConfirmAssignment = async () => {
    if (usingFallbackAnalysts) {
      setAssignDialogError(
        'No se puede asignar la solicitud porque el listado oficial de analistas no está disponible. Solicite apoyo a TI o a un supervisor con permisos de gestión.',
      );
      return;
    }

    if (!authToken) {
      setAssignDialogError('Debe iniciar sesión para asignar una solicitud.');
      return;
    }

    if (!selectedRequest) {
      setAssignDialogError('No se pudo determinar la solicitud seleccionada.');
      return;
    }

    const requestId = resolveRequestId(selectedRequest);
    if (!requestId) {
      setAssignDialogError('No se pudo determinar la solicitud seleccionada.');
      return;
    }

    if (!selectedAnalyst) {
      setAssignDialogError('Seleccione un analista para continuar.');
      toast.error('Por favor seleccione un analista');
      return;
    }

    const analystInfo = analysts.find((analyst) => analyst.id === selectedAnalyst);

    if (!analystInfo) {
      setAssignDialogError('Analista no encontrado entre las opciones disponibles.');
      toast.error('Analista no encontrado');
      return;
    }

    const restrictToTeam = !isAdminRole && isSupervisorRole;
    if (restrictToTeam && analystInfo.isSameDepartment === false) {
      const message =
        'Solo puedes asignar solicitudes a analistas que forman parte de tu equipo o departamento.';
      setAssignDialogError(message);
      toast.error(message);
      return;
    }

    setIsSubmittingAssignment(true);
    setAssignDialogError(null);

    try {
      const trimmedNotes = assignmentNotes.trim();
      let updatedRequest: RequestDto | null = null;

      try {
        updatedRequest = await assignRequest(authToken, requestId, {
          analystId: analystInfo.id,
          notes: trimmedNotes ? trimmedNotes : undefined,
        });
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            throw new ApiError('La sesión expiró. Inicie sesión nuevamente.', error.status);
          }
          if (error.status === 403) {
            throw new ApiError('No tiene permisos para asignar solicitudes.', error.status);
          }
          if (error.status === 404) {
            throw new ApiError('La solicitud no se encontró en el servidor.', error.status);
          }
        }
        throw error;
      }

      if (updatedRequest) {
        setRequests((prev) =>
          prev.map((req) =>
            resolveRequestId(req) === requestId ? { ...req, ...updatedRequest } : req,
          ),
        );
      } else {
        setRequests((prev) =>
          prev.map((req) =>
            resolveRequestId(req) === requestId
              ? {
                  ...req,
                  status: 'assigned',
                  assignedTo: analystInfo.name,
                  assignmentDate: new Date().toISOString(),
                  assignmentNotes: trimmedNotes,
                }
              : req,
          ),
        );
      }

      await loadRequests();

      const resolvedId = resolveRequestId(updatedRequest ?? selectedRequest) ?? requestId;
      const applicantName =
        updatedRequest?.applicant ?? selectedRequest.applicant ?? undefined;

      toast.success('Solicitud asignada correctamente', {
        description: `${applicantName ?? `Solicitud #${resolvedId}`} → ${analystInfo.name}`,
        duration: 4000,
      });

      if (isSupervisorRole || isAdminRole) {
        pushNotification({
          id: `request-${resolvedId}-assigned`,
          title: 'Solicitud asignada',
          message: applicantName
            ? `La solicitud #${resolvedId} de ${applicantName} fue asignada a ${analystInfo.name}.`
            : `La solicitud #${resolvedId} fue asignada a ${analystInfo.name}.`,
          priority: 'medium',
          type: 'request-assignment',
          targetRoles: ['Supervisor'],
        });
      }

      setShowAssignModal(false);
      setSelectedAnalyst('');
      setAssignmentNotes('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error asignando solicitud', error);
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error && error.message
            ? error.message
            : 'No se pudo asignar la solicitud. Intente nuevamente.';
      setAssignDialogError(message);
      toast.error(message);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handleUnassignRequest = async () => {
    if (!selectedRequest || !authToken) return;

    const requestId = resolveRequestId(selectedRequest);
    if (!requestId) {
      toast.error('No se pudo determinar la solicitud seleccionada.');
      return;
    }
    
    setIsSubmittingAssignment(true);
    try {
      await unassignRequest(authToken, requestId, {
        notes: unassignNotes.trim() || undefined
      });
      
      // Update local state
      setRequests((prev: RequestDto[]) => prev.map((req: RequestDto) => 
        resolveRequestId(req) === requestId
          ? { ...req, assignedTo: null, assignmentDate: null, assignmentNotes: null }
          : req
      ));
      
      toast.success(`Solicitud #${requestId} desasignada exitosamente`);
      setShowUnassignModal(false);
      setUnassignNotes('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error desasignando solicitud', error);
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error && error.message
            ? error.message
            : 'No se pudo desasignar la solicitud. Intente nuevamente.';
      toast.error(message);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedRequest || !authToken || !selectedNewStatus) return;

    const requestId = resolveRequestId(selectedRequest);
    if (!requestId) {
      toast.error('No se pudo determinar la solicitud seleccionada.');
      return;
    }

    const statusNum = parseInt(selectedNewStatus);
    if (isNaN(statusNum) || statusNum < 1 || statusNum > 6) {
      setStatusChangeError('Por favor seleccione un estado válido.');
      return;
    }

    // Validate notes for rejected and cancelled statuses
    if ((statusNum === 4 || statusNum === 6) && !statusChangeNotes.trim()) {
      setStatusChangeError('Las notas son requeridas para estados rechazados o cancelados.');
      return;
    }

    setIsSubmittingStatusChange(true);
    setStatusChangeError(null);

    try {
      const updatedRequest = await updateRequestStatus(authToken, requestId, {
        status: statusNum,
        notes: statusChangeNotes.trim() || undefined
      });

      if (updatedRequest) {
        // Update local state with the response from the server
        setRequests((prev: RequestDto[]) => prev.map((req: RequestDto) =>
          resolveRequestId(req) === requestId ? updatedRequest : req
        ));

        // Get status name for toast message
        const statusNames: Record<number, string> = {
          1: 'Pendiente',
          2: 'En Revisión',
          3: 'Aprobada',
          4: 'Rechazada',
          5: 'Completada',
          6: 'Cancelada'
        };

        toast.success(`Solicitud actualizada a: ${statusNames[statusNum]}`);
      }

      setShowStatusChangeModal(false);
      setSelectedNewStatus('');
      setStatusChangeNotes('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error cambiando estado de solicitud', error);
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error && error.message
            ? error.message
            : 'No se pudo cambiar el estado de la solicitud. Intente nuevamente.';
      setStatusChangeError(message);
    } finally {
      setIsSubmittingStatusChange(false);
    }
  };

  // Quick action handlers using specific endpoints
  const handleQuickStatusAction = async (action: 'approve' | 'reject' | 'review' | 'complete' | 'cancel', notes?: string) => {
    if (!selectedRequest || !authToken) return;

    const requestId = resolveRequestId(selectedRequest);
    if (!requestId) {
      toast.error('No se pudo determinar la solicitud seleccionada.');
      return;
    }

    // Validate notes for reject and cancel actions
    if ((action === 'reject' || action === 'cancel') && !notes?.trim()) {
      setStatusChangeError(`Las notas son requeridas para ${action === 'reject' ? 'rechazar' : 'cancelar'} una solicitud.`);
      return;
    }

    setIsSubmittingStatusChange(true);
    setStatusChangeError(null);

    try {
      let updatedRequest: RequestDto | null = null;
      const actionPayload = { notes: notes?.trim() || undefined };

      switch (action) {
        case 'approve':
          updatedRequest = await approveRequest(authToken, requestId, actionPayload);
          break;
        case 'reject':
          updatedRequest = await rejectRequest(authToken, requestId, actionPayload);
          break;
        case 'review':
          updatedRequest = await reviewRequest(authToken, requestId, actionPayload);
          break;
        case 'complete':
          updatedRequest = await completeRequest(authToken, requestId, actionPayload);
          break;
        case 'cancel':
          updatedRequest = await cancelRequest(authToken, requestId, actionPayload);
          break;
      }

      if (updatedRequest) {
        setRequests((prev: RequestDto[]) => prev.map((req: RequestDto) =>
          resolveRequestId(req) === requestId ? updatedRequest : req
        ));
      }

      // Action name translations
      const actionNames: Record<string, string> = {
        approve: 'Aprobada',
        reject: 'Rechazada',
        review: 'En Revisión',
        complete: 'Completada',
        cancel: 'Cancelada'
      };

      toast.success(`Solicitud ${actionNames[action]}`, {
        description: `Solicitud #${requestId.substring(0, 8)} actualizada correctamente`,
        duration: 4000,
      });

      // Reload requests to get fresh data
      await loadRequests();

      setShowStatusChangeModal(false);
      setSelectedNewStatus('');
      setStatusChangeNotes('');
      setSelectedRequest(null);
    } catch (error) {
      console.error(`Error executing ${action} action:`, error);
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error && error.message
            ? error.message
            : `No se pudo ${action === 'approve' ? 'aprobar' : action === 'reject' ? 'rechazar' : action === 'review' ? 'poner en revisión' : action === 'complete' ? 'completar' : 'cancelar'} la solicitud. Intente nuevamente.`;
      setStatusChangeError(message);
      toast.error(message);
    } finally {
      setIsSubmittingStatusChange(false);
    }
  };

  const handleUpdateRequestStatus = (requestId: string, newStatus: string, notes?: string) => {
    setRequests(prev => prev.map(req =>
      req.id === requestId
        ? {
            ...req,
            status: newStatus,
            reviewedBy: currentUser?.name,
            reviewDate: new Date().toLocaleDateString('es-DO'),
            reviewNotes: notes
          }
        : req
    ));

    toast.success(`Solicitud #${requestId} actualizada a: ${newStatus}`);
  };

  // Get count of unassigned requests for managers/admins
  const unassignedCount = (isSupervisorRole || isAdminRole)
    ? requests.filter((req) => normalizeStatus(req.status) === 'pendiente' && !resolveRequestAssigneeName(req)).length
    : 0;

  const statusSummary = useMemo(() => {
    const summary = {
      total: requests.length,
      pendiente: 0,
      asignada: 0,
      'en revisión': 0,
      aprobada: 0,
      rechazada: 0,
      completada: 0,
      cancelada: 0,
    };

    for (const request of requests) {
      const statusKey = normalizeStatus(request.status);
      if (statusKey in summary && statusKey !== 'total') {
        summary[statusKey as keyof typeof summary] += 1;
      }
    }

    return summary;
  }, [requests]);

  const summaryCards = useMemo(
    () => [
      {
        key: 'total',
        label: 'Solicitudes registradas',
        value: statusSummary.total,
        helper: 'Historial completo',
        accent: 'from-sky-500 via-blue-500 to-indigo-500',
      },
      {
        key: 'in-progress',
        label: 'En proceso',
        value: statusSummary.pendiente + statusSummary['en revisión'],
        helper: 'Pendientes y en revisión',
        accent: 'from-amber-400 via-orange-500 to-pink-500',
      },
    ],
    [statusSummary],
  );

  const quickStatusFilters = [
    { label: 'Todas', value: 'all' },
    { label: 'Pendientes', value: 'pendiente' },
    { label: 'Asignadas', value: 'asignada' },
    { label: 'En revisión', value: 'en revisión' },
    { label: 'Aprobadas', value: 'aprobada' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/30 to-white p-6 shadow-sm">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,118,255,0.12),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-dr-blue shadow-sm">
              <ClipboardList className="h-3.5 w-3.5" />
              Centro de solicitudes
            </span>
            <div>
              <h1 className="text-3xl font-semibold text-dr-dark-gray">
                {isSupervisorRole
                  ? 'Gestión de Solicitudes'
                  : isAnalystRole
                    ? 'Mis Solicitudes Asignadas'
                    : 'Solicitudes del Sistema'}
              </h1>
              <p className="text-sm text-slate-600">
                {isSupervisorRole
                  ? 'Coordina asignaciones y haz seguimiento al flujo operativo.'
                  : isAnalystRole
                    ? 'Revisa, documenta y actualiza cada caso asignado en tiempo real.'
                    : 'Monitorea el desempeño global y detecta cuellos de botella.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 font-semibold text-dr-dark-gray shadow-sm">
                {statusSummary.total} registradas
              </span>
              {(isSupervisorRole || isAdminRole) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700 shadow-sm">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {unassignedCount} sin asignar
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/80 text-dr-dark-gray shadow-sm hover:bg-white"
              onClick={() => {
                void loadRequests();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {(isSupervisorRole || isAdminRole) && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-dr-blue text-white shadow"
                onClick={() => {
                  const firstPending = requests.find(
                    (request) =>
                      normalizeStatus(request.status) === 'pendiente' &&
                      !resolveRequestAssigneeName(request),
                  );
                  if (firstPending) {
                    handleAssignRequest(firstPending);
                  } else {
                    toast.info('No hay solicitudes pendientes para asignar.');
                  }
                }}
              >
                <UserPlus className="h-4 w-4" />
                Asignar pendiente
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.key}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm"
          >
            <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="text-3xl font-semibold text-dr-dark-gray">{card.value}</p>
            <p className="text-xs text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>

      {!(isSupervisorRole || isAdminRole) && (
        <Alert className="border-gray-200 bg-gray-50">
          <Info className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-gray-700">
            Los analistas pueden revisar y actualizar sus solicitudes asignadas, pero la asignación
            inicial sólo la realizan supervisores o administradores. Si necesita reasignar un caso,
            comuníquelo a su supervisor.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-none bg-gradient-to-br from-white via-slate-50 to-white shadow-xl ring-1 ring-slate-200/70">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-dr-blue">
                Filtros rápidos
              </p>
              <p className="text-base font-semibold text-dr-dark-gray">
                Afina la vista de solicitudes en segundos
              </p>
              <p className="text-xs text-slate-500">
                Combina búsqueda, estado y prioridad para encontrar el caso indicado.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickStatusFilters.map((filter) => {
                const isActive = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'border-transparent bg-dr-blue text-white shadow-lg shadow-dr-blue/30'
                        : 'border-white/70 bg-white/70 text-slate-500 hover:bg-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-dr-blue"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
              <Label htmlFor="search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nombre, cédula o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-none bg-transparent pl-10 text-sm text-dr-dark-gray focus-visible:ring-2 focus-visible:ring-dr-blue"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estado
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-none bg-transparent text-sm text-dr-dark-gray focus:ring-2 focus:ring-dr-blue">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="assigned">Asignado</SelectItem>
                  <SelectItem value="review">En Revisión</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tipo de Solicitud
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-none bg-transparent text-sm text-dr-dark-gray focus:ring-2 focus:ring-dr-blue">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ACTUALIZACION_DATOS">Actualización de Datos</SelectItem>
                  <SelectItem value="address-change">Cambio de Dirección</SelectItem>
                  <SelectItem value="death-notice">Notificación de Fallecimiento</SelectItem>
                  <SelectItem value="MEMBER-INFO-UPDATE">Actualización Info de Miembro</SelectItem>
                  <SelectItem value="name-change">Cambio de Nombre</SelectItem>
                  <SelectItem value="id-change">Actualización de Cédula</SelectItem>
                  <SelectItem value="SOCIAL-AID">Ayuda Social</SelectItem>
                  <SelectItem value="other">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitudes</CardTitle>
              <CardDescription>
                {isLoading ? 'Cargando...' : `${filteredRequests.length} solicitud${filteredRequests.length !== 1 ? 'es' : ''}`} 
                {!isLoading && isAnalystRole ? ' asignada' + (filteredRequests.length !== 1 ? 's' : '') : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadError && (
            <Alert className="m-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {loadError}
              </AlertDescription>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dr-blue mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando solicitudes del sistema...</p>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-500">No hay solicitudes disponibles</p>
              </div>
            </div>
          ) : (
            <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('applicant')}
                    >
                      <div className="flex items-center gap-1">
                        Solicitante
                        {sortField === 'applicant' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Estado
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Cédula
                    </TableHead>
                    <TableHead
                      className="min-w-[200px] cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('assignedTo')}
                    >
                      <div className="flex items-center gap-1">
                        Asignado a
                        {sortField === 'assignedTo' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="hidden lg:table-cell cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Fecha
                        {sortField === 'date' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {request.beneficiary
                            ? `${request.beneficiary.firstName || ''} ${request.beneficiary.lastName || ''}`.trim()
                            : request.applicant || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500 sm:hidden">
                          {request.beneficiary?.nationalId || request.cedula || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {getRequestTypeIcon(request.requestTypeCode || request.type)}
                        <span className="text-sm">{request.requestTypeNameSpanish || request.nameSpanish || getRequestTypeName(request.requestTypeCode || request.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-gray-600">
                      {request.beneficiary?.nationalId || request.cedula || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {request.assignedAnalystName ? (
                        <span className="text-dr-blue font-medium">{request.assignedAnalystName}</span>
                      ) : (
                        <span className="text-gray-500">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {request.submittedAt
                        ? new Date(request.submittedAt).toLocaleDateString('es-DO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : request.date || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                          className="text-dr-blue hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Status change button for supervisors and admins */}
                        {(isSupervisorRole || isAdminRole) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setSelectedNewStatus(String(request.status) || '1');
                              setStatusChangeNotes('');
                              setStatusChangeError(null);
                              setShowStatusChangeModal(true);
                            }}
                            className="text-indigo-600 hover:bg-indigo-50"
                            title="Cambiar estado"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Botón para ver beneficiario relacionado (solo para analistas con solicitudes asignadas) */}
                        {(() => {
                          const assigneeName = resolveRequestAssigneeName(request);
                          const isAssignedToCurrentUser = isAnalystRole && assigneeName && currentUser && (
                            assigneeName.toLowerCase().includes(currentUser.name?.toLowerCase() || '') ||
                            assigneeName.toLowerCase().includes(currentUser.username?.toLowerCase() || '') ||
                            assigneeName.toLowerCase().includes(currentUser.email?.toLowerCase() || '')
                          );

                          return isAssignedToCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Aquí se podría abrir un modal con información del beneficiario
                                // o navegar a una vista específica del beneficiario
                                toast.info('Funcionalidad de beneficiario disponible próximamente');
                              }}
                              className="text-purple-600 hover:bg-purple-50"
                              title="Ver beneficiario relacionado"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          );
                        })()}

                        {/* Assignment button for managers */}
                        {(() => {
                          const assigneeName = resolveRequestAssigneeName(request);
                          const isManager = isSupervisorRole || isAdminRole;
                          const isUnassigned = !assigneeName;
                          const canAssign = isManager && (
                            normalizeStatus(request.status) === 'pendiente' ||
                            normalizeStatus(request.status) === 'asignada' ||
                            normalizeStatus(request.status) === 'en revisión'
                          );

                          return canAssign && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssignRequest(request)}
                              className={`font-medium ${
                                isUnassigned 
                                  ? 'text-green-600 hover:bg-green-50' 
                                  : 'text-orange-600 hover:bg-orange-50'
                              }`}
                              title={isUnassigned ? "Asignar a analista" : "Reasignar analista"}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          );
                        })()}

                        {/* Unassign button for managers */}
                        {(() => {
                          const assigneeName = resolveRequestAssigneeName(request);
                          const isManager = isSupervisorRole || isAdminRole;
                          const isAssigned = !!assigneeName;
                          const canUnassign = isManager && isAssigned && (
                            normalizeStatus(request.status) === 'asignada' ||
                            normalizeStatus(request.status) === 'en revisión'
                          );

                          return canUnassign && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowUnassignModal(true);
                              }}
                              className="text-red-600 hover:bg-red-50"
                              title="Desasignar analista"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          );
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {paginatedRequests.map((request) => (
                <Card key={request.id} className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="font-semibold text-lg text-dr-dark-gray">
                          {request.beneficiary
                            ? `${request.beneficiary.firstName || ''} ${request.beneficiary.lastName || ''}`.trim()
                            : request.applicant || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {request.beneficiary?.nationalId || request.cedula || 'N/A'}
                        </p>
                        {request.externalReference && (
                          <p className="text-xs text-gray-400 mt-1">Ref: {request.externalReference}</p>
                        )}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        {getRequestTypeIcon(request.requestTypeCode || request.type)}
                        <span>{request.requestTypeNameSpanish || request.nameSpanish || getRequestTypeName(request.requestTypeCode || request.type)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {request.submittedAt
                            ? new Date(request.submittedAt).toLocaleDateString('es-DO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : request.date || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-gray-600" />
                        {request.assignedAnalystName ? (
                          <span className="text-dr-blue font-medium text-sm">{request.assignedAnalystName}</span>
                        ) : (
                          <span className="text-gray-500 text-sm">Sin asignar</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRequest(request)}
                        className="flex-1 text-dr-blue border-dr-blue hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver detalles
                      </Button>

                      {(() => {
                        const assigneeName = resolveRequestAssigneeName(request);
                        const isManager = isSupervisorRole || isAdminRole;
                        const canAssign = isManager && (
                          normalizeStatus(request.status) === 'pendiente' ||
                          normalizeStatus(request.status) === 'asignada' ||
                          normalizeStatus(request.status) === 'en revisión'
                        );

                        return canAssign && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignRequest(request)}
                            className={`${
                              !assigneeName
                                ? 'text-green-600 border-green-600 hover:bg-green-50'
                                : 'text-orange-600 border-orange-600 hover:bg-orange-50'
                            }`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {!assigneeName ? 'Asignar' : 'Reasignar'}
                          </Button>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>
          )}

          {/* Pagination */}
          {!isLoading && filteredRequests.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Mostrar</span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 w-20 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">
                    de {filteredRequests.length} solicitudes
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-9"
                  >
                    Primera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-9"
                  >
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                          return true;
                        }
                        return false;
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={`h-9 w-9 ${currentPage === page ? 'bg-dr-blue text-white' : ''}`}
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-9"
                  >
                    Siguiente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-9"
                  >
                    Última
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-dr-blue" />
              Asignar Solicitud
            </DialogTitle>
            <DialogDescription>
              Asigne la solicitud #{selectedRequest?.id} a un analista
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Request Info */}
            {selectedRequest && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Solicitante:</span>
                    <span className="text-sm font-semibold text-dr-dark-gray">{selectedRequest.applicant}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Tipo:</span>
                    <div className="flex items-center gap-2">
                      {getRequestTypeIcon(selectedRequest.type)}
                      <span className="text-sm">{getRequestTypeName(selectedRequest.type)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="analyst">Seleccionar Analista *</Label>
              <Select
                value={selectedAnalyst}
                onValueChange={setSelectedAnalyst}
                disabled={isLoadingAnalysts || analysts.length === 0 || usingFallbackAnalysts}
              >
                <SelectTrigger id="analyst" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingAnalysts
                        ? 'Cargando analistas...'
                        : usingFallbackAnalysts
                          ? 'Sin acceso a analistas disponibles'
                          : 'Seleccione un analista...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingAnalysts ? (
                    <SelectItem value="__loading" disabled>
                      Cargando analistas...
                    </SelectItem>
                  ) : usingFallbackAnalysts ? (
                    <SelectItem value="__no-permission" disabled>
                      Consulte a un supervisor para asignar solicitudes
                    </SelectItem>
                  ) : analysts.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No hay analistas disponibles
                    </SelectItem>
                  ) : (
                    analysts.map((analyst) => {
                      const isOutOfTeam = !isAdminRole && analyst.isSameDepartment === false;
                      const metadata = [analyst.role, analyst.departmentName, analyst.email]
                        .filter(
                          (value): value is string =>
                            typeof value === 'string' && value.trim().length > 0,
                        )
                        .map((value) => value.trim());
                      return (
                        <SelectItem key={analyst.id} value={analyst.id} disabled={isOutOfTeam}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-dr-dark-gray">{analyst.name}</span>
                              {analyst.isSameDepartment && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Mismo Depto.
                                </Badge>
                              )}
                              {isOutOfTeam && (
                                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200">
                                  Otro equipo
                                </Badge>
                              )}
                            </div>
                            {metadata.length > 0 && (
                              <span className="text-xs text-gray-500">{metadata.join(' · ')}</span>
                            )}
                            {isOutOfTeam && (
                              <span className="text-xs text-red-500">
                                Solo puedes asignar solicitudes a analistas de tu equipo.
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {assignDialogError
                  ? assignDialogError
                  : isLoadingAnalysts
                    ? 'Cargando analistas disponibles...'
                    : usingFallbackAnalysts
                      ? 'Necesita permisos de supervisor para asignar solicitudes.'
                      : !isAdminRole && analysts.length > 0
                        ? teamAnalystsCount > 0
                          ? `${teamAnalystsCount} analista${teamAnalystsCount !== 1 ? 's' : ''} de tu equipo disponibles${
                              outOfTeamAnalystsCount > 0
                                ? ` · ${outOfTeamAnalystsCount} fuera de tu equipo`
                                : ''
                            }`
                          : 'No hay analistas de tu equipo disponibles en este momento.'
                        : `${analysts.length} analista${analysts.length !== 1 ? 's' : ''} disponibles`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Comentarios (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agregue comentarios o instrucciones especiales para el analista..."
                value={assignmentNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAssignmentNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {assignDialogError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{assignDialogError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignModal(false)}
              disabled={isSubmittingAssignment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAssignment}
              disabled={!selectedAnalyst || isSubmittingAssignment || usingFallbackAnalysts}
              className="bg-dr-blue hover:bg-dr-blue-dark"
            >
              {isSubmittingAssignment ? 'Asignando...' : 'Asignar Solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Modal */}
      <Dialog open={showUnassignModal} onOpenChange={setShowUnassignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-600" />
              Desasignar Solicitud
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea desasignar la solicitud #{selectedRequest?.id}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Request Info */}
            {selectedRequest && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Solicitante:</span>
                    <span className="text-sm font-semibold text-dr-dark-gray">{selectedRequest.applicant}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Asignado a:</span>
                    <span className="text-sm font-semibold text-dr-blue">
                      {resolveRequestAssigneeName(selectedRequest) || 'Sin asignar'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="unassign-notes">Comentarios (Opcional)</Label>
              <Textarea
                id="unassign-notes"
                placeholder="Agregue comentarios sobre la razón de la desasignación..."
                value={unassignNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUnassignNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnassignModal(false)}
              disabled={isSubmittingAssignment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUnassignRequest}
              disabled={isSubmittingAssignment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmittingAssignment ? 'Desasignando...' : 'Desasignar Solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Modal - Enhanced with Quick Actions */}
      <Dialog open={showStatusChangeModal} onOpenChange={setShowStatusChangeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-indigo-600" />
              Cambiar Estado de Solicitud
            </DialogTitle>
            <DialogDescription>
              Actualice el estado de la solicitud #{selectedRequest?.id?.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Request Info */}
            {selectedRequest && (
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Solicitante:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedRequest.beneficiary
                        ? `${selectedRequest.beneficiary.firstName || ''} ${selectedRequest.beneficiary.lastName || ''}`.trim()
                        : selectedRequest.applicant || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Tipo:</span>
                    <span className="text-sm text-gray-900">
                      {selectedRequest.requestTypeNameSpanish || selectedRequest.requestTypeName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Estado Actual:</span>
                    <div>{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {statusChangeError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm ml-2">
                  {statusChangeError}
                </AlertDescription>
              </Alert>
            )}

            {/* Status Selection */}
            <div className="space-y-2">
              <Label htmlFor="status-select">Estado</Label>
              <Select value={selectedNewStatus} onValueChange={setSelectedNewStatus}>
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Pendiente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span>En Revisión</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Aprobada</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Rechazada</span>
                    </div>
                  </SelectItem>
                  {isAdminRole && (
                    <>
                      <SelectItem value="5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Completada</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="6">
                        <div className="flex items-center gap-2">
                          <X className="h-4 w-4 text-gray-600" />
                          <span>Cancelada</span>
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="status-notes">
                Comentarios
                {(selectedNewStatus === '4' || selectedNewStatus === '6') && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </Label>
              <Textarea
                id="status-notes"
                placeholder={
                  selectedNewStatus === '4'
                    ? 'Explique las razones del rechazo...'
                    : selectedNewStatus === '6'
                      ? 'Explique las razones de la cancelación...'
                      : 'Agregue comentarios sobre el cambio de estado (opcional)...'
                }
                value={statusChangeNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStatusChangeNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
              {(selectedNewStatus === '4' || selectedNewStatus === '6') && (
                <p className="text-xs text-red-500 font-medium">
                  Los comentarios son requeridos para acciones de rechazo o cancelación.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusChangeModal(false);
                setStatusChangeError(null);
                setStatusChangeNotes('');
                setSelectedNewStatus('');
              }}
              disabled={isSubmittingStatusChange}
            >
              Cerrar
            </Button>
            {selectedNewStatus && (
              <Button
                onClick={handleStatusChange}
                disabled={isSubmittingStatusChange || !selectedNewStatus}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmittingStatusChange ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </span>
                ) : (
                  'Aplicar Estado Manual'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0 flex flex-col">
          {/* Header - Fixed */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dr-blue to-dr-blue-light flex items-center justify-center shadow-sm">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold text-dr-dark-gray truncate">
                  Solicitud #{selectedRequest?.id?.substring(0, 8)}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 truncate">
                  {selectedRequest?.requestTypeNameSpanish || selectedRequest?.requestTypeName || selectedRequest?.type || 'Solicitud'} {selectedRequest?.beneficiary && `• ${selectedRequest.beneficiary.firstName} ${selectedRequest.beneficiary.lastName}`}
                </DialogDescription>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {selectedRequest && getStatusBadge(selectedRequest.status)}
                </div>
                {selectedRequest?.submittedAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(selectedRequest.submittedAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {!selectedRequest?.submittedAt && selectedRequest?.date && (
                  <span className="text-xs text-gray-500">
                    {selectedRequest.date}
                  </span>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {selectedRequest && (
            <Tabs defaultValue="solicitud" className="flex-1 flex flex-col min-h-0">
              {/* Tabs Navigation - Fixed */}
              <div className="flex-shrink-0 bg-white border-b px-6 pt-4 pb-2">
                <TabsList className="inline-flex h-10 items-center justify-start gap-1 bg-transparent w-full border-b-0 p-0">
                  <TabsTrigger 
                    value="solicitud" 
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-t-md data-[state=active]:border-dr-blue data-[state=active]:text-dr-blue data-[state=active]:bg-blue-50/50 transition-all hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Solicitud</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="beneficiario" 
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-t-md data-[state=active]:border-dr-blue data-[state=active]:text-dr-blue data-[state=active]:bg-blue-50/50 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent" 
                    disabled={!selectedRequest.beneficiary}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Beneficiario</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hogar" 
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-t-md data-[state=active]:border-dr-blue data-[state=active]:text-dr-blue data-[state=active]:bg-blue-50/50 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent" 
                    disabled={!selectedRequest.beneficiary?.padronData?.found}
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Jefe de Hogar</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="miembros" 
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-t-md data-[state=active]:border-dr-blue data-[state=active]:text-dr-blue data-[state=active]:bg-blue-50/50 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent" 
                    disabled={!selectedRequest.beneficiary?.padronData?.records?.length}
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Miembros</span>
                    {selectedRequest.beneficiary?.padronData?.records?.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs font-semibold">
                        {selectedRequest.beneficiary.padronData.records.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab: Solicitud */}
              <TabsContent value="solicitud" className="flex-1 overflow-y-auto px-6 py-6 space-y-5 m-0 focus-visible:outline-none focus-visible:ring-0">
                  {/* Indicador de Proceso */}
                  <Card className="border-dr-blue/30 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50/50 to-white">
                    <CardHeader className="bg-gradient-to-r from-dr-blue/10 to-white pb-4">
                      <CardTitle className="text-lg font-semibold text-dr-dark-gray flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-dr-blue" />
                        Progreso de la Solicitud
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {(() => {
                        const currentStatus = normalizeStatus(selectedRequest.status);
                        const steps = [
                          { key: 'pendiente', label: 'Recibida', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
                          { key: 'asignada', label: 'Asignada', icon: UserCheck, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
                          { key: 'en revisión', label: 'En Revisión', icon: Eye, color: 'text-indigo-600', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300' },
                          { key: 'aprobada', label: 'Aprobada', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
                          { key: 'completada', label: 'Completada', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' },
                        ];

                        // Determinar el índice del paso actual
                        const currentStepIndex = steps.findIndex(step => step.key === currentStatus);
                        const isRejected = currentStatus === 'rechazada';
                        const isCancelled = currentStatus === 'cancelada';

                        return (
                          <div className="space-y-6">
                            {/* Stepper horizontal para desktop */}
                            <div className="hidden md:flex items-center justify-between relative">
                              {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isCompleted = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const isUpcoming = index > currentStepIndex;

                                return (
                                  <React.Fragment key={step.key}>
                                    <div className="flex flex-col items-center gap-2 relative z-10">
                                      <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                          isCompleted
                                            ? `${step.bgColor} ${step.borderColor} ${step.color}`
                                            : isCurrent
                                            ? `${step.bgColor} ${step.borderColor} ${step.color} ring-4 ring-${step.color.split('-')[1]}-100 shadow-lg`
                                            : 'bg-gray-100 border-gray-300 text-gray-400'
                                        }`}
                                      >
                                        {isCompleted ? (
                                          <Check className="h-6 w-6" />
                                        ) : (
                                          <StepIcon className="h-6 w-6" />
                                        )}
                                      </div>
                                      <div className="text-center">
                                        <p
                                          className={`text-xs font-semibold ${
                                            isCompleted || isCurrent ? 'text-dr-dark-gray' : 'text-gray-400'
                                          }`}
                                        >
                                          {step.label}
                                        </p>
                                      </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                      <div
                                        className={`flex-1 h-0.5 mx-2 transition-all ${
                                          index < currentStepIndex ? 'bg-dr-blue' : 'bg-gray-300'
                                        }`}
                                      />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>

                            {/* Stepper vertical para móvil */}
                            <div className="md:hidden space-y-4">
                              {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isCompleted = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const isUpcoming = index > currentStepIndex;

                                return (
                                  <div key={step.key} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                      <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                          isCompleted
                                            ? `${step.bgColor} ${step.borderColor} ${step.color}`
                                            : isCurrent
                                            ? `${step.bgColor} ${step.borderColor} ${step.color} ring-4 ring-${step.color.split('-')[1]}-100`
                                            : 'bg-gray-100 border-gray-300 text-gray-400'
                                        }`}
                                      >
                                        {isCompleted ? (
                                          <Check className="h-5 w-5" />
                                        ) : (
                                          <StepIcon className="h-5 w-5" />
                                        )}
                                      </div>
                                      {index < steps.length - 1 && (
                                        <div
                                          className={`w-0.5 h-8 my-1 transition-all ${
                                            index < currentStepIndex ? 'bg-dr-blue' : 'bg-gray-300'
                                          }`}
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1 pt-2">
                                      <p
                                        className={`text-sm font-semibold ${
                                          isCompleted || isCurrent ? 'text-dr-dark-gray' : 'text-gray-400'
                                        }`}
                                      >
                                        {step.label}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Estados especiales: Rechazada o Cancelada */}
                            {(isRejected || isCancelled) && (
                              <div className={`mt-4 p-4 rounded-lg border-2 ${isRejected ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'}`}>
                                <div className="flex items-center gap-2">
                                  <XCircle className={`h-5 w-5 ${isRejected ? 'text-red-600' : 'text-gray-600'}`} />
                                  <p className={`font-semibold ${isRejected ? 'text-red-700' : 'text-gray-700'}`}>
                                    Solicitud {isRejected ? 'Rechazada' : 'Cancelada'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Información de la Solicitud */}
                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-4">
                      <CardTitle className="text-lg font-semibold text-dr-dark-gray flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-dr-blue" />
                        Información de la Solicitud
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Tipo de Solicitud</p>
                          <p className="text-base text-dr-dark-gray font-bold">
                            {selectedRequest.requestTypeNameSpanish || selectedRequest.requestTypeName || getRequestTypeName(selectedRequest.requestTypeCode || selectedRequest.type) || '—'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Estado</p>
                          {getStatusBadge(selectedRequest.status)}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Fecha de Recepción</p>
                          <p className="text-base text-dr-dark-gray font-bold">
                            {selectedRequest.submittedAt ? new Date(selectedRequest.submittedAt).toLocaleString('es-DO') : (selectedRequest.date || '—')}
                          </p>
                        </div>
                        {selectedRequest.externalReference && (
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Referencia Externa</p>
                            <p className="text-base text-dr-dark-gray font-bold font-mono bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                              {selectedRequest.externalReference}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notas */}
                  {(selectedRequest.notes || selectedRequest.reason) && (
                    <Card className="border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-white pb-4">
                        <CardTitle className="text-lg font-semibold text-dr-dark-gray flex items-center gap-2">
                          <FileText className="h-5 w-5 text-amber-600" />
                          {selectedRequest.notes ? 'Notas de la Solicitud' : 'Razón de la Solicitud'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-base text-gray-700 bg-amber-50 border border-amber-200 p-4 rounded-lg whitespace-pre-wrap leading-relaxed">
                          {selectedRequest.notes || selectedRequest.reason}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Detalles adicionales */}
                  {(selectedRequest.description || selectedRequest.householdSize || selectedRequest.monthlyIncome) && (
                    <Card className="border-gray-200 shadow-sm">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-white pb-3">
                        <CardTitle className="text-base font-semibold text-dr-dark-gray flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          Detalles Adicionales
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {selectedRequest.description && (
                            <div className="space-y-2">
                              <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Descripción</p>
                              <div className="text-base text-gray-800 bg-gray-50 p-4 rounded-lg font-medium leading-relaxed">
                                {selectedRequest.description}
                              </div>
                            </div>
                          )}
                          
                          <div className="grid gap-4 sm:grid-cols-2">
                            {selectedRequest.householdSize && (
                              <div className="space-y-2">
                                <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Miembros del Hogar</p>
                                <p className="text-base text-dr-dark-gray font-bold">
                                  {selectedRequest.householdSize} personas
                                </p>
                              </div>
                            )}
                            
                            {selectedRequest.monthlyIncome && (
                              <div className="space-y-2">
                                <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Ingresos Mensuales</p>
                                <p className="text-base text-dr-dark-gray font-bold">
                                  {selectedRequest.monthlyIncome}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Documentos */}
                  {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                    <Card className="border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-orange-50 to-white pb-4">
                        <CardTitle className="text-lg font-semibold text-dr-dark-gray flex items-center gap-2">
                          <Upload className="h-5 w-5 text-orange-600" />
                          Documentos Adjuntos ({selectedRequest.documents.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {selectedRequest.documents.map((doc: any, index: number) => {
                            const docName = typeof doc === 'string' ? doc : (doc?.fileName || 'Documento sin nombre');
                            const docSize = typeof doc === 'object' && doc?.fileSizeBytes ? `${(doc.fileSizeBytes / 1024).toFixed(1)} KB` : '';
                            const docUrl = typeof doc === 'object' ? doc?.storageUri : null;
                            const contentType = typeof doc === 'object' ? doc?.contentType : null;
                            const isPdf = contentType?.includes('pdf');
                            const isImage = contentType?.includes('image');
                            
                            return (
                              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {isPdf ? (
                                      <FileText className="h-5 w-5 text-red-600" />
                                    ) : isImage ? (
                                      <FileText className="h-5 w-5 text-blue-600" />
                                    ) : (
                                      <FileText className="h-5 w-5 text-orange-600" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base text-dr-dark-gray font-bold truncate">{docName}</p>
                                    {docSize && (
                                      <p className="text-xs text-gray-500 font-medium mt-0.5">{docSize}</p>
                                    )}
                                  </div>
                                </div>
                                
                                {docUrl && (
                                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                    {/* Botón Preview */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(docUrl, '_blank')}
                                      className="h-9 px-3 border-dr-blue text-dr-blue hover:bg-dr-blue hover:text-white transition-all"
                                    >
                                      <Eye className="h-4 w-4 mr-1.5" />
                                      <span className="hidden sm:inline">Ver</span>
                                    </Button>
                                    
                                    {/* Botón Descargar */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = docUrl;
                                        link.download = docName;
                                        link.target = '_blank';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="h-9 px-3 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all"
                                    >
                                      <Download className="h-4 w-4 mr-1.5" />
                                      <span className="hidden sm:inline">Descargar</span>
                                    </Button>
                                  </div>
                                )}
                                
                                {!docUrl && (
                                  <Badge variant="secondary" className="ml-4">
                                    Sin URL
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Asignación */}
                  {(selectedRequest.assignedAnalystName || selectedRequest.assignedByName || selectedRequest.assignedTo) && (
                    <Card className="border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white pb-4">
                        <CardTitle className="text-lg font-semibold text-dr-dark-gray flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-indigo-600" />
                          Información de Asignación
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {(selectedRequest.assignedAnalystName || selectedRequest.assignedTo) && (
                            <div className="space-y-2">
                              <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Asignado a</p>
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-dr-blue font-bold text-base">{selectedRequest.assignedAnalystName || selectedRequest.assignedTo}</p>
                              </div>
                            </div>
                          )}
                          {(selectedRequest.assignedByName || selectedRequest.reviewedBy) && (
                            <div className="space-y-2">
                              <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">{selectedRequest.assignedByName ? 'Asignado por' : 'Revisado por'}</p>
                              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-green-700 font-bold text-base">{selectedRequest.assignedByName || selectedRequest.reviewedBy}</p>
                              </div>
                            </div>
                          )}
                          {selectedRequest.assignedAt && (
                            <div className="space-y-2">
                              <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Fecha de Asignación</p>
                              <p className="text-base text-dr-dark-gray font-bold">
                                {new Date(selectedRequest.assignedAt).toLocaleString('es-DO')}
                              </p>
                            </div>
                          )}
                          {selectedRequest.assignmentNotes && (
                            <div className="space-y-2 sm:col-span-2">
                              <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Notas de Asignación</p>
                              <div className="text-base text-gray-800 bg-gray-50 p-4 rounded-lg font-medium leading-relaxed">
                                {selectedRequest.assignmentNotes}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Alerta cuando no hay información del padrón */}
                  {selectedRequest.beneficiary && (!selectedRequest.beneficiary.padronData || !selectedRequest.beneficiary.padronData.found) && (
                    <Alert className="border-amber-200 bg-amber-50/80">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <AlertDescription className="text-amber-800 font-medium ml-2">
                        <span className="font-bold">Información del Padrón no disponible.</span> Este beneficiario no tiene datos asociados en el padrón nacional.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

              {/* Tab: Beneficiario */}
              <TabsContent value="beneficiario" className="flex-1 overflow-y-auto px-6 py-6 m-0 focus-visible:outline-none focus-visible:ring-0">
                  {selectedRequest.beneficiary ? (
                    <Card className="border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-4">
                        <CardTitle className="text-lg font-semibold text-dr-dark-gray flex items-center gap-2">
                          <FileUser className="h-5 w-5 text-purple-600" />
                          Datos del Beneficiario
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Nombre Completo</p>
                            <p className="text-base text-dr-dark-gray font-bold">
                              {selectedRequest.beneficiary.firstName} {selectedRequest.beneficiary.lastName}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Cédula</p>
                            <p className="text-base text-dr-dark-gray font-bold font-mono bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                              {selectedRequest.beneficiary.nationalId || '—'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              Email
                            </p>
                            <p className="text-base text-dr-dark-gray font-bold">
                              {selectedRequest.beneficiary.email || '—'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Teléfono
                            </p>
                            <p className="text-base text-dr-dark-gray font-bold font-mono">
                              {selectedRequest.beneficiary.phoneNumber || '—'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Fecha de Nacimiento
                            </p>
                            <p className="text-base text-dr-dark-gray font-bold">
                              {selectedRequest.beneficiary.dateOfBirth ? new Date(selectedRequest.beneficiary.dateOfBirth).toLocaleDateString('es-DO') : '—'}
                            </p>
                          </div>
                        </div>
                        {selectedRequest.beneficiary.notes && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Notas</p>
                            <div className="text-base text-gray-800 bg-gray-50 p-4 rounded-lg font-medium leading-relaxed">
                              {selectedRequest.beneficiary.notes}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-gray-200 shadow-sm">
                      <CardContent className="pt-12 pb-12 text-center">
                        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg text-gray-500 font-medium">No hay información del beneficiario disponible</p>
                        <p className="text-sm text-gray-400 mt-2">Esta solicitud no tiene un beneficiario asociado</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

              {/* Tab: Jefe de Hogar */}
              <TabsContent value="hogar" className="flex-1 overflow-y-auto px-6 py-6 m-0 focus-visible:outline-none focus-visible:ring-0">
                  {selectedRequest.beneficiary?.padronData?.headOfHousehold ? (
                    <Card className="border-green-200 bg-green-50/30 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-dr-dark-gray flex items-center gap-2">
                          <Home className="h-5 w-5 text-green-600" />
                          Jefe de Hogar
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Nombre Completo</p>
                            <p className="text-base text-dr-dark-gray font-bold">
                              {selectedRequest.beneficiary.padronData.headOfHousehold.firstName} {selectedRequest.beneficiary.padronData.headOfHousehold.lastName}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Cédula</p>
                            <p className="text-base text-dr-dark-gray font-bold font-mono bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                              {selectedRequest.beneficiary.padronData.headOfHousehold.nationalId || '—'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Sexo</p>
                            <p className="text-base text-dr-dark-gray font-bold">
                              {selectedRequest.beneficiary.padronData.headOfHousehold.sex || '—'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Nivel de Pobreza</p>
                            <Badge variant={selectedRequest.beneficiary.padronData.headOfHousehold.povertyLevel === '1' ? 'destructive' : 'secondary'} className="text-sm font-bold">
                              Nivel {selectedRequest.beneficiary.padronData.headOfHousehold.povertyLevel || '—'}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Provincia</p>
                            <p className="text-base text-dr-dark-gray font-bold">
                              {selectedRequest.beneficiary.padronData.headOfHousehold.province || '—'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Municipio</p>
                            <p className="text-base text-dr-dark-gray font-bold">
                              {selectedRequest.beneficiary.padronData.headOfHousehold.municipality || '—'}
                            </p>
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Dirección</p>
                            <p className="text-base text-dr-dark-gray font-bold">
                              {selectedRequest.beneficiary.padronData.headOfHousehold.address || '—'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-gray-200 shadow-sm">
                      <CardContent className="pt-12 pb-12 text-center">
                        <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg text-gray-500 font-medium">No hay información del jefe de hogar disponible</p>
                        <p className="text-sm text-gray-400 mt-2">No se encontraron datos del padrón para este beneficiario</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

              {/* Tab: Miembros */}
              <TabsContent value="miembros" className="flex-1 overflow-y-auto px-6 py-6 m-0 focus-visible:outline-none focus-visible:ring-0">
                  {selectedRequest.beneficiary?.padronData?.records && selectedRequest.beneficiary.padronData.records.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRequest.beneficiary.padronData.records.map((record: any, index: number) => (
                        <Card key={index} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-white">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-base font-bold shadow-md">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold text-dr-dark-gray mb-1">
                                  {record.firstName} {record.lastName}
                                </CardTitle>
                                <p className="text-sm text-gray-600 font-medium">{record.relationship || 'Sin relación especificada'}</p>
                              </div>
                              {record.isHeadOfHousehold && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">
                                  Jefe de Hogar
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                              <div className="space-y-2">
                                <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Cédula</p>
                                <p className="text-base text-dr-dark-gray font-bold font-mono">{record.nationalId || '—'}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Sexo</p>
                                <p className="text-base text-dr-dark-gray font-bold">{record.sex || '—'}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-extrabold uppercase text-gray-700 tracking-wide">Nivel Educativo</p>
                                <p className="text-base text-dr-dark-gray font-bold">{record.educationLevel || '—'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-gray-200 shadow-sm">
                      <CardContent className="pt-12 pb-12 text-center">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg text-gray-500 font-medium">No hay miembros del hogar disponibles</p>
                        <p className="text-sm text-gray-400 mt-2">No se encontraron registros de miembros del hogar</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
          )}

          {/* Action Buttons for Analysts - Fixed Footer */}
          {selectedRequest && isAnalystRole && selectedRequest.assignedTo === currentUser.name && 
           selectedRequest.status === 'assigned' && (
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleUpdateRequestStatus(selectedRequest.id, 'review');
                    setShowViewModal(false);
                  }}
                  className="bg-white hover:bg-dr-blue hover:text-white hover:border-dr-blue transition-all"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Iniciar Revisión
                </Button>
                
                <Button
                  onClick={() => {
                    handleUpdateRequestStatus(selectedRequest.id, 'approved');
                    setShowViewModal(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    handleUpdateRequestStatus(selectedRequest.id, 'rejected');
                    setShowViewModal(false);
                  }}
                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-all"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Beneficiaries Page

const formatBeneficiaryDate = (value?: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const buildBeneficiaryName = (beneficiary: BeneficiaryDto): string => {
  const firstName = typeof beneficiary.firstName === 'string' ? beneficiary.firstName.trim() : '';
  const lastName = typeof beneficiary.lastName === 'string' ? beneficiary.lastName.trim() : '';
  const full = `${firstName} ${lastName}`.trim();
  return full || 'Sin nombre registrado';
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeStringCandidate = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
};

const cleanLabelValue = (value: string): string =>
  value.replace(/^(analista|asignado|assigned|usuario|user)\s*[:\-]\s*/i, '').trim();

const PERSON_NAME_KEYS = ['fullName', 'name', 'displayName', 'username', 'userName'];
const PERSON_EMAIL_KEYS = ['email', 'userEmail', 'mail', 'preferred_username'];
const PERSON_ID_KEYS = ['id', 'userId', 'code', 'employeeId', 'accountId', 'userCode'];

const ANALYST_STRING_KEYS = [
  'assignedAnalystName',
  'assignedAnalyst',
  'analystName',
  'assignedTo',
  'assignedToName',
  'assignedUser',
  'assignedUserName',
  'analyst',
];
const ANALYST_OBJECT_KEYS = [
  'assignedAnalyst',
  'assignedTo',
  'analyst',
  'assignedUser',
  'assignee',
  'currentAnalyst',
  'assignmentAnalyst',
];

const SUPERVISOR_STRING_KEYS = [
  'assignedByName',
  'assignedBy',
  'supervisorName',
  'assignedSupervisorName',
  'managerName',
];
const SUPERVISOR_OBJECT_KEYS = ['assignedBy', 'assignedSupervisor', 'supervisor', 'manager'];

const ASSIGNMENT_DATE_KEYS = [
  'assignmentDate',
  'assignedAt',
  'assignedDate',
  'assignedOn',
  'analystAssignedAt',
];
const ASSIGNMENT_NOTES_KEYS = ['assignmentNotes', 'assignedNotes', 'notes'];

interface PersonInfo {
  name: string | null;
  email: string | null;
  id: string | null;
}

interface BeneficiaryAssignmentInfo {
  analystName: string | null;
  analystEmail: string | null;
  analystId: string | null;
  supervisorName: string | null;
  supervisorId: string | null;
  assignmentDate: string | null;
  notes: string | null;
}

const extractPersonInfo = (value: unknown): PersonInfo => {
  const info: PersonInfo = { name: null, email: null, id: null };

  if (value === null || value === undefined) {
    return info;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const str = String(value).trim();
    if (!str) {
      return info;
    }
    if (str.includes('@')) {
      info.email = str.toLowerCase();
    }
    if (!info.name) {
      info.name = cleanLabelValue(str);
    }
    if (!info.id && /^[\w-]+$/.test(str) && str.length >= 6) {
      info.id = str;
    }
    return info;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = extractPersonInfo(entry);
      if (!info.name && nested.name) info.name = nested.name;
      if (!info.email && nested.email) info.email = nested.email;
      if (!info.id && nested.id) info.id = nested.id;
      if (info.name && info.email && info.id) {
        break;
      }
    }
    return info;
  }

  if (!isPlainObject(value)) {
    return info;
  }

  const pickFromRecord = (record: Record<string, unknown>, keys: string[]): string | null => {
    for (const key of keys) {
      const candidate = normalizeStringCandidate(record[key]);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  };

  const record = value;
  const nameCandidate = pickFromRecord(record, PERSON_NAME_KEYS);
  if (nameCandidate && !info.name) {
    info.name = cleanLabelValue(nameCandidate);
  }

  const emailCandidate = pickFromRecord(record, PERSON_EMAIL_KEYS);
  if (emailCandidate && !info.email) {
    info.email = emailCandidate.toLowerCase();
  }

  const idCandidate = pickFromRecord(record, PERSON_ID_KEYS);
  if (idCandidate && !info.id) {
    info.id = idCandidate;
  }

  if (info.name && info.email && info.id) {
    return info;
  }

  for (const nested of Object.values(record)) {
    if (!isPlainObject(nested) && !Array.isArray(nested)) {
      continue;
    }
    const nestedInfo = extractPersonInfo(nested);
    if (!info.name && nestedInfo.name) info.name = nestedInfo.name;
    if (!info.email && nestedInfo.email) info.email = nestedInfo.email;
    if (!info.id && nestedInfo.id) info.id = nestedInfo.id;
    if (info.name && info.email && info.id) {
      break;
    }
  }

  return info;
};

const extractBeneficiaryAssignmentInfo = (beneficiary: BeneficiaryDto): BeneficiaryAssignmentInfo => {
  const record = beneficiary as Record<string, unknown>;
  const info: BeneficiaryAssignmentInfo = {
    analystName: null,
    analystEmail: null,
    analystId: null,
    supervisorName: null,
    supervisorId: null,
    assignmentDate: null,
    notes: null,
  };

  const assignAnalystFromValue = (value: unknown) => {
    const person = extractPersonInfo(value);
    if (person.name && !info.analystName) {
      info.analystName = cleanLabelValue(person.name);
    }
    if (person.email && !info.analystEmail) {
      info.analystEmail = person.email;
    }
    if (person.id && !info.analystId) {
      info.analystId = person.id;
    }
  };

  const assignSupervisorFromValue = (value: unknown) => {
    const person = extractPersonInfo(value);
    if (person.name && !info.supervisorName) {
      info.supervisorName = cleanLabelValue(person.name);
    }
    if (person.id && !info.supervisorId) {
      info.supervisorId = person.id;
    }
  };

  for (const key of ANALYST_STRING_KEYS) {
    if (info.analystName && info.analystEmail && info.analystId) {
      break;
    }
    assignAnalystFromValue(record[key]);
  }

  for (const key of ANALYST_OBJECT_KEYS) {
    if (info.analystName && info.analystEmail && info.analystId) {
      break;
    }
    assignAnalystFromValue(record[key]);
  }

  assignAnalystFromValue(beneficiary.assignedAnalyst);
  assignAnalystFromValue(beneficiary.assignedTo);
  assignAnalystFromValue(beneficiary.assignedAnalystName);
  assignAnalystFromValue(beneficiary.assignedAnalystEmail);
  assignAnalystFromValue(beneficiary.assignedAnalystId);

  for (const key of SUPERVISOR_STRING_KEYS) {
    if (info.supervisorName && info.supervisorId) {
      break;
    }
    assignSupervisorFromValue(record[key]);
  }

  for (const key of SUPERVISOR_OBJECT_KEYS) {
    if (info.supervisorName && info.supervisorId) {
      break;
    }
    assignSupervisorFromValue(record[key]);
  }

  assignSupervisorFromValue(beneficiary.assignedSupervisor);
  assignSupervisorFromValue(beneficiary.assignedSupervisorName);
  assignSupervisorFromValue(beneficiary.assignedSupervisorId);

  if (record.assignment && isPlainObject(record.assignment)) {
    const assignment = record.assignment as Record<string, unknown>;
    assignAnalystFromValue(assignment.analyst);
    assignSupervisorFromValue(assignment.supervisor);
    assignSupervisorFromValue(assignment.assignedBy);
  }

  const assignmentDateCandidates = [
    beneficiary.assignmentDate,
    ...ASSIGNMENT_DATE_KEYS.map((key) => normalizeStringCandidate(record[key])),
  ].filter((candidate): candidate is string => Boolean(candidate));
  info.assignmentDate = assignmentDateCandidates[0] ?? null;

  const notesCandidates = [
    beneficiary.assignmentNotes,
    ...ASSIGNMENT_NOTES_KEYS.map((key) => normalizeStringCandidate(record[key])),
  ].filter((candidate): candidate is string => Boolean(candidate));
  info.notes = notesCandidates[0] ?? null;

  if (info.analystName) {
    info.analystName = cleanLabelValue(info.analystName);
  }
  if (info.supervisorName) {
    info.supervisorName = cleanLabelValue(info.supervisorName);
  }

  return info;
};

const matchAssignmentToTokens = (
  assignment: BeneficiaryAssignmentInfo,
  tokens: string[],
): boolean => {
  if (tokens.length === 0) {
    return true;
  }
  const values = [assignment.analystName, assignment.analystEmail, assignment.analystId]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
  if (values.length === 0) {
    return false;
  }
  return values.some((value) => tokens.some((token) => value.includes(token)));
};

const resolveAdminUserIdentifier = (user: AdminUserDto): string | null => {
  const record = user as Record<string, unknown>;
  const keys = ['id', 'userId', 'username', 'userName', 'email', 'code'];
  for (const key of keys) {
    const candidate = normalizeStringCandidate(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

const resolveAdminUserName = (user: AdminUserDto): string | null => {
  const record = user as Record<string, unknown>;
  for (const key of PERSON_NAME_KEYS) {
    const candidate = normalizeStringCandidate(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return resolveAdminUserIdentifier(user);
};

const resolveBeneficiaryIdentifier = (beneficiary: BeneficiaryDto): string | null => {
  if (typeof beneficiary.id === 'string' && beneficiary.id.trim()) {
    return beneficiary.id.trim();
  }
  if (typeof beneficiary.id === 'number') {
    return String(beneficiary.id);
  }
  const record = beneficiary as Record<string, unknown>;
  const keys = ['beneficiaryId', 'code', 'uuid', 'identifier', 'externalId'];
  for (const key of keys) {
    const candidate = normalizeStringCandidate(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

const resolveAdminUserRole = (user: AdminUserDto): string | null => {
  const record = user as Record<string, unknown>;
  const keys = ['role', 'roleName', 'roleKey', 'roleDescription', 'position', 'jobTitle'];
  for (const key of keys) {
    const candidate = normalizeStringCandidate(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

const resolveAdminUserDepartment = (user: AdminUserDto): string | null => {
  const record = user as Record<string, unknown>;
  const departmentKeys = [
    'departmentName',
    'department',
    'area',
    'areaName',
    'region',
    'office',
    'officeName',
    'unidad',
  ];
  for (const key of departmentKeys) {
    const candidate = normalizeStringCandidate(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

const mapAdminUsersToAnalystOptions = (
  users: AdminUserDto[],
  currentUser?: CurrentUser | null,
): AnalystOption[] => {
  const preferredTokens = ['analist', 'analista', 'analyst', 'gestor', 'coordinador', 'supervisor'];
  const preferred: AnalystOption[] = [];
  const secondary: AnalystOption[] = [];

  const buildOption = (user: AdminUserDto): AnalystOption | null => {
    const person = extractPersonInfo(user);
    const identifier =
      resolveAdminUserIdentifier(user) ?? person.id ?? person.email ?? person.name;
    if (!identifier) {
      return null;
    }

    const name = resolveAdminUserName(user) ?? person.name ?? identifier;
    const email = person.email ?? undefined;
    const role = resolveAdminUserRole(user) ?? undefined;
    const departmentName = resolveAdminUserDepartment(user);

    return {
      id: identifier,
      name,
      email,
      role,
      departmentName,
    };
  };

  for (const user of users) {
    const option = buildOption(user);
    if (!option) {
      continue;
    }

    const normalizedRole = option.role ? option.role.toLowerCase() : '';
    if (normalizedRole && preferredTokens.some((token) => normalizedRole.includes(token))) {
      preferred.push(option);
    } else {
      secondary.push(option);
    }
  }

  const normalizeDepartment = (value?: string | null): string | null =>
    value && value.trim() ? value.trim().toLowerCase() : null;

  const preferredDepartment = normalizeDepartment(currentUser?.departmentName);

  const orderByDepartmentPreference = (options: AnalystOption[]): AnalystOption[] => {
    if (!preferredDepartment) {
      return options;
    }
    const matches: AnalystOption[] = [];
    const rest: AnalystOption[] = [];
    for (const option of options) {
      if (normalizeDepartment(option.departmentName) === preferredDepartment) {
        matches.push(option);
      } else {
        rest.push(option);
      }
    }
    return [...matches, ...rest];
  };

  const ordered = [
    ...orderByDepartmentPreference(preferred),
    ...orderByDepartmentPreference(secondary),
  ];

  const uniqueMap = new Map<string, AnalystOption>();
  for (const analyst of ordered) {
    if (!uniqueMap.has(analyst.id)) {
      uniqueMap.set(analyst.id, analyst);
    }
  }

  return Array.from(uniqueMap.values());
};

const REQUEST_ASSIGNEE_STRING_KEYS = [
  'assignedTo',
  'assignedToName',
  'assignedToUserName',
  'assignedAnalystName',
  'assignedUserName',
  'analystName',
];

const REQUEST_ASSIGNEE_OBJECT_KEYS = [
  'assignedAnalyst',
  'assignedUser',
  'assignedToUser',
  'analyst',
];

const extractRequestAssigneeInfo = (request: RequestDto): PersonInfo => {
  const info: PersonInfo = { name: null, email: null, id: null };
  const record = request as Record<string, unknown>;

  for (const key of REQUEST_ASSIGNEE_STRING_KEYS) {
    const candidate = normalizeStringCandidate(record[key]);
    if (candidate && !info.name) {
      info.name = cleanLabelValue(candidate);
    }
  }

  for (const key of REQUEST_ASSIGNEE_OBJECT_KEYS) {
    const value = record[key];
    if (!value) continue;
    const person = extractPersonInfo(value);
    if (person.name && !info.name) {
      info.name = cleanLabelValue(person.name);
    }
    if (person.email && !info.email) {
      info.email = person.email;
    }
    if (person.id && !info.id) {
      info.id = person.id;
    }
  }

  return info;
};

const resolveRequestAssigneeName = (request: RequestDto): string | null => {
  const info = extractRequestAssigneeInfo(request);
  return info.name;
};

const resolveRequestId = (request: RequestDto): string | null => {
  if (typeof request.id === 'string' && request.id.trim()) {
    return request.id.trim();
  }
  if (typeof request.id === 'number') {
    return String(request.id);
  }
  const record = request as Record<string, unknown>;
  const fallbackKeys = ['requestId', 'code', 'uuid'];
  for (const key of fallbackKeys) {
    const candidate = normalizeStringCandidate(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

interface AnalystOption {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  departmentName?: string | null;
  isSameDepartment?: boolean;
}

const FALLBACK_ANALYST_OPTIONS: AnalystOption[] = availableAnalysts.map((analyst) => ({
  id: analyst.id,
  name: analyst.name,
  email: null,
  role: analyst.role,
  departmentName: null,
}));


// Notifications Page
export function NotificationsPage({ currentUser, authToken }: PageProps) {
  const { notifications, unreadCount, isLoading, error, refresh, markAsRead, markAllAsRead } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Filtrar notificaciones
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filtro de búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower) ||
          notification.type.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro de tipo
      if (typeFilter !== 'all' && notification.type !== typeFilter) {
        return false;
      }

      // Filtro de prioridad
      if (priorityFilter !== 'all' && notification.priority !== priorityFilter) {
        return false;
      }

      // Filtro de estado
      if (statusFilter === 'read' && !notification.read) return false;
      if (statusFilter === 'unread' && notification.read) return false;

      // Filtro de fecha
      if (dateFilter !== 'all') {
        const notificationDate = new Date(notification.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            if (diffDays > 0) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [notifications, searchTerm, typeFilter, priorityFilter, statusFilter, dateFilter]);

  // Obtener tipos únicos de notificaciones
  const notificationTypes = useMemo(() => {
    const types = new Set(notifications.map(n => n.type));
    return Array.from(types);
  }, [notifications]);

  const pendingCopy = unreadCount === 1 ? 'notificación pendiente' : 'notificaciones pendientes';

  const todayCount = useMemo(() => {
    if (notifications.length === 0) {
      return 0;
    }
    const today = new Date().toDateString();
    return notifications.filter((notification) => {
      if (!notification.createdAt) {
        return false;
      }
      const date = new Date(notification.createdAt);
      if (Number.isNaN(date.getTime())) {
        return false;
      }
      return date.toDateString() === today;
    }).length;
  }, [notifications]);

  const latestNotificationDate = useMemo(() => {
    if (notifications.length === 0) {
      return null;
    }
    let latest: Date | null = null;
    for (const notification of notifications) {
      if (!notification.createdAt) {
        continue;
      }
      const date = new Date(notification.createdAt);
      if (Number.isNaN(date.getTime())) {
        continue;
      }
      if (!latest || date > latest) {
        latest = date;
      }
    }
    return latest;
  }, [notifications]);

  const lastUpdatedText = useMemo(() => {
    if (!latestNotificationDate) {
      return 'Sin registros recientes';
    }
    const diffMs = Date.now() - latestNotificationDate.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) {
      return 'Hace instantes';
    }
    if (minutes < 60) {
      return `Hace ${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Hace ${hours} h`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `Hace ${days} d`;
    }
    return latestNotificationDate.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [latestNotificationDate]);

  const summaryCards = useMemo(
    () => [
      {
        key: 'unread',
        label: 'Sin leer',
        value: unreadCount,
        helper: pendingCopy,
        icon: <BellRing className="h-5 w-5 text-dr-blue" />,
      },
      {
        key: 'today',
        label: 'Hoy',
        value: todayCount,
        helper: 'Ingresaron hoy',
        icon: <Calendar className="h-5 w-5 text-emerald-600" />,
      },
      {
        key: 'latest',
        label: 'Última sincronización',
        value: lastUpdatedText,
        helper: 'Registro más reciente',
        icon: <RefreshCw className="h-5 w-5 text-slate-500" />,
      },
    ],
    [pendingCopy, todayCount, unreadCount, lastUpdatedText],
  );


  const quickStatusFilters = [
    { label: 'Todas', value: 'all' },
    { label: 'Sin leer', value: 'unread' },
    { label: 'Leídas', value: 'read' },
  ];

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'border-red-200 bg-red-50 text-red-700',
      medium: 'border-yellow-200 bg-yellow-50 text-yellow-700',
      low: 'border-blue-200 bg-blue-50 text-blue-700'
    };
    const baseStyles = colors[priority as keyof typeof colors] || 'border-slate-200 bg-slate-50 text-slate-700';
    return (
      <Badge className={`${baseStyles} text-xs font-medium`}>
        {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
      </Badge>
    );
  };

  const formatNotificationTypeLabel = (type?: string) => {
    const normalized =
      type?.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-') ?? 'general';
    switch (normalized) {
      case 'request':
        return 'Solicitudes';
      case 'request-assignment':
        return 'Asignaciones';
      case 'request-unassigned':
        return 'Asignación pendiente';
      case 'system':
        return 'Sistema';
      case 'alert':
        return 'Alertas';
      case 'approval':
        return 'Aprobaciones';
      case 'assignment':
        return 'Asignaciones';
      default:
        return normalized
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };

  const getTypeConfig = (type?: string) => {
    const normalizedType =
      type?.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-') ?? 'general';

    switch (normalizedType) {
      case 'request':
        return {
          label: 'Solicitud',
          icon: <ClipboardList className="h-4 w-4" />,
          avatarBg: 'bg-blue-100 text-blue-700 border-blue-200',
          badgeClass: 'border-blue-200 bg-blue-50 text-blue-700'
        };
      case 'request-assignment':
        return {
          label: 'Asignación',
          icon: <UserCheck className="h-4 w-4" />,
          avatarBg: 'bg-amber-100 text-amber-700 border-amber-200',
          badgeClass: 'border-amber-200 bg-amber-50 text-amber-700'
        };
      case 'request-unassigned':
        return {
          label: 'Asignación pendiente',
          icon: <UserMinus className="h-4 w-4" />,
          avatarBg: 'bg-rose-100 text-rose-700 border-rose-200',
          badgeClass: 'border-rose-200 bg-rose-50 text-rose-700'
        };
      case 'system':
        return {
          label: 'Sistema',
          icon: <Settings className="h-4 w-4" />,
          avatarBg: 'bg-slate-100 text-slate-700 border-slate-200',
          badgeClass: 'border-slate-200 bg-slate-50 text-slate-700'
        };
      default:
        const friendlyName =
          normalizedType
            .split(/[\s\-]+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') || 'General';
        return {
          label: friendlyName,
          icon: <Bell className="h-4 w-4" />,
          avatarBg: 'bg-gray-100 text-gray-600 border-gray-200',
          badgeClass: 'border-gray-200 bg-gray-50 text-gray-700'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const summaryVisuals: Record<
    string,
    { accent: string; border: string; iconBg: string; shadow: string; chip: string }
  > = {
    unread: {
      accent: 'from-dr-blue/80 via-sky-500/70 to-indigo-500/60',
      border: 'border-dr-blue/20',
      iconBg: 'bg-dr-blue/10 text-dr-blue border-dr-blue/20',
      shadow: 'shadow-blue-100/70',
      chip: 'bg-dr-blue/10 text-dr-blue',
    },
    today: {
      accent: 'from-emerald-500/70 via-teal-400/70 to-lime-400/60',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      shadow: 'shadow-emerald-100/80',
      chip: 'bg-emerald-100 text-emerald-700',
    },
    latest: {
      accent: 'from-slate-400/60 via-slate-500/50 to-stone-400/50',
      border: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
      shadow: 'shadow-slate-200/80',
      chip: 'bg-slate-100 text-slate-600',
    },
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-blue-50/30 to-white p-6 shadow-sm lg:p-8">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_55%)]" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-dr-blue/5 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-dr-blue shadow-sm">
                <BellRing className="h-3.5 w-3.5" />
                Centro de alertas
              </span>
              <div>
                <h1 className="text-3xl font-semibold text-dr-dark-gray">Notificaciones</h1>
                <p className="text-sm text-slate-600">
                  Consulta y gestiona las notificaciones del sistema desde una sola vista.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 font-semibold text-dr-dark-gray shadow-sm">
                  {filteredNotifications.length} registradas
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-dr-blue">
                  {unreadCount} sin leer
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refresh({ showErrors: true })}
                disabled={isLoading}
                className="bg-white/70 text-dr-dark-gray shadow-sm hover:bg-white"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={markAllAsRead}
                  className="bg-dr-blue text-white shadow"
                >
                  <CheckCheck className="h-4 w-4" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => {
              const visuals = summaryVisuals[card.key] ?? summaryVisuals.latest;
              return (
                <div
                  key={card.key}
                  className={`group relative overflow-hidden rounded-2xl border bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${visuals.border} ${visuals.shadow}`}
                >
                  <span
                    className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20 bg-gradient-to-br ${visuals.accent}`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                      <p className="text-3xl font-semibold text-dr-dark-gray">{card.value}</p>
                      <p className="text-xs text-slate-500">{card.helper}</p>
                    </div>
                    <div className={`rounded-2xl border p-3 ${visuals.iconBg}`}>
                      {card.icon}
                    </div>
                  </div>
                  <div className="relative mt-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${visuals.chip}`}>
                      Resumen
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-white via-slate-50 to-white shadow-xl ring-1 ring-slate-200/70">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute inset-y-0 right-0 h-full w-1/2 bg-[radial-gradient(circle_at_top,rgba(15,118,255,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.06),transparent_60%)]" />
        </div>
        <CardContent className="relative space-y-8 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-dr-blue">Filtros inteligentes</p>
              <p className="text-base font-semibold text-dr-dark-gray">Afina tu vista de alertas en segundos</p>
              <p className="text-xs text-slate-500">Combina búsquedas, estados y fechas para encontrar lo que necesitas.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickStatusFilters.map((filter) => {
                const isActive = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'border-transparent bg-dr-blue text-white shadow-lg shadow-dr-blue/30'
                        : 'border-white/70 bg-white/70 text-slate-500 hover:bg-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <Label htmlFor="search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar notificaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-none bg-transparent pl-10 text-sm text-dr-dark-gray focus-visible:ring-2 focus-visible:ring-dr-blue"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <Label htmlFor="type" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tipo
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger
                  id="type"
                  className="border-none bg-transparent text-sm text-dr-dark-gray focus:ring-2 focus:ring-dr-blue"
                >
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatNotificationTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <Label htmlFor="priority" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Prioridad
              </Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger
                  id="priority"
                  className="border-none bg-transparent text-sm text-dr-dark-gray focus:ring-2 focus:ring-dr-blue"
                >
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fecha
              </Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger
                  id="date"
                  className="border-none bg-transparent text-sm text-dr-dark-gray focus:ring-2 focus:ring-dr-blue"
                >
                  <SelectValue placeholder="Todas las fechas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notificaciones */}
      <Card className="border-none bg-white shadow-xl ring-1 ring-slate-100">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 pb-4">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-lg font-semibold text-dr-dark-gray">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Centro cronológico</p>
              <span className="text-base font-semibold text-dr-dark-gray">
                Notificaciones ({filteredNotifications.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {error && (
                <Badge variant="destructive" className="text-xs">
                  Error al cargar
                </Badge>
              )}
              <Badge className="bg-dr-blue/10 text-dr-blue">
                {unreadCount} sin leer
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-dr-blue" />
              Cargando notificaciones...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              <Bell className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              No se encontraron notificaciones con los filtros aplicados
            </div>
          ) : (
            <div className="relative p-4 md:p-8">
              <div className="absolute left-6 top-8 bottom-8 hidden md:block">
                <div className="h-full w-px bg-gradient-to-b from-dr-blue/25 via-slate-200 to-transparent" />
              </div>
              <div className="space-y-6">
                {filteredNotifications.map((notification) => {
                  const typeConfig = getTypeConfig(notification.type);
                  const isUnread = !notification.read;
                  const normalizedType =
                    notification.type
                      ?.toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/_/g, '-') ?? 'general';
                  const isUnassignedAlert = normalizedType === 'request-unassigned';
                  const notificationId = notification.id ?? 'sin-id';
                  const contentLayoutClass = isUnassignedAlert
                    ? 'flex w-full flex-col items-center gap-4 text-center'
                    : 'flex flex-col gap-4 md:flex-row md:items-start md:justify-between';
                  const metaWrapperClass = isUnassignedAlert
                    ? 'flex flex-col gap-3 items-center text-center'
                    : 'flex flex-col gap-3 text-left md:text-right';
                  const badgeRowClass = isUnassignedAlert
                    ? 'flex flex-wrap items-center justify-center gap-2'
                    : 'flex flex-wrap items-center gap-2';
                  const statusRowClass = isUnassignedAlert
                    ? 'flex flex-wrap gap-2 justify-center'
                    : 'flex flex-wrap gap-2 md:justify-end';
                  const footerWrapperClass = isUnassignedAlert
                    ? 'flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500'
                    : 'flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500';
                  const footerIdClass = isUnassignedAlert
                    ? 'inline-flex items-center gap-2 justify-center'
                    : 'inline-flex items-center gap-2';
                  return (
                    <div key={notification.id} className="relative md:pl-14">
                      <span
                        className={`absolute left-5 top-6 hidden h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white shadow-md md:flex ${
                          isUnread ? 'bg-dr-blue' : 'bg-slate-300'
                        }`}
                      />
                      <div
                        className={`group relative overflow-hidden rounded-2xl border bg-white/95 p-5 shadow-sm transition-all hover:-translate-y-0.5 ${
                          isUnread
                            ? 'border-dr-blue/30 shadow-blue-100/80 ring-1 ring-dr-blue/20'
                            : 'border-slate-100 hover:shadow-md'
                        }`}
                      >
                        <span
                          className={`absolute inset-x-4 top-0 h-1 rounded-full bg-gradient-to-r ${
                            isUnread
                              ? 'from-dr-blue via-sky-400 to-transparent'
                              : 'from-slate-200 via-slate-50 to-transparent'
                          }`}
                        />
                        <div className="flex flex-col gap-4">
                          <div className={contentLayoutClass}>
                            <div className={`space-y-3 ${isUnassignedAlert ? 'w-full max-w-2xl' : ''}`}>
                              <div className={`${badgeRowClass} text-xs font-semibold`}>
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${typeConfig.badgeClass}`}
                                >
                                  {typeConfig.icon}
                                  {typeConfig.label}
                                </span>
                                {isUnread && (
                                  <span className="inline-flex items-center rounded-full bg-dr-blue/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-dr-blue">
                                    Nuevo
                                  </span>
                                )}
                              </div>
                              <div className={`space-y-2 ${isUnassignedAlert ? 'text-center' : ''}`}>
                                <h3 className="text-lg font-semibold text-dr-dark-gray">
                                  {notification.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-slate-600">
                                  {notification.message}
                                </p>
                              </div>
                              {isUnassignedAlert && (
                                <div className="mx-auto flex w-full flex-col items-center gap-3 rounded-2xl border border-dr-blue/20 bg-gradient-to-br from-dr-blue/5 via-white to-white p-4 text-center shadow-inner">
                                  <div className="inline-flex items-center gap-2 rounded-full bg-dr-blue/10 px-4 py-1 text-sm font-semibold text-dr-blue">
                                    <UserMinus className="h-4 w-4" />
                                    Acción requerida
                                  </div>
                                  <p className="text-sm text-slate-600">
                                    Asigna un analista disponible para dar seguimiento a esta solicitud pendiente.
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className={metaWrapperClass}>
                              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDate(notification.createdAt)}
                              </span>
                              <div className={statusRowClass}>
                                {getPriorityBadge(notification.priority)}
                                <Badge
                                  className={`text-xs font-semibold ${
                                    notification.read
                                      ? 'border-slate-200 bg-slate-100 text-slate-600'
                                      : 'border-dr-blue/30 bg-dr-blue/10 text-dr-blue'
                                  }`}
                                >
                                  {notification.read ? 'Leída' : 'Sin leer'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className={footerWrapperClass}>
                            <span className={footerIdClass}>
                              <Shield className="h-3.5 w-3.5 text-slate-400" />
                              ID #{notificationId}
                            </span>
                            {isUnread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className={`text-dr-blue hover:bg-dr-blue/10 ${isUnassignedAlert ? 'mx-auto' : ''}`}
                                title="Marcar como leída"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Marcar como leída
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function BeneficiariesPage({ currentUser, authToken }: PageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [padronFilter, setPadronFilter] = useState<'all' | 'in' | 'out'>('all');
  const [contactFilter, setContactFilter] = useState<'all' | 'complete' | 'email' | 'phone' | 'none'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryDto[]>([]);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryDto | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);


  const roleLabel = currentUser?.role?.trim().toLowerCase() ?? '';
  const roleLevelString =
    typeof currentUser?.roleLevel === 'string'
      ? currentUser.roleLevel.trim().toLowerCase()
      : '';
  const isAnalyst =
    roleLabel.includes('analyst') ||
    roleLabel.includes('analista') ||
    roleLevelString === 'analyst';
  const isSupervisor =
    roleLabel.includes('supervisor') ||
    roleLabel.includes('manager') ||
    roleLevelString === 'supervisor';
  const isAdmin =
    roleLabel.includes('admin') ||
    roleLabel.includes('administrador') ||
    roleLevelString === 'admin';
  // Los beneficiarios no se asignan directamente - solo los supervisores y admins pueden ver todos
  const canViewAllBeneficiaries =
    Boolean(
      authToken &&
        currentUser &&
        (isSupervisor || isAdmin),
    );

  const analystTokens = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    const tokens = new Set<string>();
    if (currentUser.username && currentUser.username.trim()) {
      tokens.add(currentUser.username.trim().toLowerCase());
    }
    if (currentUser.name && currentUser.name.trim()) {
      tokens.add(currentUser.name.trim().toLowerCase());
    }
    return Array.from(tokens);
  }, [currentUser]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => window.clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage((previous) => (previous === 1 ? previous : 1));
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage((previous) => (previous === 1 ? previous : 1));
  }, [pageSize]);

  const loadBeneficiaries = useCallback(
    async (page: number, term: string) => {
      if (!authToken) {
        setError('Debe iniciar sesión nuevamente para consultar los beneficiarios.');
        setBeneficiaries([]);
        setPagination({
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const trimOrUndefined = (value?: string | null): string | undefined =>
          typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

        const baseOptions: SearchBeneficiariesOptions = {
          search: term || undefined,
          pageNumber: page,
          pageSize,
        };

        const optionsQueue: SearchBeneficiariesOptions[] = [];
        const seenOptions = new Set<string>();
        const addOption = (options: SearchBeneficiariesOptions) => {
          const entries = Object.entries(options)
            .filter(([, value]) => value !== undefined)
            .sort(([a], [b]) => a.localeCompare(b));
          const key = JSON.stringify(entries);
          if (!seenOptions.has(key)) {
            seenOptions.add(key);
            optionsQueue.push(options);
          }
        };

        addOption({ ...baseOptions, includeAssignments: true });

        const analystIdentifier =
          trimOrUndefined(currentUser?.username) ??
          trimOrUndefined(currentUser?.email) ??
          trimOrUndefined(currentUser?.name);
        const supervisorIdentifier =
          trimOrUndefined(currentUser?.id) ??
          trimOrUndefined(currentUser?.username) ??
          trimOrUndefined(currentUser?.name);

        // Los analistas no tienen acceso a la página de beneficiarios
        if (isAnalyst) {
          setBeneficiaries([]);
          setPagination({
            totalCount: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          });
          setCurrentPage(1);
          setLastUpdated(new Date());
          return;
        }

        if ((isSupervisor || isAdmin) && supervisorIdentifier) {
          addOption({
            ...baseOptions,
            includeAssignments: true,
            supervisorId: supervisorIdentifier,
          });
          addOption({
            ...baseOptions,
            onlyAssigned: true,
            supervisorId: supervisorIdentifier,
          });
          if (isAdmin) {
            addOption({
              ...baseOptions,
              includeAssignments: true,
            });
          }
        } else {
          addOption({
            ...baseOptions,
            includeAssignments: true,
          });
        }

        addOption(baseOptions);

        let result: Awaited<ReturnType<typeof searchBeneficiaries>> | null = null;
        let lastAuthorizationError: ApiError | null = null;

        for (const options of optionsQueue) {
          try {
            result = await searchBeneficiaries(authToken, options);
            break;
          } catch (err) {
            if (err instanceof ApiError) {
              if (err.status === 401 || err.status === 403) {
                lastAuthorizationError = err;
                continue;
              }

              if (err.status && [400, 404, 422].includes(err.status)) {
                console.warn('Búsqueda de beneficiarios con filtros no compatibles, intentando siguiente opción.', {
                  status: err.status,
                  message: err.message,
                  options,
                });
                continue;
              }
            }

            if (err instanceof TypeError) {
              console.warn('Fallo de red consultando beneficiarios, probando con la siguiente configuración.', err);
              continue;
            }

            throw err;
          }
        }

        if (!result) {
          if (lastAuthorizationError) {
            throw lastAuthorizationError;
          }
          throw new ApiError('No se pudo obtener la lista de beneficiarios.', 500);
        }

        const pageNumber = typeof result.pageNumber === 'number' ? result.pageNumber : page;
        const totalCount =
          typeof result.totalCount === 'number' ? result.totalCount : result.items.length;
        const totalPages =
          typeof result.totalPages === 'number'
            ? result.totalPages
            : Math.max(1, Math.ceil(totalCount / pageSize));

        setBeneficiaries(result.items ?? []);
        setPagination({
          totalCount,
          totalPages,
          hasNextPage:
            typeof result.hasNextPage === 'boolean'
              ? result.hasNextPage
              : pageNumber < totalPages,
          hasPreviousPage:
            typeof result.hasPreviousPage === 'boolean'
              ? result.hasPreviousPage
              : pageNumber > 1,
        });
        setCurrentPage(pageNumber);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error cargando beneficiarios', err);
        let message = 'No se pudo obtener la lista de beneficiarios.';

        if (err instanceof ApiError) {
          if (err.status === 401) {
            message = 'La sesión expiró o no es válida. Inicie sesión nuevamente.';
          } else if (err.status === 403) {
            message =
              'El servicio no autorizó la consulta de beneficiarios para este perfil. Verifique con el equipo de TI si su cuenta tiene acceso.';
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
    },
    [authToken, pageSize, isAnalyst, isSupervisor, isAdmin, currentUser],
  );

  useEffect(() => {
    void loadBeneficiaries(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, loadBeneficiaries]);

  const handleViewBeneficiary = (beneficiary: BeneficiaryDto) => {
    setSelectedBeneficiary(beneficiary);
    setShowViewModal(true);
  };

  const displayedBeneficiaries = useMemo(() => {
    // Los analistas no ven beneficiarios directamente
    if (!canViewAllBeneficiaries) {
      return [];
    }

    let filtered = [...beneficiaries];

    // Filtro por padrón
    if (padronFilter === 'in') {
      filtered = filtered.filter((b) => b.padronData?.found === true);
    } else if (padronFilter === 'out') {
      filtered = filtered.filter((b) => !b.padronData?.found);
    }

    // Filtro por contacto
    if (contactFilter === 'complete') {
      filtered = filtered.filter(
        (b) =>
          (typeof b.email === 'string' && b.email.trim()) &&
          (typeof b.phoneNumber === 'string' && b.phoneNumber.trim())
      );
    } else if (contactFilter === 'email') {
      filtered = filtered.filter((b) => typeof b.email === 'string' && b.email.trim());
    } else if (contactFilter === 'phone') {
      filtered = filtered.filter((b) => typeof b.phoneNumber === 'string' && b.phoneNumber.trim());
    } else if (contactFilter === 'none') {
      filtered = filtered.filter(
        (b) =>
          (!b.email || !b.email.trim()) &&
          (!b.phoneNumber || !b.phoneNumber.trim())
      );
    }

    return filtered;
  }, [beneficiaries, canViewAllBeneficiaries, padronFilter, contactFilter]);

  const effectivePagination = pagination;
  const totalCount = effectivePagination.totalCount;
  const withEmail = displayedBeneficiaries.filter(
    (beneficiary) => typeof beneficiary.email === 'string' && beneficiary.email.trim(),
  ).length;
  const withPhone = displayedBeneficiaries.filter(
    (beneficiary) => typeof beneficiary.phoneNumber === 'string' && beneficiary.phoneNumber.trim(),
  ).length;
  const inPadron = displayedBeneficiaries.filter(
    (beneficiary) => beneficiary.padronData?.found === true,
  ).length;
  const withCompleteContact = displayedBeneficiaries.filter(
    (beneficiary) =>
      (typeof beneficiary.email === 'string' && beneficiary.email.trim()) &&
      (typeof beneficiary.phoneNumber === 'string' && beneficiary.phoneNumber.trim()),
  ).length;

  const lastUpdatedText = lastUpdated
    ? lastUpdated.toLocaleString('es-DO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';





  const columnCount = 6;

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={columnCount} className="py-8 text-center text-gray-500">
            Cargando beneficiarios...
          </TableCell>
        </TableRow>
      );
    }

    if (displayedBeneficiaries.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columnCount} className="py-8 text-center text-gray-500">
            No se encontraron beneficiarios para la búsqueda indicada.
          </TableCell>
        </TableRow>
      );
    }

    return displayedBeneficiaries.map((beneficiary) => {
      const idValue =
        typeof beneficiary.id === 'string'
          ? beneficiary.id
          : typeof beneficiary.id === 'number'
            ? String(beneficiary.id)
            : '—';
      const nationalId =
        typeof beneficiary.nationalId === 'string' && beneficiary.nationalId.trim().length > 0
          ? beneficiary.nationalId.trim()
          : '—';
      const email =
        typeof beneficiary.email === 'string' && beneficiary.email.trim().length > 0
          ? beneficiary.email.trim()
          : null;
      const phone =
        typeof beneficiary.phoneNumber === 'string' && beneficiary.phoneNumber.trim().length > 0
          ? beneficiary.phoneNumber.trim()
          : null;
      const inPadron = beneficiary.padronData?.found === true;
      const hasCompleteContact = email && phone;

      return (
        <TableRow key={`${idValue}-${nationalId}`} className="hover:bg-gray-50/50 transition-colors">
          <TableCell>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dr-blue to-dr-blue-light flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dr-dark-gray">
                  {buildBeneficiaryName(beneficiary)}
                </p>
                <p className="text-xs text-gray-500 sm:hidden">{nationalId}</p>
              </div>
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {nationalId}
            </span>
          </TableCell>
          <TableCell>
            {inPadron ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">
                <CheckCircle className="h-3 w-3 mr-1" />
                En Padrón
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-600 border-gray-300 font-medium">
                <XCircle className="h-3 w-3 mr-1" />
                No Encontrado
              </Badge>
            )}
          </TableCell>
          <TableCell>
            <div className="flex flex-col gap-1">
              {email ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                  <Mail className="h-3 w-3 text-blue-600 flex-shrink-0" />
                  <span className="truncate max-w-[150px]" title={email}>{email}</span>
                </div>
              ) : null}
              {phone ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                  <Phone className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span>{phone}</span>
                </div>
              ) : null}
              {!email && !phone ? (
                <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs w-fit">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Sin contacto
                </Badge>
              ) : null}
              {hasCompleteContact ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs w-fit">
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Completo
                </Badge>
              ) : null}
            </div>
          </TableCell>
          <TableCell className="text-xs text-gray-600">
            {formatBeneficiaryDate(
              typeof beneficiary.createdAt === 'string' ? beneficiary.createdAt : undefined,
            )}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewBeneficiary(beneficiary)}
                className="text-dr-blue hover:bg-blue-50"
                title="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dr-dark-gray">Gestión de Beneficiarios</h1>
        <p className="text-gray-600 mt-1">
          Consulte la información registrada de beneficiarios y acceda a los detalles de cada perfil.
        </p>
      </div>

      {!canViewAllBeneficiaries && (
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Como analista, puede ver los beneficiarios a través de las <strong>solicitudes asignadas</strong> en la sección de Solicitudes. 
            Los supervisores y administradores pueden ver todos los beneficiarios directamente desde esta sección.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-dr-blue bg-gradient-to-br from-blue-50/50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-dr-blue/10 p-3 rounded-xl">
                <Users className="h-6 w-6 text-dr-blue" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Registrados</p>
                <p className="text-2xl font-bold text-dr-dark-gray mt-0.5">
                  {totalCount.toLocaleString('es-DO')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  En página: {displayedBeneficiaries.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">En Padrón</p>
                <p className="text-2xl font-bold text-dr-dark-gray mt-0.5">{inPadron}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {displayedBeneficiaries.length > 0
                    ? `${((inPadron / displayedBeneficiaries.length) * 100).toFixed(1)}% de la página`
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-3 rounded-xl">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Con Contacto Completo</p>
                <p className="text-2xl font-bold text-dr-dark-gray mt-0.5">{withCompleteContact}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {displayedBeneficiaries.length > 0
                    ? `${((withCompleteContact / displayedBeneficiaries.length) * 100).toFixed(1)}% tiene email y teléfono`
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Última Actualización</p>
                <p className="text-sm font-bold text-dr-dark-gray mt-0.5 leading-tight">
                  {lastUpdated
                    ? lastUpdated.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pág. {currentPage} de {effectivePagination.totalPages}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, cédula o identificador..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="sm:w-[210px]">
                  <Label htmlFor="beneficiaries-page-size" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Registros por página
                  </Label>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      const parsed = Number.parseInt(value, 10);
                      if (!Number.isNaN(parsed)) {
                        setPageSize(parsed);
                      }
                    }}
                  >
                    <SelectTrigger id="beneficiaries-page-size" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size} por página
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`gap-2 ${showFilters ? 'bg-blue-50 border-blue-300 text-dr-blue' : ''}`}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {(padronFilter !== 'all' || contactFilter !== 'all') && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-dr-blue text-white">
                      {[padronFilter !== 'all' ? 1 : 0, contactFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => void loadBeneficiaries(currentPage, debouncedSearch)}
                  className="gap-2 bg-dr-blue hover:bg-dr-blue-dark text-white"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="border-t pt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Estado en Padrón
                    </Label>
                    <Select
                      value={padronFilter}
                      onValueChange={(value) => setPadronFilter(value as 'all' | 'in' | 'out')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="in">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            En Padrón
                          </div>
                        </SelectItem>
                        <SelectItem value="out">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-gray-400" />
                            Fuera del Padrón
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Información de Contacto
                    </Label>
                    <Select
                      value={contactFilter}
                      onValueChange={(value) => setContactFilter(value as 'all' | 'complete' | 'email' | 'phone' | 'none')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="complete">
                          <div className="flex items-center gap-2">
                            <CheckCheck className="h-4 w-4 text-green-600" />
                            Contacto Completo
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            Solo Email
                          </div>
                        </SelectItem>
                        <SelectItem value="phone">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-purple-600" />
                            Solo Teléfono
                          </div>
                        </SelectItem>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            Sin Contacto
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPadronFilter('all');
                        setContactFilter('all');
                      }}
                      className="w-full text-gray-600 hover:text-dr-blue"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
          <CardTitle>Beneficiarios</CardTitle>
          <CardDescription>
            Mostrando {displayedBeneficiaries.length} registro{displayedBeneficiaries.length === 1 ? '' : 's'} · Página {currentPage} · {pageSize} por página.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Beneficiario</TableHead>
                  <TableHead className="min-w-[140px]">Cédula</TableHead>
                  <TableHead className="min-w-[130px]">Estado Padrón</TableHead>
                  <TableHead className="min-w-[180px]">Contacto</TableHead>
                  <TableHead className="min-w-[120px]">Registro</TableHead>
                  <TableHead className="min-w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTableBody()}</TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Total: {totalCount.toLocaleString('es-DO')} | Página {currentPage} de {effectivePagination.totalPages} | {pageSize} por página
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={isLoading || !effectivePagination.hasPreviousPage}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => (effectivePagination.hasNextPage ? prev + 1 : prev))
              }
              disabled={isLoading || !effectivePagination.hasNextPage}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </Card>


      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-dr-blue to-dr-blue-light flex items-center justify-center shadow-lg">
                  <User className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-dr-dark-gray">
                    {buildBeneficiaryName(selectedBeneficiary ?? {})}
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-1 flex items-center gap-2">
                    <IdCard className="h-3.5 w-3.5" />
                    {selectedBeneficiary?.nationalId || 'No disponible'}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {selectedBeneficiary?.padronData?.found ? (
                  <Badge className="bg-green-100 text-green-800 border-green-300 shadow-sm">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Registrado en Padrón
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 border-gray-400">
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                    No en Padrón
                  </Badge>
                )}
                {selectedBeneficiary?.email && selectedBeneficiary?.phoneNumber && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 shadow-sm">
                    <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                    Contacto Completo
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {selectedBeneficiary ? (
            <div className="flex-1 overflow-y-auto px-1">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    <span className="hidden sm:inline">Información General</span>
                    <span className="sm:hidden">General</span>
                  </TabsTrigger>
                  <TabsTrigger value="household" className="flex items-center gap-2" disabled={!selectedBeneficiary.padronData?.found}>
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Jefe de Hogar</span>
                    <span className="sm:hidden">Hogar</span>
                  </TabsTrigger>
                  <TabsTrigger value="members" className="flex items-center gap-2" disabled={!selectedBeneficiary.padronData?.records?.length}>
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Miembros ({selectedBeneficiary.padronData?.records?.length || 0})</span>
                    <span className="sm:hidden">Miembros</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Información General */}
                <TabsContent value="general" className="space-y-4 mt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-l-4 border-l-dr-blue shadow-md">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
                        <CardTitle className="text-base font-semibold text-dr-dark-gray flex items-center gap-2">
                          <FileUser className="h-5 w-5 text-dr-blue" />
                          Datos Personales
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase text-gray-500 tracking-wide">Nombre Completo</p>
                          <p className="text-base text-dr-dark-gray font-bold">
                            {buildBeneficiaryName(selectedBeneficiary)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase text-gray-500 tracking-wide">Cédula de Identidad</p>
                          <p className="text-base text-dr-dark-gray font-mono bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 font-bold">
                            {typeof selectedBeneficiary.nationalId === 'string' && selectedBeneficiary.nationalId.trim()
                              ? selectedBeneficiary.nationalId.trim()
                              : '—'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase text-gray-500 tracking-wide flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Fecha de Nacimiento
                          </p>
                          <p className="text-base text-dr-dark-gray font-semibold">
                            {formatBeneficiaryDate(
                              typeof selectedBeneficiary.dateOfBirth === 'string'
                                ? selectedBeneficiary.dateOfBirth
                                : undefined,
                            )}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase text-gray-500 tracking-wide">ID del Sistema</p>
                          <p className="text-xs text-gray-600 break-all font-mono bg-gray-50 px-2 py-1.5 rounded border">
                            {typeof selectedBeneficiary.id === 'string'
                              ? selectedBeneficiary.id
                              : typeof selectedBeneficiary.id === 'number'
                                ? String(selectedBeneficiary.id)
                                : '—'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-3">
                        <CardTitle className="text-base font-semibold text-dr-dark-gray flex items-center gap-2">
                          <Mail className="h-5 w-5 text-purple-600" />
                          Información de Contacto
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase text-gray-500 tracking-wide flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-blue-600" />
                            Correo Electrónico
                          </p>
                          {typeof selectedBeneficiary.email === 'string' && selectedBeneficiary.email.trim() ? (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <p className="text-base text-dr-dark-gray font-medium break-all">
                                {selectedBeneficiary.email.trim()}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                              <XCircle className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-500 italic">No registrado</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase text-gray-500 tracking-wide flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-green-600" />
                            Teléfono
                          </p>
                          {typeof selectedBeneficiary.phoneNumber === 'string' && selectedBeneficiary.phoneNumber.trim() ? (
                            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <p className="text-base text-dr-dark-gray font-mono font-medium">
                                {selectedBeneficiary.phoneNumber.trim()}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                              <XCircle className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-500 italic">No registrado</p>
                            </div>
                          )}
                        </div>
                        {selectedBeneficiary.email && selectedBeneficiary.phoneNumber && (
                          <Alert className="border-green-200 bg-green-50">
                            <CheckCheck className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 text-sm font-medium">
                              Este beneficiario tiene información de contacto completa
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {selectedBeneficiary.notes && (
                    <Card className="border-l-4 border-l-amber-500 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-white pb-3">
                        <CardTitle className="text-base font-semibold text-dr-dark-gray flex items-center gap-2">
                          <FileText className="h-5 w-5 text-amber-600" />
                          Notas Adicionales
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="text-sm text-gray-800 bg-amber-50/50 p-4 rounded-lg border border-amber-200 leading-relaxed whitespace-pre-wrap">
                          {selectedBeneficiary.notes}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-3">
                      <CardTitle className="text-base font-semibold text-dr-dark-gray flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        Información del Sistema
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase text-gray-600">Fecha de Registro</p>
                          <p className="text-sm text-dr-dark-gray">
                            {formatBeneficiaryDate(
                              typeof selectedBeneficiary.createdAt === 'string'
                                ? selectedBeneficiary.createdAt
                                : undefined,
                            )}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase text-gray-600">Última Actualización</p>
                          <p className="text-sm text-dr-dark-gray">
                            {formatBeneficiaryDate(
                              typeof selectedBeneficiary.updatedAt === 'string'
                                ? selectedBeneficiary.updatedAt
                                : undefined,
                            )}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase text-gray-600">Estado en Padrón</p>
                          {selectedBeneficiary.padronData?.found ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Encontrado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              No encontrado
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedBeneficiary.notes && (
                        <div className="mt-4 space-y-1">
                          <p className="text-xs font-bold uppercase text-gray-600 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Notas y Observaciones
                          </p>
                          <div className="text-sm text-gray-700 bg-amber-50 border border-amber-200 p-3 rounded-md">
                            {typeof selectedBeneficiary.notes === 'string' && selectedBeneficiary.notes.trim()
                              ? selectedBeneficiary.notes.trim()
                              : 'Sin notas registradas.'}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {!selectedBeneficiary.padronData?.found && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <strong>Información del Padrón no disponible.</strong> Este beneficiario no tiene datos asociados en el padrón nacional.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* Tab: Jefe de Hogar */}
                <TabsContent value="household" className="space-y-4 mt-0">
                  {selectedBeneficiary.padronData?.headOfHousehold && (
                    <Card className="border-green-200 bg-green-50/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-dr-dark-gray flex items-center gap-2">
                          <Home className="h-4 w-4 text-green-600" />
                          Jefe de Hogar
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Nombre</p>
                            <p className="text-sm text-dr-dark-gray font-medium">
                              {selectedBeneficiary.padronData.headOfHousehold.firstName} {selectedBeneficiary.padronData.headOfHousehold.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Cédula</p>
                            <p className="text-sm text-dr-dark-gray font-mono">
                              {selectedBeneficiary.padronData.headOfHousehold.nationalId || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">ID Hogar</p>
                            <p className="text-sm text-dr-dark-gray font-mono">
                              {selectedBeneficiary.padronData.headOfHousehold.householdId || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Sexo</p>
                            <p className="text-sm text-dr-dark-gray">
                              {selectedBeneficiary.padronData.headOfHousehold.sex || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Teléfono</p>
                            <p className="text-sm text-dr-dark-gray font-mono">
                              {selectedBeneficiary.padronData.headOfHousehold.phoneNumber || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Nivel de Pobreza</p>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              Nivel {selectedBeneficiary.padronData.headOfHousehold.povertyLevel || '—'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Provincia</p>
                            <p className="text-sm text-dr-dark-gray">
                              {selectedBeneficiary.padronData.headOfHousehold.province || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Municipio</p>
                            <p className="text-sm text-dr-dark-gray">
                              {selectedBeneficiary.padronData.headOfHousehold.municipality || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Sección</p>
                            <p className="text-sm text-dr-dark-gray">
                              {selectedBeneficiary.padronData.headOfHousehold.section || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Barrio/Paraje</p>
                            <p className="text-sm text-dr-dark-gray">
                              {selectedBeneficiary.padronData.headOfHousehold.neighborhood || '—'}
                            </p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Dirección</p>
                            <p className="text-sm text-dr-dark-gray">
                              {selectedBeneficiary.padronData.headOfHousehold.address || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Nivel Educativo</p>
                            <p className="text-sm text-dr-dark-gray">
                              {selectedBeneficiary.padronData.headOfHousehold.educationLevel || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Alfabetización</p>
                            <p className="text-sm text-dr-dark-gray">
                              {selectedBeneficiary.padronData.headOfHousehold.literacyStatus || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-600 mb-1">Fecha de Entrevista</p>
                            <p className="text-sm text-dr-dark-gray">
                              {formatBeneficiaryDate(selectedBeneficiary.padronData.headOfHousehold.interviewDate)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Tab: Miembros del Hogar */}
                <TabsContent value="members" className="space-y-4 mt-0">
                  {selectedBeneficiary.padronData?.records && selectedBeneficiary.padronData.records.length > 0 && (
                    <div className="space-y-4">
                      {selectedBeneficiary.padronData.records.map((record, index) => (
                        <Card key={index} className={`${record.isHeadOfHousehold ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/30'}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base font-semibold text-dr-dark-gray flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  record.isHeadOfHousehold 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <span className="text-base">{record.firstName} {record.lastName}</span>
                                  <p className="text-xs font-normal text-gray-500 mt-0.5">
                                    {record.relationship || '—'}
                                  </p>
                                </div>
                              </CardTitle>
                              {record.isHeadOfHousehold && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <Home className="h-3 w-3 mr-1" />
                                  Jefe de Hogar
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Cédula</p>
                                <p className="text-sm text-dr-dark-gray font-mono">
                                  {record.nationalId || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">ID Hogar</p>
                                <p className="text-sm text-dr-dark-gray font-mono">
                                  {record.householdId || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Sexo</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {record.sex || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Teléfono</p>
                                <p className="text-sm text-dr-dark-gray font-mono">
                                  {record.phoneNumber || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Fecha de Nacimiento</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {formatBeneficiaryDate(record.dateOfBirth)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Nivel de Pobreza</p>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                  Nivel {record.povertyLevel || '—'}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Provincia</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {record.province || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Municipio</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {record.municipality || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Sección</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {record.section || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Barrio/Paraje</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {record.neighborhood || '—'}
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Dirección</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {record.address || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Nivel Educativo</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {record.educationLevel || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Alfabetización</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {record.literacyStatus || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Fecha de Entrevista</p>
                                <p className="text-sm text-dr-dark-gray">
                                  {formatBeneficiaryDate(record.interviewDate)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Seleccione un beneficiario para ver sus datos.</p>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reports Page
export function ReportsPage({ currentUser, authToken }: PageProps) {
  const [requestCountReport, setRequestCountReport] = useState<any>(null);
  const [activeUsersReport, setActiveUsersReport] = useState<any>(null);
  const [usersByRoleReport, setUsersByRoleReport] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportActionLoading, setReportActionLoading] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let year = currentYear; year >= currentYear - 5; year -= 1) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  const monthOptions = useMemo(
    () => [
      { value: 1, label: 'Enero' },
      { value: 2, label: 'Febrero' },
      { value: 3, label: 'Marzo' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Mayo' },
      { value: 6, label: 'Junio' },
      { value: 7, label: 'Julio' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Septiembre' },
      { value: 10, label: 'Octubre' },
      { value: 11, label: 'Noviembre' },
      { value: 12, label: 'Diciembre' },
    ],
    [],
  );

  const resolveReportErrorMessage = useCallback(
    (error: unknown, fallback: string, context?: { year?: number; month?: number }) => {
      const getMonthLabel = (monthValue?: number) =>
        monthValue
          ? monthOptions.find((option) => option.value === monthValue)?.label ??
            `Mes ${monthValue}`
          : null;

      if (error instanceof ApiError) {
        if (error.status === 401) {
          return 'La sesión expiró o no es válida. Inicie sesión nuevamente para generar el reporte.';
        }
        if (error.status === 403) {
          return 'No tiene permiso para generar este reporte. Verifique sus credenciales o contacte a soporte.';
        }
        if (error.status === 404) {
          if (context?.year && context?.month) {
            return `No hay datos disponibles para ${getMonthLabel(context.month) ?? `el mes ${context.month}`} ${context.year}.`;
          }
          if (context?.year) {
            return `No hay datos disponibles para el año ${context.year}.`;
          }
          return 'No se encontraron datos para el período seleccionado.';
        }
        if (error.status === 500) {
          if (context?.year && context?.month) {
            return `El servidor no pudo generar el reporte de ${getMonthLabel(context.month) ?? `mes ${context.month}`} ${context.year}. Intente con otro período o contacte al equipo de TI.`;
          }
          if (context?.year) {
            return `El servidor no pudo generar el reporte anual ${context.year}. Intente con otro año o contacte al equipo de TI.`;
          }
          return 'El servidor no pudo generar el reporte solicitado. Intente más tarde.';
        }
        if (error.message && error.message.trim()) {
          return error.message.trim();
        }
      }
      if (error instanceof Error && error.message.trim()) {
        return error.message.trim();
      }
      return fallback;
    },
    [monthOptions],
  );

  // Load reports from backend
  useEffect(() => {
    const loadReports = async () => {
      if (!authToken) return;
      
      try {
        setIsLoadingStats(true);
        
        // Load multiple reports in parallel
        const [requestCount, activeUsers, usersByRole] = await Promise.all([
          getRequestCountReport(authToken).catch(() => null),
          getActiveUsersReport(authToken).catch(() => null),
          getUsersByRoleReport(authToken).catch(() => null),
        ]);
        
        setRequestCountReport(requestCount);
        setActiveUsersReport(activeUsers);
        setUsersByRoleReport(usersByRole);
      } catch (error) {
        console.error('Error cargando reportes:', error);
        toast.error('Error al cargar reportes');
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadReports();
  }, [authToken]);

  const handleViewMonthlyReport = async () => {
    if (!authToken) return;
    const actionKey = 'view-monthly';
    setReportActionLoading(actionKey);
    try {
      const report = await getMonthlyRequestReport(authToken, selectedYear, selectedMonth);
      console.log('Reporte mensual:', report);
      toast.success('Reporte mensual cargado');
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        resolveReportErrorMessage(error, 'Error al cargar reporte mensual.', {
          year: selectedYear,
          month: selectedMonth,
        }),
      );
    } finally {
      setReportActionLoading((current) => (current === actionKey ? null : current));
    }
  };

  const handleViewAnnualReport = async () => {
    if (!authToken) return;
    const actionKey = 'view-annual';
    setReportActionLoading(actionKey);
    try {
      const report = await getAnnualRequestReport(authToken, selectedYear);
      console.log('Reporte anual:', report);
      toast.success('Reporte anual cargado');
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        resolveReportErrorMessage(error, 'Error al cargar reporte anual.', {
          year: selectedYear,
        }),
      );
    } finally {
      setReportActionLoading((current) => (current === actionKey ? null : current));
    }
  };

  // Download functions
  const handleDownloadPDF = async (reportType: string) => {
    if (!authToken) return;
    
    const actionKey = `pdf-${reportType}`;
    setReportActionLoading(actionKey);
    let context: { year?: number; month?: number } | undefined;

    try {
      let blob: Blob;
      let filename: string;
      
      switch (reportType) {
        case 'requests-count':
          blob = await downloadRequestCountReportPDF(authToken);
          filename = `reporte-conteo-solicitudes-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'monthly-requests':
          blob = await downloadMonthlyRequestReportPDF(authToken, selectedYear, selectedMonth);
          filename = `reporte-mensual-solicitudes-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.pdf`;
          context = { year: selectedYear, month: selectedMonth };
          break;
        case 'annual-requests':
          blob = await downloadAnnualRequestReportPDF(authToken, selectedYear);
          filename = `reporte-anual-solicitudes-${selectedYear}.pdf`;
          context = { year: selectedYear };
          break;
        case 'active-users':
          blob = await downloadActiveUsersReportPDF(authToken);
          filename = `reporte-usuarios-activos-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'users-by-role':
          blob = await downloadUsersByRoleReportPDF(authToken);
          filename = `reporte-usuarios-por-rol-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }
      
      downloadBlobAsFile(blob, filename);
      toast.success('Reporte PDF descargado exitosamente');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error(
        resolveReportErrorMessage(error, 'Error al descargar el reporte PDF.', context),
      );
    } finally {
      setReportActionLoading((current) => (current === actionKey ? null : current));
    }
  };

  const handleDownloadExcel = async (reportType: string) => {
    if (!authToken) return;
    const actionKey = `excel-${reportType}`;
    setReportActionLoading(actionKey);
    let context: { year?: number; month?: number } | undefined;

    try {
      let blob: Blob;
      let filename: string;
      
      switch (reportType) {
        case 'requests-count':
          blob = await downloadRequestCountReportExcel(authToken);
          filename = `reporte-conteo-solicitudes-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'monthly-requests':
          blob = await downloadMonthlyRequestReportExcel(authToken, selectedYear, selectedMonth);
          filename = `reporte-mensual-solicitudes-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.xlsx`;
          context = { year: selectedYear, month: selectedMonth };
          break;
        case 'annual-requests':
          blob = await downloadAnnualRequestReportExcel(authToken, selectedYear);
          filename = `reporte-anual-solicitudes-${selectedYear}.xlsx`;
          context = { year: selectedYear };
          break;
        case 'active-users':
          blob = await downloadActiveUsersReportExcel(authToken);
          filename = `reporte-usuarios-activos-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'users-by-role':
          blob = await downloadUsersByRoleReportExcel(authToken);
          filename = `reporte-usuarios-por-rol-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }
      
      downloadBlobAsFile(blob, filename);
      toast.success('Reporte Excel descargado exitosamente');
    } catch (error) {
      console.error('Error descargando Excel:', error);
      toast.error(
        resolveReportErrorMessage(error, 'Error al descargar el reporte Excel.', context),
      );
    } finally {
      setReportActionLoading((current) => (current === actionKey ? null : current));
    }
  };

  const handleViewActiveUsersReport = async () => {
    if (!authToken) return;
    const actionKey = 'view-active-users';
    setReportActionLoading(actionKey);
    try {
      const report = await getActiveUsersReport(authToken);
      console.log('Usuarios activos:', report);
      toast.success('Reporte de usuarios activos cargado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar reporte');
    } finally {
      setReportActionLoading((current) => (current === actionKey ? null : current));
    }
  };

  const handleViewUsersByRoleReport = async () => {
    if (!authToken) return;
    const actionKey = 'view-users-by-role';
    setReportActionLoading(actionKey);
    try {
      const report = await getUsersByRoleReport(authToken);
      console.log('Usuarios por rol:', report);
      toast.success('Reporte de usuarios por rol cargado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar reporte');
    } finally {
      setReportActionLoading((current) => (current === actionKey ? null : current));
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return '0';
    return num.toLocaleString('es-DO');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dr-dark-gray">Reportes y Estadísticas</h1>
        <p className="text-gray-600 mt-1">
          Genere reportes detallados y consulte estadísticas del sistema SIUBEN
        </p>
      </div>

      {/* Quick Stats */}
      {isLoadingStats ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dr-blue"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-full">
                  <ClipboardList className="h-6 w-6 text-dr-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dr-dark-gray">Total Solicitudes</h3>
                  <p className="text-2xl font-bold text-dr-blue">{formatNumber(requestCountReport?.totalRequests)}</p>
                  <p className="text-sm text-gray-600">En el sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dr-dark-gray">Solicitudes Pendientes</h3>
                  <p className="text-2xl font-bold text-amber-600">{formatNumber(requestCountReport?.pendingRequests)}</p>
                  <p className="text-sm text-gray-600">Por asignar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-50 p-3 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dr-dark-gray">Usuarios Activos</h3>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(activeUsersReport?.totalActiveUsers)}</p>
                  <p className="text-sm text-gray-600">En el sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generar Reportes</CardTitle>
          <CardDescription>
            Seleccione el tipo de reporte que desea generar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <span className="block text-xs uppercase text-gray-500 mb-1">Año</span>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(value) => {
                    const parsed = Number.parseInt(value, 10);
                    if (!Number.isNaN(parsed)) {
                      setSelectedYear(parsed);
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Seleccione un año" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="block text-xs uppercase text-gray-500 mb-1">Mes</span>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(value) => {
                    const parsed = Number.parseInt(value, 10);
                    if (!Number.isNaN(parsed)) {
                      setSelectedMonth(parsed);
                    }
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Seleccione un mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-gray-500 max-w-xs">
              Los reportes se generan usando el año y mes seleccionados. Si un período devuelve error,
              intente con otro disponible.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2 border-dashed border-gray-200 hover:border-dr-blue transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <FileText className="h-8 w-8 text-dr-blue flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-dr-dark-gray">Reporte Mensual de Solicitudes</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Solicitudes del mes actual con desglose por estado y tipo
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={handleViewMonthlyReport}
                        className="bg-dr-blue hover:bg-dr-blue-dark"
                        disabled={reportActionLoading === 'view-monthly'}
                      >
                        {reportActionLoading === 'view-monthly' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF('monthly-requests')}
                        disabled={reportActionLoading === 'pdf-monthly-requests'}
                      >
                        {reportActionLoading === 'pdf-monthly-requests' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadExcel('monthly-requests')}
                        disabled={reportActionLoading === 'excel-monthly-requests'}
                      >
                        {reportActionLoading === 'excel-monthly-requests' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-4 w-4 mr-1" />
                            Excel
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-green-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <TrendingUp className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-dr-dark-gray">Reporte Anual de Solicitudes</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Análisis anual con desglose mensual de solicitudes
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={handleViewAnnualReport}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={reportActionLoading === 'view-annual'}
                      >
                        {reportActionLoading === 'view-annual' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF('annual-requests')}
                        disabled={reportActionLoading === 'pdf-annual-requests'}
                      >
                        {reportActionLoading === 'pdf-annual-requests' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadExcel('annual-requests')}
                        disabled={reportActionLoading === 'excel-annual-requests'}
                      >
                        {reportActionLoading === 'excel-annual-requests' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-4 w-4 mr-1" />
                            Excel
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-amber-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Users className="h-8 w-8 text-amber-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-dr-dark-gray">Reporte de Usuarios Activos</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Usuarios activos agrupados por departamento y provincia
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={handleViewActiveUsersReport}
                        className="bg-amber-600 hover:bg-amber-700"
                        disabled={reportActionLoading === 'view-active-users'}
                      >
                        {reportActionLoading === 'view-active-users' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF('active-users')}
                        disabled={reportActionLoading === 'pdf-active-users'}
                      >
                        {reportActionLoading === 'pdf-active-users' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadExcel('active-users')}
                        disabled={reportActionLoading === 'excel-active-users'}
                      >
                        {reportActionLoading === 'excel-active-users' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-4 w-4 mr-1" />
                            Excel
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-purple-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <ClipboardList className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-dr-dark-gray">Reporte de Usuarios por Roles</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Distribución de usuarios agrupados por roles del sistema
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={handleViewUsersByRoleReport}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={reportActionLoading === 'view-users-by-role'}
                      >
                        {reportActionLoading === 'view-users-by-role' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF('users-by-role')}
                        disabled={reportActionLoading === 'pdf-users-by-role'}
                      >
                        {reportActionLoading === 'pdf-users-by-role' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadExcel('users-by-role')}
                        disabled={reportActionLoading === 'excel-users-by-role'}
                      >
                        {reportActionLoading === 'excel-users-by-role' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-4 w-4 mr-1" />
                            Excel
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
