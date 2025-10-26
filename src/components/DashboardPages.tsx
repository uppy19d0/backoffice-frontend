import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface CurrentUser {
  username: string;
  email?: string | null;
  name: string;
  role: string;
  roleLevel: 'administrador' | 'manager' | 'analista';
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

import { 
  getRequests, 
  assignRequest,
  getAssignableUsers,
  unassignRequest,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  CheckCheck
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
  
  // Mapeo de números a estados
  const statusMap: Record<string, string> = {
    '0': 'pending',
    '1': 'assigned',
    '2': 'review',
    '3': 'approved',
    '4': 'rejected',
  };
  
  const normalizedStatus = statusMap[statusStr] || statusStr;
  
  switch (normalizedStatus) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Aprobado
      </Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>;
    case 'review':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <Eye className="h-3 w-3 mr-1" />
        En Revisión
      </Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Rechazado
      </Badge>;
    case 'assigned':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">
        <User className="h-3 w-3 mr-1" />
        Asignado
      </Badge>;
    default:
      return <Badge variant="outline">{statusStr}</Badge>;
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestDto | null>(null);
  const [requestCountReport, setRequestCountReport] = useState<any>(null);
  const [activeUsersReport, setActiveUsersReport] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

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

  // Load recent requests from backend
  useEffect(() => {
    const loadRequests = async () => {
      if (!authToken) return;

      try {
        setIsLoadingRequests(true);
        const data = await getRequests(authToken, { take: 5 });
        setRecentRequests(data);
      } catch (error) {
        console.error('Error cargando solicitudes:', error);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    loadRequests();
  }, [authToken]);

  const formatNumber = (num: number | undefined) => {
    if (!num) return '0';
    return num.toLocaleString('es-DO');
  };

  // Estadísticas específicas por rol
  const getStatsForRole = () => {
    if (currentUser?.roleLevel === 'administrador') {
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
    } else if (currentUser?.roleLevel === 'manager') {
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

  // Filtrar solicitudes según el rol del usuario
  const getFilteredRequests = () => {
    if (!recentRequests || recentRequests.length === 0) return [];
    
    if (currentUser?.roleLevel === 'analista') {
      // Para analistas: mostrar principalmente sus solicitudes asignadas
      return recentRequests.filter(req => req.assignedTo === currentUser.name).slice(0, 5);
    } else if (currentUser?.roleLevel === 'manager') {
      // Para managers: mostrar solicitudes que requieren aprobación + en revisión
      return recentRequests.filter(req => 
        normalizeStatus(req.status) === 'review' || 
        normalizeStatus(req.status) === 'pending'
      ).slice(0, 5);
    } else {
      // Para administradores: mostrar todas las solicitudes recientes
      return recentRequests.slice(0, 5);
    }
  };

  const filteredRecentRequests = getFilteredRequests();

  // Helper function to normalize status (same as in RequestsPage)
  function normalizeStatus(status: string | number): string {
    const statusMap: Record<string, string> = {
      '0': 'pending',
      '1': 'assigned',
      '2': 'review',
      '3': 'approved',
      '4': 'rejected',
    };
    const statusStr = typeof status === 'number' ? String(status) : status;
    return statusMap[statusStr] || statusStr;
  }

  // Solicitudes hardcodeadas (DEPRECATED - se eliminará)
  const getAllRequests_OLD = () => [
    { 
      id: '2025-001240', 
      applicant: 'Esperanza Reyes Núñez', 
      cedula: '001-7890123-4',
      status: 'rejected', 
      date: '02/07/2025',
      province: 'Moca',
      type: 'document_upload',
      address: 'Calle Principal #234, Moca',
      phone: '809-555-7890',
      email: 'esperanza.reyes@email.com',
      householdSize: 4,
      monthlyIncome: 'RD$ 28,000',
      reason: 'Documentos vencidos',
      description: 'Los documentos presentados han excedido su fecha de validez',
      documents: ['Cédula vencida', 'Certificado de nacimiento'],
      assignedTo: 'Lic. Roberto Carlos Mendoza',
      reviewedBy: 'Lic. Roberto Carlos Mendoza',
      reviewDate: '02/07/2025',
      priority: 'low'
    },
    { 
      id: '2025-001239', 
      applicant: 'Roberto Méndez Castro', 
      cedula: '001-6789012-3',
      status: 'rejected', 
      date: '03/07/2025',
      province: 'La Romana',
      type: 'info_update',
      address: 'Av. Libertad #567, La Romana',
      phone: '809-555-6789',
      email: 'roberto.mendez@email.com',
      householdSize: 3,
      monthlyIncome: 'RD$ 45,000',
      reason: 'Información inconsistente',
      description: 'Los datos proporcionados no coinciden con los registros oficiales',
      documents: ['Comprobante de ingresos', 'Actualización de datos'],
      assignedTo: 'Lic. Ana Patricia Jiménez',
      reviewedBy: 'Lic. Ana Patricia Jiménez',
      reviewDate: '03/07/2025',
      priority: 'medium'
    },
    { 
      id: '2025-001234', 
      applicant: 'María González Pérez', 
      cedula: '001-1234567-8',
      status: 'pending', 
      date: '06/07/2025',
      province: 'Santo Domingo',
      type: 'document_upload',
      address: 'Calle Primera #123, Los Alcarrizos',
      phone: '809-555-1234',
      email: 'maria.gonzalez@email.com',
      householdSize: 4,
      monthlyIncome: 'RD$ 15,000',
      reason: 'Actualización de documentos de identidad',
      description: 'Solicitud de carga de nuevos documentos de identidad para verificación. Se requiere actualizar cédula vencida y certificado de nacimiento.',
      documents: ['Cédula nueva', 'Certificado de nacimiento', 'Comprobante de ingresos'],
      assignedTo: null,
      reviewedBy: null,
      reviewDate: null,
      priority: 'medium'
    },
    { 
      id: '2025-001235', 
      applicant: 'Juan Carlos Rodríguez', 
      cedula: '001-2345678-9',
      status: 'review', 
      date: '06/07/2025',
      province: 'Santiago',
      type: 'info_update',
      address: 'Av. Estrella Sadhalá #456, Santiago',
      phone: '809-555-2345',
      email: 'juan.rodriguez@email.com',
      householdSize: 3,
      monthlyIncome: 'RD$ 12,000',
      reason: 'Cambio de información personal',
      description: 'Actualización de datos familiares y cambio de dirección debido a mudanza reciente.',
      documents: ['Contrato de alquiler', 'Comprobante de servicios'],
      assignedTo: currentUser?.name,
      reviewedBy: null,
      reviewDate: null,
      priority: 'high'
    },
    { 
      id: '2025-001236', 
      applicant: 'Ana Lucía Martínez', 
      cedula: '001-3456789-0',
      status: 'approved', 
      date: '05/07/2025',
      province: 'La Vega',
      type: 'document_upload',
      address: 'Calle Duarte #789, La Vega',
      phone: '809-555-3456',
      email: 'ana.martinez@email.com',
      householdSize: 5,
      monthlyIncome: 'RD$ 8,000',
      reason: 'Documentos de verificación de ingresos',
      description: 'Carga de comprobantes de ingresos actualizados según solicitud del sistema.',
      documents: ['Carta de trabajo', 'Últimos 3 recibos de pago', 'Declaración jurada'],
      assignedTo: 'Lic. Ana Patricia Jiménez',
      reviewedBy: 'Lic. Ana Patricia Jiménez',
      reviewDate: '05/07/2025',
      priority: 'low'
    },
    // Solicitudes específicas para analistas
    ...(currentUser?.roleLevel === 'analista' ? [
      {
        id: '2025-001241',
        applicant: 'Carmen Esperanza López',
        cedula: '001-8901234-5',
        status: 'assigned',
        date: '07/07/2025',
        province: 'San Pedro de Macorís',
        type: 'benefit_application',
        address: 'Calle Central #456, San Pedro',
        phone: '809-555-8901',
        email: 'carmen.lopez@email.com',
        householdSize: 3,
        monthlyIncome: 'RD$ 9,500',
        reason: 'Solicitud inicial de beneficio',
        description: 'Primera solicitud de beneficio SIUBEN para familia de 3 miembros en situación de vulnerabilidad.',
        documents: ['Cédula', 'Certificados de nacimiento', 'Comprobante de ingresos', 'Evaluación socioeconómica'],
        assignedTo: currentUser?.name,
        reviewedBy: null,
        reviewDate: null,
        priority: 'high'
      },
      {
        id: '2025-001242',
        applicant: 'Francisco Javier Medina',
        cedula: '001-9012345-6',
        status: 'assigned',
        date: '07/07/2025',
        province: 'Monte Cristi',
        type: 'address_change',
        address: 'Av. Duarte #789, Monte Cristi',
        phone: '809-555-9012',
        email: 'francisco.medina@email.com',
        householdSize: 5,
        monthlyIncome: 'RD$ 14,000',
        reason: 'Cambio de dirección familiar',
        description: 'Solicitud de actualización de dirección debido a reubicación familiar por motivos laborales.',
        documents: ['Contrato de alquiler nuevo', 'Comprobante de servicios', 'Declaración jurada'],
        assignedTo: currentUser?.name,
        reviewedBy: null,
        reviewDate: null,
        priority: 'medium'
      }
    ] : [])
  ];

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

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
            {currentUser?.roleLevel === 'administrador' 
              ? 'Panel de administración general para la gestión completa del Sistema Único de Beneficiarios'
              : currentUser?.roleLevel === 'manager'
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
      {currentUser?.roleLevel === 'administrador' && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-dr-dark-gray">Acciones Rápidas de Administrador</CardTitle>
            <CardDescription className="text-gray-600">
              Herramientas administrativas de uso frecuente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-auto p-4 border-gray-300">
                <div className="flex flex-col items-center gap-2">
                  <UserPlus className="h-6 w-6 text-dr-blue" />
                  <span className="text-sm font-medium">Crear Usuario</span>
                  <span className="text-xs text-gray-500">Agregar nuevo usuario</span>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 border-gray-300">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6 text-dr-blue" />
                  <span className="text-sm font-medium">Generar Reporte</span>
                  <span className="text-xs text-gray-500">Reportes del sistema</span>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 border-gray-300">
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
      {currentUser?.roleLevel === 'manager' && (
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

      {/* Recent Requests */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-dr-dark-gray">
            {currentUser?.roleLevel === 'administrador' 
              ? 'Solicitudes Recientes del Sistema'
              : currentUser?.roleLevel === 'manager'
              ? 'Solicitudes Pendientes de Asignación'
              : 'Mis Solicitudes Asignadas'
            }
          </CardTitle>
          <CardDescription className="text-gray-600">
            {currentUser?.roleLevel === 'administrador' 
              ? 'Últimas solicitudes de beneficiarios recibidas en el sistema'
              : currentUser?.roleLevel === 'manager'
              ? 'Solicitudes que requieren asignación a analistas'
              : 'Solicitudes asignadas para su revisión y análisis'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-dr-dark-gray whitespace-nowrap">ID Solicitud</TableHead>
                  <TableHead className="text-dr-dark-gray min-w-[180px]">Solicitante</TableHead>
                  <TableHead className="text-dr-dark-gray hidden sm:table-cell">Cédula</TableHead>
                  <TableHead className="text-dr-dark-gray hidden md:table-cell">Provincia</TableHead>
                  <TableHead className="text-dr-dark-gray">Estado</TableHead>
                  <TableHead className="text-dr-dark-gray hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRequests ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dr-blue"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRecentRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No hay solicitudes recientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecentRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-dr-blue whitespace-nowrap">#{request.id}</TableCell>
                    <TableCell className="text-dr-dark-gray">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{request.applicant}</p>
                        <p className="text-sm text-gray-500 sm:hidden">{request.cedula}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-dr-dark-gray hidden sm:table-cell">{request.cedula}</TableCell>
                    <TableCell className="text-dr-dark-gray hidden md:table-cell">{request.province}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-dr-dark-gray hidden lg:table-cell">{request.date}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewRequest(request)}
                        className="text-dr-blue hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Request Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dr-dark-gray flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-dr-blue" />
              Detalles de la Solicitud #{selectedRequest?.id}
            </DialogTitle>
            <DialogDescription>
              Información completa de la solicitud de {selectedRequest?.applicant}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Status and Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedRequest.status)}
                  <span className="text-sm text-gray-600">
                    Solicitud recibida el {selectedRequest.date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getRequestTypeIcon(selectedRequest.type)}
                  <span className="text-sm font-medium">{getRequestTypeName(selectedRequest.type)}</span>
                </div>
              </div>

              {/* Applicant Information */}
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Solicitante
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Nombre Completo</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedRequest.applicant}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Cédula</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedRequest.cedula}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Teléfono</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <p className="text-dr-dark-gray">{selectedRequest.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-dr-dark-gray">{selectedRequest.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Dirección</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <p className="text-dr-dark-gray">{selectedRequest.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Request Details */}
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detalles de la Solicitud
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Razón de la Solicitud</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedRequest.reason}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Descripción Detallada</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray">{selectedRequest.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Miembros del Hogar</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-dr-dark-gray font-medium">{selectedRequest.householdSize} personas</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Ingresos Mensuales</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-dr-dark-gray font-medium">{selectedRequest.monthlyIncome}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Documentos Adjuntos
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedRequest.documents?.map((doc: any, index: number) => {
                    const docName = typeof doc === 'string' ? doc : doc?.fileName || 'Documento sin nombre';
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-dr-dark-gray">{docName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assignment Info */}
              {selectedRequest.assignedTo && (
                <div>
                  <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Información de Asignación
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Asignado a</Label>
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-dr-blue font-medium">{selectedRequest.assignedTo}</p>
                      </div>
                    </div>
                    
                    {selectedRequest.reviewedBy && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Revisado por</Label>
                        <div className="p-3 bg-green-50 rounded-md">
                          <p className="text-green-700 font-medium">{selectedRequest.reviewedBy}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedAnalyst, setSelectedAnalyst] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [unassignNotes, setUnassignNotes] = useState('');
  const { pushNotification } = useNotifications();
  const previousRequestIdsRef = useRef<Set<string>>(new Set());
  const requestsInitializedRef = useRef(false);

  const roleString = currentUser?.role ?? '';
  const normalizedRoleString = roleString.trim().toLowerCase();
  const isSupervisorRole =
    normalizedRoleString.includes('supervisor') ||
    normalizedRoleString.includes('manager') ||
    currentUser?.roleLevel === 'manager';
  const isAdminRole =
    normalizedRoleString.includes('admin') ||
    normalizedRoleString.includes('administrador');
  const isAnalystRole =
    normalizedRoleString.includes('analyst') ||
    normalizedRoleString.includes('analista') ||
    currentUser?.roleLevel === 'analista';
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
      const data = await getRequests(authToken);
      setRequests(data);
      trackRequests(data, true);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      setLoadError(error instanceof Error ? error.message : 'Error cargando solicitudes');
      toast.error('Error al cargar las solicitudes del sistema');
    } finally {
      setIsLoading(false);
    }
  }, [authToken, trackRequests]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const loadAnalystOptions = useCallback(async () => {
    if (!authToken) {
      return;
    }

    setIsLoadingAnalysts(true);
    setAssignDialogError(null);

    try {
      // Try to use the new assignable users endpoint first
      try {
        const assignableUsers = await getAssignableUsers(authToken, {
          includeRelatedRoles: true,
          ...(currentUser?.departmentId
            ? {
                departmentId: currentUser.departmentId,
                prioritizeDepartmentId: currentUser.departmentId,
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

  // Helper function to normalize status (convert number to string)
  const normalizeStatus = (status: string | number): string => {
    const statusMap: Record<string, string> = {
      '0': 'pending',
      '1': 'assigned',
      '2': 'review',
      '3': 'approved',
      '4': 'rejected',
    };
    const statusStr = typeof status === 'number' ? String(status) : status;
    return statusMap[statusStr] || statusStr;
  };

  // Filter requests based on user role
  const getFilteredRequests = () => {
    let filteredRequests = requests;

    // Role-based filtering
    if (isAnalystRole && currentUser) {
      const currentUserTokens = new Set<string>();
      if (currentUser.name?.trim()) {
        currentUserTokens.add(currentUser.name.trim().toLowerCase());
      }
      if (currentUser.username?.trim()) {
        currentUserTokens.add(currentUser.username.trim().toLowerCase());
      }
      if (typeof currentUser.email === 'string' && currentUser.email.trim()) {
        currentUserTokens.add(currentUser.email.trim().toLowerCase());
      }
      if (typeof currentUser.id === 'string' && currentUser.id.trim()) {
        currentUserTokens.add(currentUser.id.trim().toLowerCase());
      }

      filteredRequests = requests.filter((req) => {
        const info = extractRequestAssigneeInfo(req);
        const candidateTokens: string[] = [];
        if (info.name) {
          candidateTokens.push(info.name.toLowerCase());
        }
        if (info.email) {
          candidateTokens.push(info.email.toLowerCase());
        }
        if (info.id) {
          candidateTokens.push(info.id.toLowerCase());
        }
        return candidateTokens.some((token) => currentUserTokens.has(token));
      });
    } else if (isSupervisorRole || isAdminRole) {
      // Managers see all requests (can assign to analysts)
      filteredRequests = requests;
    } else {
      // Administrators see all requests
      filteredRequests = requests;
    }

    // Search filter
    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter((req) => {
        const assigneeName = resolveRequestAssigneeName(req);
        return (
          req.applicant?.toLowerCase().includes(normalizedSearch) ||
          req.cedula?.toLowerCase().includes(normalizedSearch) ||
          req.id?.toLowerCase().includes(normalizedSearch) ||
          (assigneeName ? assigneeName.toLowerCase().includes(normalizedSearch) : false)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => normalizeStatus(req.status) === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.priority === priorityFilter);
    }

    return filteredRequests;
  };

  const filteredRequests = getFilteredRequests();

  const { outOfTeamAnalystsCount, teamAnalystsCount } = useMemo(() => {
    if (isAdminRole) {
      return { outOfTeamAnalystsCount: 0, teamAnalystsCount: analysts.length };
    }
    const outCount = analysts.filter((analyst) => analyst.isSameDepartment === false).length;
    return { outOfTeamAnalystsCount: outCount, teamAnalystsCount: analysts.length - outCount };
  }, [analysts, isAdminRole]);

  const handleViewRequest = (request: RequestDto) => {
    setSelectedRequest(request);
    setShowViewModal(true);
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

    if (!selectedRequest || !selectedRequest.id) {
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

    const restrictToTeam = !isAdminRole && (isSupervisorRole || currentUser?.roleLevel === 'manager');
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
        updatedRequest = await assignRequest(authToken, selectedRequest.id, {
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
          prev.map((req) => (req.id === updatedRequest?.id ? { ...req, ...updatedRequest } : req)),
        );
      } else {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id
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

      const requestId = resolveRequestId(updatedRequest ?? selectedRequest) ?? String(selectedRequest.id ?? '');
      const applicantName =
        updatedRequest?.applicant ?? selectedRequest.applicant ?? undefined;

      toast.success('Solicitud asignada correctamente', {
        description: `${applicantName ?? `Solicitud #${requestId}`} → ${analystInfo.name}`,
        duration: 4000,
      });

      if (isSupervisorRole || isAdminRole) {
        pushNotification({
          id: `request-${requestId}-assigned`,
          title: 'Solicitud asignada',
          message: applicantName
            ? `La solicitud #${requestId} de ${applicantName} fue asignada a ${analystInfo.name}.`
            : `La solicitud #${requestId} fue asignada a ${analystInfo.name}.`,
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
    
    setIsSubmittingAssignment(true);
    try {
      await unassignRequest(authToken, selectedRequest.id, {
        notes: unassignNotes.trim() || undefined
      });
      
      // Update local state
      setRequests((prev: RequestDto[]) => prev.map((req: RequestDto) => 
        req.id === selectedRequest.id 
          ? { ...req, assignedTo: null, assignmentDate: null, assignmentNotes: null }
          : req
      ));
      
      toast.success(`Solicitud #${selectedRequest.id} desasignada exitosamente`);
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
  const unassignedCount = (currentUser?.roleLevel === 'manager' || currentUser?.roleLevel === 'administrador') 
    ? requests.filter((req) => normalizeStatus(req.status) === 'pending' && !resolveRequestAssigneeName(req)).length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dr-dark-gray">
            {currentUser?.roleLevel === 'manager' 
              ? 'Gestión de Solicitudes' 
              : currentUser?.roleLevel === 'analista'
              ? 'Mis Solicitudes Asignadas'
              : 'Solicitudes del Sistema'
            }
          </h1>
          <p className="text-gray-600 mt-1">
            {currentUser?.roleLevel === 'manager' 
              ? 'Asigne solicitudes a analistas y supervise el progreso' 
              : currentUser?.roleLevel === 'analista'
              ? 'Revise y procese las solicitudes que le han sido asignadas'
              : 'Monitoree todas las solicitudes del sistema'
            }
          </p>
        </div>

        {/* Unassigned Requests Alert for Managers */}
        {(currentUser?.roleLevel === 'manager' || currentUser?.roleLevel === 'administrador') && unassignedCount > 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Hay {unassignedCount} solicitud{unassignedCount !== 1 ? 'es' : ''} pendiente{unassignedCount !== 1 ? 's' : ''} de asignación
            </AlertDescription>
          </Alert>
        )}
      </div>

      {!(isSupervisorRole || isAdminRole) && (
        <Alert className="border-gray-200 bg-gray-50">
          <Info className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-gray-700">
            Los analistas pueden revisar y actualizar sus solicitudes asignadas, pero la asignación inicial
            sólo la realizan supervisores o administradores. Si necesita reasignar un caso, comuníquelo a su supervisor.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, cédula o ID de solicitud..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
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

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
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
                {!isLoading && currentUser?.roleLevel === 'analista' ? ' asignada' + (filteredRequests.length !== 1 ? 's' : '') : ''}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Provincia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden lg:table-cell">Prioridad</TableHead>
                    <TableHead className="min-w-[200px]">Asignado a</TableHead>
                    <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-dr-blue">#{request.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.applicant}</p>
                        <p className="text-sm text-gray-500 sm:hidden">{request.cedula}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {getRequestTypeIcon(request.type)}
                        <span className="text-sm">{getRequestTypeName(request.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{request.province}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{getPriorityBadge(request.priority)}</TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {(() => {
                        const assigneeName = resolveRequestAssigneeName(request);
                        return assigneeName ? (
                          <span className="text-dr-blue font-medium">{assigneeName}</span>
                        ) : (
                          <span className="text-gray-500">Sin asignar</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{request.date}</TableCell>
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
                            normalizeStatus(request.status) === 'pending' || 
                            normalizeStatus(request.status) === 'assigned' ||
                            normalizeStatus(request.status) === 'review'
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
                            normalizeStatus(request.status) === 'assigned' ||
                            normalizeStatus(request.status) === 'review'
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Prioridad:</span>
                    {getPriorityBadge(selectedRequest.priority)}
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

      {/* View Request Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dr-dark-gray flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-dr-blue" />
              Detalles de la Solicitud #{selectedRequest?.id}
            </DialogTitle>
            <DialogDescription>
              Información completa de la solicitud de {selectedRequest?.applicant}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Status and Priority */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedRequest.status)}
                  {getPriorityBadge(selectedRequest.priority)}
                  <span className="text-sm text-gray-600">
                    Recibida el {selectedRequest.date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getRequestTypeIcon(selectedRequest.type)}
                  <span className="text-sm font-medium">{getRequestTypeName(selectedRequest.type)}</span>
                </div>
              </div>

              {/* Applicant Information */}
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Solicitante
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Nombre Completo</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedRequest.applicant}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Cédula</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedRequest.cedula}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Teléfono</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <p className="text-dr-dark-gray">{selectedRequest.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-dr-dark-gray">{selectedRequest.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Dirección</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <p className="text-dr-dark-gray">{selectedRequest.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Request Details */}
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detalles de la Solicitud
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Razón de la Solicitud</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedRequest.reason}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Descripción Detallada</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray">{selectedRequest.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Miembros del Hogar</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-dr-dark-gray font-medium">{selectedRequest.householdSize} personas</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Ingresos Mensuales</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-dr-dark-gray font-medium">{selectedRequest.monthlyIncome}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Documentos Adjuntos
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedRequest.documents?.map((doc: any, index: number) => {
                    const docName = typeof doc === 'string' ? doc : doc?.fileName || 'Documento sin nombre';
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-dr-dark-gray">{docName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assignment Info */}
              {selectedRequest.assignedTo && (
                <div>
                  <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Información de Asignación
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Asignado a</Label>
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-dr-blue font-medium">{selectedRequest.assignedTo}</p>
                      </div>
                    </div>
                    
                    {selectedRequest.reviewedBy && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Revisado por</Label>
                        <div className="p-3 bg-green-50 rounded-md">
                          <p className="text-green-700 font-medium">{selectedRequest.reviewedBy}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons for Analysts */}
              {currentUser?.roleLevel === 'analista' && selectedRequest.assignedTo === currentUser.name && 
               selectedRequest.status === 'assigned' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleUpdateRequestStatus(selectedRequest.id, 'review');
                      setShowViewModal(false);
                    }}
                    className="bg-dr-blue hover:bg-dr-blue-dark"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Iniciar Revisión
                  </Button>
                  
                  <Button
                    onClick={() => {
                      handleUpdateRequestStatus(selectedRequest.id, 'approved');
                      setShowViewModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
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
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              )}
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return (
      <Badge className={`${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'} text-xs`}>
        {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
      </Badge>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dr-dark-gray">Notificaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestione todas sus notificaciones del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh({ showErrors: true })}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-full">
                <Bell className="h-5 w-5 text-dr-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-dr-dark-gray">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-full">
                <BellRing className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sin leer</p>
                <p className="text-xl font-bold text-red-600">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Leídas</p>
                <p className="text-xl font-bold text-green-600">{notifications.length - unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-50 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alta prioridad</p>
                <p className="text-xl font-bold text-yellow-600">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar notificaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {notificationTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'request' ? 'Solicitudes' : 
                       type === 'system' ? 'Sistema' :
                       type === 'request-assignment' ? 'Asignaciones' :
                       type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="priority">
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

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="unread">Sin leer</SelectItem>
                  <SelectItem value="read">Leídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notificaciones ({filteredNotifications.length})</span>
            {error && (
              <Badge variant="destructive" className="text-xs">
                Error al cargar
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Cargando notificaciones...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              No se encontraron notificaciones con los filtros aplicados
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getPriorityIcon(notification.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-sm font-medium ${
                              !notification.read ? 'text-dr-dark-gray' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatDate(notification.createdAt)}</span>
                            <span>•</span>
                            {getPriorityBadge(notification.priority)}
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {notification.type === 'request' ? 'Solicitud' : 
                               notification.type === 'system' ? 'Sistema' :
                               notification.type === 'request-assignment' ? 'Asignación' :
                               notification.type}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:bg-blue-50"
                              title="Marcar como leída"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
  const [pageSize, setPageSize] = useState(25);

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


  const isAnalyst = currentUser?.roleLevel === 'analista';
  const isSupervisor = currentUser?.roleLevel === 'manager';
  const isAdmin = currentUser?.roleLevel === 'administrador';
  // Los beneficiarios no se asignan directamente - solo los supervisores y admins pueden ver todos
  const canViewAllBeneficiaries =
    Boolean(
      authToken &&
        currentUser &&
        (currentUser.roleLevel === 'manager' || currentUser.roleLevel === 'administrador'),
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

        // Los analistas NO ven beneficiarios directamente asignados
        // Solo ven beneficiarios a través de solicitudes asignadas
        if (isAnalyst) {
          // Para analistas, no cargar beneficiarios directamente
          // Los beneficiarios se mostrarán basados en las solicitudes asignadas
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
        } else if ((isSupervisor || isAdmin) && supervisorIdentifier) {
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
    return beneficiaries;
  }, [beneficiaries, canViewAllBeneficiaries]);

  const effectivePagination = pagination;
  const totalCount = effectivePagination.totalCount;
  const withEmail = displayedBeneficiaries.filter(
    (beneficiary) => typeof beneficiary.email === 'string' && beneficiary.email.trim(),
  ).length;
  const withPhone = displayedBeneficiaries.filter(
    (beneficiary) => typeof beneficiary.phoneNumber === 'string' && beneficiary.phoneNumber.trim(),
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
          : '—';
      const phone =
        typeof beneficiary.phoneNumber === 'string' && beneficiary.phoneNumber.trim().length > 0
          ? beneficiary.phoneNumber.trim()
          : '—';

      return (
        <TableRow key={`${idValue}-${nationalId}`}>
          <TableCell className="text-sm text-dr-dark-gray font-medium">
            {buildBeneficiaryName(beneficiary)}
          </TableCell>
          <TableCell className="text-sm text-gray-700">{nationalId}</TableCell>
          <TableCell className="text-sm text-gray-700">{email}</TableCell>
          <TableCell className="text-sm text-gray-700">{phone}</TableCell>
          <TableCell className="text-sm text-gray-700">
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-full">
                <Users className="h-5 w-5 text-dr-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total registrados</p>
                <p className="text-xl font-bold text-dr-dark-gray">
                  {totalCount.toLocaleString('es-DO')}
                </p>
                <p className="text-xs text-gray-500">
                  Registros visibles: {displayedBeneficiaries.length.toLocaleString('es-DO')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-full">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Con correo (página)</p>
                <p className="text-xl font-bold text-dr-dark-gray">{withEmail}</p>
                <p className="text-xs text-gray-500">
                  {displayedBeneficiaries.length > 0
                    ? `${((withEmail / displayedBeneficiaries.length) * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2 rounded-full">
                <Phone className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Con teléfono (página)</p>
                <p className="text-xl font-bold text-dr-dark-gray">{withPhone}</p>
                <p className="text-xs text-gray-500">
                  {displayedBeneficiaries.length > 0
                    ? `${((withPhone / displayedBeneficiaries.length) * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-full">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Datos actualizados</p>
                <p className="text-xl font-bold text-dr-dark-gray">{lastUpdatedText}</p>
                <p className="text-xs text-gray-500">
                  Página {currentPage} de {effectivePagination.totalPages}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
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
                  <TableHead className="min-w-[200px]">Beneficiario</TableHead>
                  <TableHead className="min-w-[160px]">Cédula</TableHead>
                  <TableHead className="min-w-[200px]">Correo</TableHead>
                  <TableHead className="min-w-[160px]">Teléfono</TableHead>
                  <TableHead className="min-w-[140px]">Registro</TableHead>
                  <TableHead className="min-w-[120px]">Acciones</TableHead>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-dr-dark-gray flex items-center gap-2">
              <User className="h-5 w-5 text-dr-blue" />
              Detalle del beneficiario
            </DialogTitle>
            <DialogDescription>
              Revise la información registrada para {buildBeneficiaryName(selectedBeneficiary ?? {})}.
            </DialogDescription>
          </DialogHeader>

          {selectedBeneficiary ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-gray-500">Identificador</p>
                <p className="text-sm text-dr-dark-gray break-all">
                  {typeof selectedBeneficiary.id === 'string'
                    ? selectedBeneficiary.id
                    : typeof selectedBeneficiary.id === 'number'
                      ? String(selectedBeneficiary.id)
                      : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Cédula</p>
                <p className="text-sm text-dr-dark-gray">
                  {typeof selectedBeneficiary.nationalId === 'string' && selectedBeneficiary.nationalId.trim()
                    ? selectedBeneficiary.nationalId.trim()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Correo electrónico</p>
                <p className="text-sm text-dr-dark-gray">
                  {typeof selectedBeneficiary.email === 'string' && selectedBeneficiary.email.trim()
                    ? selectedBeneficiary.email.trim()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Teléfono</p>
                <p className="text-sm text-dr-dark-gray">
                  {typeof selectedBeneficiary.phoneNumber === 'string' && selectedBeneficiary.phoneNumber.trim()
                    ? selectedBeneficiary.phoneNumber.trim()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Fecha de nacimiento</p>
                <p className="text-sm text-dr-dark-gray">
                  {formatBeneficiaryDate(
                    typeof selectedBeneficiary.dateOfBirth === 'string'
                      ? selectedBeneficiary.dateOfBirth
                      : undefined,
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Creado</p>
                <p className="text-sm text-dr-dark-gray">
                  {formatBeneficiaryDate(
                    typeof selectedBeneficiary.createdAt === 'string'
                      ? selectedBeneficiary.createdAt
                      : undefined,
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Actualizado</p>
                <p className="text-sm text-dr-dark-gray">
                  {formatBeneficiaryDate(
                    typeof selectedBeneficiary.updatedAt === 'string'
                      ? selectedBeneficiary.updatedAt
                      : undefined,
                  )}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase text-gray-500">Notas del beneficiario</p>
                <p className="text-sm text-gray-700">
                  {typeof selectedBeneficiary.notes === 'string' && selectedBeneficiary.notes.trim()
                    ? selectedBeneficiary.notes.trim()
                    : 'Sin notas registradas.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Seleccione un beneficiario para ver sus datos.</p>
          )}

          <DialogFooter>
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
    }
  };

  const handleViewAnnualReport = async () => {
    if (!authToken) return;
    
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
    }
  };

  // Download functions
  const handleDownloadPDF = async (reportType: string) => {
    if (!authToken) return;
    
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
    }
  };

  const handleDownloadExcel = async (reportType: string) => {
    if (!authToken) return;
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
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadPDF('monthly-requests')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadExcel('monthly-requests')}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Excel
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
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadPDF('annual-requests')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadExcel('annual-requests')}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Excel
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
                        onClick={async () => {
                          if (!authToken) return;
                          try {
                            const report = await getActiveUsersReport(authToken);
                            console.log('Usuarios activos:', report);
                            toast.success('Reporte de usuarios activos cargado');
                          } catch (error) {
                            toast.error('Error al cargar reporte');
                          }
                        }}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadPDF('active-users')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadExcel('active-users')}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Excel
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
                        onClick={async () => {
                          if (!authToken) return;
                          try {
                            const report = await getUsersByRoleReport(authToken);
                            console.log('Usuarios por rol:', report);
                            toast.success('Reporte de usuarios por rol cargado');
                          } catch (error) {
                            toast.error('Error al cargar reporte');
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadPDF('users-by-role')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadExcel('users-by-role')}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Excel
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
