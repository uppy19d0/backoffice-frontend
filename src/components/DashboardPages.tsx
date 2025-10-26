import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface CurrentUser {
  username: string;
  email?: string | null;
  name: string;
  role: string;
  roleLevel: 'administrador' | 'manager' | 'analista';
  id?: string | null;
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
  RequestDto
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
  FileSpreadsheet
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
  const [selectedAnalyst, setSelectedAnalyst] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
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
      const users = await getNonAdminUsers(authToken);
      const mapped = mapAdminUsersToAnalystOptions(users);

      if (mapped.length === 0) {
        setAnalysts(FALLBACK_ANALYST_OPTIONS);
        setAssignDialogError('No se encontraron analistas disponibles en el sistema.');
      } else {
        setAnalysts(mapped);
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
      setHasLoadedAnalysts(true);
    } finally {
      setIsLoadingAnalysts(false);
    }
  }, [authToken, hasLoadedAnalysts]);

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

  const handleViewRequest = (request: RequestDto) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleAssignRequest = (request: RequestDto) => {
    setAssignDialogError(null);
    setSelectedRequest(request);
    setAssignmentNotes('');
    if (!hasLoadedAnalysts && !isLoadingAnalysts) {
      void loadAnalystOptions();
    }
    setShowAssignModal(true);
  };

  const handleConfirmAssignment = async () => {
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
                        
                        {/* Assignment button for managers on unassigned requests */}
                        {(() => {
                          const assigneeName = resolveRequestAssigneeName(request);
                          const isManager = isSupervisorRole || isAdminRole;
                          const isPending = normalizeStatus(request.status) === 'pending';
                          const isUnassigned = !assigneeName;

                          return isManager && isPending && isUnassigned && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssignRequest(request)}
                              className="text-green-600 hover:bg-green-50 font-medium"
                              title="Asignar a analista"
                            >
                              <UserPlus className="h-4 w-4" />
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
                disabled={isLoadingAnalysts || analysts.length === 0}
              >
                <SelectTrigger id="analyst" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingAnalysts ? 'Cargando analistas...' : 'Seleccione un analista...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingAnalysts ? (
                    <SelectItem value="__loading" disabled>
                      Cargando analistas...
                    </SelectItem>
                  ) : analysts.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No hay analistas disponibles
                    </SelectItem>
                  ) : (
                    analysts.map((analyst) => (
                      <SelectItem key={analyst.id} value={analyst.id}>
                        {analyst.name}
                        {analyst.email ? ` · ${analyst.email}` : analyst.role ? ` · ${analyst.role}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {assignDialogError
                  ? assignDialogError
                  : isLoadingAnalysts
                    ? 'Cargando analistas disponibles...'
                    : `${analysts.length} analista${analysts.length !== 1 ? 's' : ''} disponibles`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Comentarios (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agregue comentarios o instrucciones especiales para el analista..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
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
              disabled={!selectedAnalyst || isSubmittingAssignment}
              className="bg-dr-blue hover:bg-dr-blue-dark"
            >
              {isSubmittingAssignment ? 'Asignando...' : 'Asignar Solicitud'}
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

const mapAdminUsersToAnalystOptions = (users: AdminUserDto[]): AnalystOption[] => {
  const mapped = users
    .map((user) => {
      const role = resolveAdminUserRole(user);
      const lowerRole = role ? role.toLowerCase() : '';
      const isAnalystRole =
        lowerRole.includes('analist') ||
        lowerRole.includes('analista') ||
        lowerRole.includes('analyst');
      if (!isAnalystRole) {
        return null;
      }

      const person = extractPersonInfo(user);
      const identifier =
        resolveAdminUserIdentifier(user) ?? person.id ?? person.email ?? person.name;
      if (!identifier) {
        return null;
      }

      const name = resolveAdminUserName(user) ?? person.name ?? identifier;
      const email = person.email ?? undefined;

      return {
        id: identifier,
        name,
        email,
        role,
      } as AnalystOption;
    })
    .filter((value): value is AnalystOption => Boolean(value));

  const uniqueMap = new Map<string, AnalystOption>();
  for (const analyst of mapped) {
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
}

const FALLBACK_ANALYST_OPTIONS: AnalystOption[] = availableAnalysts.map((analyst) => ({
  id: analyst.id,
  name: analyst.name,
  email: null,
  role: analyst.role,
}));

interface BeneficiaryAssignmentDialogState {
  open: boolean;
  beneficiary: BeneficiaryDto | null;
  selectedAnalystId: string;
  notes: string;
  isSubmitting: boolean;
  error: string | null;
}

const INITIAL_ASSIGN_DIALOG_STATE: BeneficiaryAssignmentDialogState = {
  open: false,
  beneficiary: null,
  selectedAnalystId: '',
  notes: '',
  isSubmitting: false,
  error: null,
};

export function BeneficiariesPage({ currentUser, authToken }: PageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

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

  const [analysts, setAnalysts] = useState<AnalystOption[]>(FALLBACK_ANALYST_OPTIONS);
  const [hasLoadedAnalysts, setHasLoadedAnalysts] = useState(false);
  const [isLoadingAnalysts, setIsLoadingAnalysts] = useState(false);
  const [analystsError, setAnalystsError] = useState<string | null>(null);
  const [assignDialog, setAssignDialog] = useState<BeneficiaryAssignmentDialogState>({
    ...INITIAL_ASSIGN_DIALOG_STATE,
  });

  const isAnalyst = currentUser?.roleLevel === 'analista';
  const isSupervisor = currentUser?.roleLevel === 'manager';
  const isAdmin = currentUser?.roleLevel === 'administrador';
  const canAssignBeneficiaries =
    Boolean(
      authToken &&
        currentUser &&
        (currentUser.roleLevel === 'manager' || currentUser.roleLevel === 'administrador') &&
        (currentUser.permissions?.canManageBeneficiaries ?? true),
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

        const analystIdentifier =
          trimOrUndefined(currentUser?.username) ??
          trimOrUndefined(currentUser?.email) ??
          trimOrUndefined(currentUser?.name);
        const supervisorIdentifier =
          trimOrUndefined(currentUser?.id) ??
          trimOrUndefined(currentUser?.username) ??
          trimOrUndefined(currentUser?.name);

        if (isAnalyst && analystIdentifier) {
          addOption({
            ...baseOptions,
            assignedTo: analystIdentifier,
            onlyAssigned: true,
            includeAssignments: true,
          });
          addOption({
            ...baseOptions,
            assignedTo: analystIdentifier,
            onlyAssigned: true,
          });
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
            if (
              err instanceof ApiError &&
              (err.status === 401 || err.status === 403)
            ) {
              lastAuthorizationError = err;
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

  const filteredBeneficiaries = useMemo(() => {
    if (!isAnalyst) {
      return beneficiaries;
    }
    if (analystTokens.length === 0) {
      return [];
    }
    return beneficiaries.filter((beneficiary) =>
      matchAssignmentToTokens(extractBeneficiaryAssignmentInfo(beneficiary), analystTokens),
    );
  }, [beneficiaries, isAnalyst, analystTokens]);

  useEffect(() => {
    if (!isAnalyst) {
      return;
    }
    const totalPages = Math.max(1, Math.ceil(filteredBeneficiaries.length / pageSize));
    setCurrentPage((previous) => {
      if (previous > totalPages) {
        return totalPages;
      }
      if (previous < 1) {
        return 1;
      }
      return previous;
    });
  }, [filteredBeneficiaries, isAnalyst, pageSize]);

  const effectivePagination = useMemo(() => {
    if (!isAnalyst) {
      return pagination;
    }
    const filteredCount = filteredBeneficiaries.length;
    const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
    return {
      totalCount: filteredCount,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [pagination, filteredBeneficiaries, isAnalyst, currentPage, pageSize]);

  const displayedBeneficiaries = filteredBeneficiaries;
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

  const formatAssignmentDateTime = useCallback((value?: string | null): string | null => {
    if (!value) {
      return null;
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
  }, []);

  const selectedAssignment = useMemo(
    () =>
      selectedBeneficiary ? extractBeneficiaryAssignmentInfo(selectedBeneficiary) : null,
    [selectedBeneficiary],
  );

  const loadAnalysts = useCallback(async () => {
    if (!authToken) {
      return;
    }

    setIsLoadingAnalysts(true);
    setAnalystsError(null);

    try {
      const users = await getNonAdminUsers(authToken);
      const mapped = mapAdminUsersToAnalystOptions(users);

      if (mapped.length === 0) {
        setAnalysts(FALLBACK_ANALYST_OPTIONS);
        setAnalystsError('No se encontraron analistas disponibles en el sistema.');
      } else {
        setAnalysts(mapped);
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
      setAnalystsError(message);
      if (!hasLoadedAnalysts) {
        setAnalysts(FALLBACK_ANALYST_OPTIONS);
      }
      setHasLoadedAnalysts(true);
    } finally {
      setIsLoadingAnalysts(false);
    }
  }, [authToken, hasLoadedAnalysts]);

  useEffect(() => {
    if (!canAssignBeneficiaries || hasLoadedAnalysts || !authToken) {
      return;
    }
    void loadAnalysts();
  }, [canAssignBeneficiaries, hasLoadedAnalysts, authToken, loadAnalysts]);

  const handleOpenAssignDialog = (beneficiary: BeneficiaryDto) => {
    if (!authToken) {
      toast.warning('Debe iniciar sesión para asignar beneficiarios.');
      return;
    }
    if (!canAssignBeneficiaries) {
      toast.error('No tiene permisos para asignar beneficiarios.');
      return;
    }

    const assignment = extractBeneficiaryAssignmentInfo(beneficiary);
    setAssignDialog({
      open: true,
      beneficiary,
      selectedAnalystId: assignment.analystId ?? '',
      notes: assignment.notes ?? '',
      isSubmitting: false,
      error: null,
    });

    if (!hasLoadedAnalysts && !isLoadingAnalysts) {
      void loadAnalysts();
    }
  };

  const handleConfirmAssignment = async () => {
    if (!authToken) {
      setAssignDialog((prev) => ({
        ...prev,
        error: 'Debe iniciar sesión para asignar beneficiarios.',
      }));
      return;
    }

    if (!assignDialog.beneficiary) {
      return;
    }

    if (!assignDialog.selectedAnalystId) {
      setAssignDialog((prev) => ({
        ...prev,
        error: 'Seleccione un analista para continuar.',
      }));
      return;
    }

    const beneficiaryId = resolveBeneficiaryIdentifier(assignDialog.beneficiary);
    if (!beneficiaryId) {
      setAssignDialog((prev) => ({
        ...prev,
        error: 'No se pudo determinar el identificador del beneficiario seleccionado.',
      }));
      return;
    }

    setAssignDialog((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await assignBeneficiaryToAnalyst(authToken, beneficiaryId, {
        analystId: assignDialog.selectedAnalystId,
        notes: assignDialog.notes.trim() ? assignDialog.notes.trim() : undefined,
      });

      toast.success('Beneficiario asignado correctamente.');
      setAssignDialog({ ...INITIAL_ASSIGN_DIALOG_STATE });
      void loadBeneficiaries(currentPage, debouncedSearch);
    } catch (err) {
      console.error('Error asignando beneficiario', err);
      let message = 'No se pudo completar la asignación del beneficiario.';
      if (err instanceof ApiError && err.message && err.message.trim()) {
        message = err.message.trim();
      } else if (err instanceof Error && err.message && err.message.trim()) {
        message = err.message.trim();
      }
      setAssignDialog((prev) => ({
        ...prev,
        error: message,
        isSubmitting: false,
      }));
    }
  };

  const columnCount = 8;

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
      const assignment = extractBeneficiaryAssignmentInfo(beneficiary);
      const assignmentDateLabel = formatAssignmentDateTime(assignment.assignmentDate);
      const isAssigned = Boolean(assignment.analystName);

      return (
        <TableRow key={`${idValue}-${nationalId}`}>
          <TableCell className="text-sm text-dr-blue break-all">{idValue}</TableCell>
          <TableCell className="text-sm text-dr-dark-gray font-medium">
            {buildBeneficiaryName(beneficiary)}
          </TableCell>
          <TableCell className="text-sm text-gray-700">{nationalId}</TableCell>
          <TableCell className="text-sm text-gray-700">{email}</TableCell>
          <TableCell className="text-sm text-gray-700">{phone}</TableCell>
          <TableCell className="text-sm text-gray-700">
            {isAssigned ? (
              <div className="flex flex-col">
                <span className="font-medium text-dr-blue">{assignment.analystName}</span>
                {assignment.analystEmail && (
                  <span className="text-xs text-gray-500">{assignment.analystEmail}</span>
                )}
                {assignmentDateLabel && (
                  <span className="text-xs text-gray-500">Asignado el {assignmentDateLabel}</span>
                )}
                {assignment.supervisorName && (
                  <span className="text-xs text-gray-500">Por {assignment.supervisorName}</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Sin asignar</span>
            )}
          </TableCell>
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
              {canAssignBeneficiaries && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenAssignDialog(beneficiary)}
                  className="text-green-600 hover:bg-green-50"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, cédula o identificador..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10"
                />
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
            Mostrando {displayedBeneficiaries.length} registro{displayedBeneficiaries.length === 1 ? '' : 's'} en la página {currentPage}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">ID</TableHead>
                  <TableHead className="min-w-[200px]">Beneficiario</TableHead>
                  <TableHead className="min-w-[160px]">Cédula</TableHead>
                  <TableHead className="min-w-[200px]">Correo</TableHead>
                  <TableHead className="min-w-[160px]">Teléfono</TableHead>
                  <TableHead className="min-w-[220px]">Asignado a</TableHead>
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
            Total: {totalCount.toLocaleString('es-DO')} | Página {currentPage} de {effectivePagination.totalPages}
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

      <Dialog
        open={assignDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setAssignDialog({ ...INITIAL_ASSIGN_DIALOG_STATE });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-dr-blue" />
              Asignar beneficiario
            </DialogTitle>
            <DialogDescription>
              Seleccione el analista que dará seguimiento al beneficiario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {assignDialog.beneficiary && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-dr-dark-gray">
                  {buildBeneficiaryName(assignDialog.beneficiary)}
                </p>
                <p className="text-xs text-gray-500">
                  ID: {resolveBeneficiaryIdentifier(assignDialog.beneficiary) ?? '—'}
                </p>
                {assignDialog.beneficiary.nationalId && (
                  <p className="text-xs text-gray-500">
                    Cédula: {assignDialog.beneficiary.nationalId}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="beneficiary-analyst">Seleccionar analista *</Label>
              <Select
                value={assignDialog.selectedAnalystId}
                onValueChange={(value) =>
                  setAssignDialog((prev) => ({
                    ...prev,
                    selectedAnalystId: value,
                    error: null,
                  }))
                }
                disabled={isLoadingAnalysts}
              >
                <SelectTrigger id="beneficiary-analyst" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingAnalysts ? 'Cargando analistas...' : 'Seleccione un analista'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {analysts.map((analyst) => (
                    <SelectItem key={analyst.id} value={analyst.id}>
                      {analyst.name}
                      {analyst.email ? ` — ${analyst.email}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {analystsError && (
                <p className="text-xs text-red-600">{analystsError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficiary-assignment-notes">Comentarios (opcional)</Label>
              <Textarea
                id="beneficiary-assignment-notes"
                placeholder="Agregue instrucciones para el analista..."
                rows={3}
                value={assignDialog.notes}
                onChange={(event) =>
                  setAssignDialog((prev) => ({ ...prev, notes: event.target.value }))
                }
                disabled={assignDialog.isSubmitting}
              />
            </div>

            {assignDialog.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {assignDialog.error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignDialog({ ...INITIAL_ASSIGN_DIALOG_STATE })}
              disabled={assignDialog.isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-dr-blue hover:bg-dr-blue-dark text-white"
              onClick={handleConfirmAssignment}
              disabled={assignDialog.isSubmitting || !assignDialog.selectedAnalystId}
            >
              {assignDialog.isSubmitting ? 'Asignando...' : 'Asignar beneficiario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div>
                <p className="text-xs uppercase text-gray-500">Analista asignado</p>
                <p className="text-sm text-dr-dark-gray">
                  {selectedAssignment?.analystName ?? 'Sin asignar'}
                </p>
                {selectedAssignment?.analystEmail && (
                  <p className="text-xs text-gray-500">{selectedAssignment.analystEmail}</p>
                )}
                {selectedAssignment?.supervisorName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Asignado por {selectedAssignment.supervisorName}
                  </p>
                )}
                {selectedAssignment?.assignmentDate && (
                  <p className="text-xs text-gray-500">
                    Fecha de asignación:{' '}
                    {formatAssignmentDateTime(selectedAssignment.assignmentDate) ??
                      formatBeneficiaryDate(selectedAssignment.assignmentDate)}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase text-gray-500">Notas del beneficiario</p>
                <p className="text-sm text-gray-700">
                  {typeof selectedBeneficiary.notes === 'string' && selectedBeneficiary.notes.trim()
                    ? selectedBeneficiary.notes.trim()
                    : 'Sin notas registradas.'}
                </p>
              </div>
              {selectedAssignment?.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-gray-500">Notas de asignación</p>
                  <p className="text-sm text-gray-700">{selectedAssignment.notes}</p>
                </div>
              )}
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
