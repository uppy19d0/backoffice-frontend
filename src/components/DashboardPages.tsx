import React, { useCallback, useEffect, useState } from 'react';

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
}

interface PageProps {
  currentUser?: CurrentUser | null;
  authToken?: string | null;
}

import { 
  getRequests, 
  getRequestCountReport, 
  getMonthlyRequestReport,
  getAnnualRequestReport,
  getActiveUsersReport,
  getUsersByRoleReport
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
  RefreshCw
} from 'lucide-react';
import { ApiError, BeneficiaryDto, searchBeneficiaries } from '../services/api';

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
export function DashboardOverview({ currentUser, authToken }: PageProps) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
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
                    <p className="text-2xl font-bold text-dr-dark-gray">3</p>
                  </div>
                </div>
                <Button className="bg-dr-blue hover:bg-dr-blue-dark">
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
  const [requests, setRequests] = useState<any[]>([]);
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

  // Load requests from backend
  useEffect(() => {
    const loadRequests = async () => {
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
      } catch (error) {
        console.error('Error cargando solicitudes:', error);
        setLoadError(error instanceof Error ? error.message : 'Error cargando solicitudes');
        toast.error('Error al cargar las solicitudes del sistema');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [authToken]);

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
    if (currentUser?.roleLevel === 'analista') {
      // Analysts only see their assigned requests
      filteredRequests = requests.filter(req => req.assignedTo === currentUser.name);
    } else if (currentUser?.roleLevel === 'manager') {
      // Managers see all requests (can assign to analysts)
      filteredRequests = requests;
    } else {
      // Administrators see all requests
      filteredRequests = requests;
    }

    // Search filter
    if (searchTerm) {
      filteredRequests = filteredRequests.filter(req =>
        req.applicant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.cedula?.includes(searchTerm) ||
        req.id?.includes(searchTerm)
      );
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

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleAssignRequest = (request: any) => {
    setSelectedRequest(request);
    setShowAssignModal(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedAnalyst || !selectedRequest) {
      toast.error('Por favor seleccione un analista');
      return;
    }

    const analystInfo = availableAnalysts.find(a => a.id === selectedAnalyst);
    if (!analystInfo) {
      toast.error('Analista no encontrado');
      return;
    }

    // Update the request
    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id 
        ? {
            ...req,
            status: 'assigned',
            assignedTo: analystInfo.name,
            assignmentDate: new Date().toLocaleDateString('es-DO'),
            assignmentNotes: assignmentNotes
          }
        : req
    ));

    toast.success(
      `Solicitud asignada exitosamente`,
      {
        description: `${selectedRequest.applicant} → ${analystInfo.name}`,
        duration: 4000
      }
    );

    // Reset state
    setShowAssignModal(false);
    setSelectedAnalyst('');
    setAssignmentNotes('');
    setSelectedRequest(null);
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
    ? requests.filter(req => normalizeStatus(req.status) === 'pending' && !req.assignedTo).length 
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
                    {(currentUser?.roleLevel === 'manager' || currentUser?.roleLevel === 'administrador') && (
                      <TableHead className="hidden xl:table-cell">Asignado a</TableHead>
                    )}
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
                    {(currentUser?.roleLevel === 'manager' || currentUser?.roleLevel === 'administrador') && (
                      <TableCell className="hidden xl:table-cell">
                        {request.assignedTo ? (
                          <span className="text-sm text-dr-blue">{request.assignedTo}</span>
                        ) : (
                          <span className="text-sm text-gray-500">Sin asignar</span>
                        )}
                      </TableCell>
                    )}
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
                          const isManager = currentUser?.roleLevel === 'manager' || currentUser?.roleLevel === 'administrador';
                          const isPending = normalizeStatus(request.status) === 'pending';
                          const isUnassigned = !request.assignedTo;
                          
                          // Debug log
                          if (isManager && isPending) {
                            console.log('Request:', request.id, {
                              status: request.status,
                              normalizedStatus: normalizeStatus(request.status),
                              assignedTo: request.assignedTo,
                              shouldShow: isManager && isPending && isUnassigned
                            });
                          }
                          
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
              <Select value={selectedAnalyst} onValueChange={setSelectedAnalyst}>
                <SelectTrigger id="analyst" className="w-full">
                  <SelectValue placeholder="Seleccione un analista..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAnalysts.map((analyst) => (
                    <SelectItem key={analyst.id} value={analyst.id}>
                      {analyst.name} - {analyst.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {availableAnalysts.length} analistas disponibles
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmAssignment}
              disabled={!selectedAnalyst}
              className="bg-dr-blue hover:bg-dr-blue-dark"
            >
              Asignar Solicitud
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

export function BeneficiariesPage({ authToken }: PageProps) {
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
        const result = await searchBeneficiaries(authToken, {
          search: term || undefined,
          pageNumber: page,
          pageSize,
        });

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
          if (err.status === 401 || err.status === 403) {
            message = 'No tiene permisos para consultar los beneficiarios.';
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
    [authToken, pageSize],
  );

  useEffect(() => {
    void loadBeneficiaries(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, loadBeneficiaries]);

  const handleViewBeneficiary = (beneficiary: BeneficiaryDto) => {
    setSelectedBeneficiary(beneficiary);
    setShowViewModal(true);
  };

  const totalCount = pagination.totalCount;
  const withEmail = beneficiaries.filter(
    (beneficiary) => typeof beneficiary.email === 'string' && beneficiary.email.trim(),
  ).length;
  const withPhone = beneficiaries.filter(
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

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="py-8 text-center text-gray-500">
            Cargando beneficiarios...
          </TableCell>
        </TableRow>
      );
    }

    if (beneficiaries.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="py-8 text-center text-gray-500">
            No se encontraron beneficiarios para la búsqueda indicada.
          </TableCell>
        </TableRow>
      );
    }

    return beneficiaries.map((beneficiary) => {
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
          <TableCell className="text-sm text-dr-blue break-all">{idValue}</TableCell>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewBeneficiary(beneficiary)}
              className="text-dr-blue hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
            </Button>
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
                <p className="text-xs text-gray-500">Página actual: {beneficiaries.length}</p>
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
                  {beneficiaries.length > 0
                    ? `${((withEmail / beneficiaries.length) * 100).toFixed(1)}%`
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
                  {beneficiaries.length > 0
                    ? `${((withPhone / beneficiaries.length) * 100).toFixed(1)}%`
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
                  Página {currentPage} de {pagination.totalPages}
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
            Mostrando {beneficiaries.length} registro{beneficiaries.length === 1 ? '' : 's'} en la página {currentPage}.
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
                  <TableHead className="min-w-[140px]">Registro</TableHead>
                  <TableHead className="min-w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTableBody()}</TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Total: {totalCount.toLocaleString('es-DO')} | Página {currentPage} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={isLoading || (!pagination.hasPreviousPage && currentPage === 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => (pagination.hasNextPage ? prev + 1 : prev))}
              disabled={isLoading || !pagination.hasNextPage}
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
                <p className="text-xs uppercase text-gray-500">Notas</p>
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
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedMonth] = useState(new Date().getMonth() + 1);

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
      toast.error('Error al cargar reporte mensual');
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
      toast.error('Error al cargar reporte anual');
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
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              variant="outline" 
              className="h-auto p-6 text-left"
              onClick={handleViewMonthlyReport}
            >
              <div className="flex items-start gap-4">
                <FileText className="h-8 w-8 text-dr-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-dr-dark-gray">Reporte Mensual de Solicitudes</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Solicitudes del mes actual con desglose por estado y tipo
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ArrowRight className="h-4 w-4 text-dr-blue" />
                    <span className="text-sm text-dr-blue">Ver reporte</span>
                  </div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-6 text-left"
              onClick={handleViewAnnualReport}
            >
              <div className="flex items-start gap-4">
                <TrendingUp className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-dr-dark-gray">Reporte Anual de Solicitudes</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Análisis anual con desglose mensual de solicitudes
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ArrowRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Ver reporte</span>
                  </div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-6 text-left"
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
            >
              <div className="flex items-start gap-4">
                <Users className="h-8 w-8 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-dr-dark-gray">Reporte de Usuarios Activos</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Usuarios activos agrupados por departamento y provincia
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-600">Ver reporte</span>
                  </div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-6 text-left"
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
            >
              <div className="flex items-start gap-4">
                <ClipboardList className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-dr-dark-gray">Reporte de Usuarios por Roles</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Distribución de usuarios agrupados por roles del sistema
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ArrowRight className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-600">Ver reporte</span>
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
