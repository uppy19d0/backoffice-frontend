import React, { useState } from 'react';

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
}

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
import { toast } from 'sonner@2.0.3';
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
  Plus
} from 'lucide-react';

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

const getStatusBadge = (status: string) => {
  switch (status) {
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
      return <Badge variant="outline">{status}</Badge>;
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
export function DashboardOverview({ currentUser }: PageProps) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Estadísticas específicas por rol
  const getStatsForRole = () => {
    if (currentUser?.roleLevel === 'administrador') {
      return [
        {
          title: 'Total de Beneficiarios',
          value: '1,247,892',
          change: '+2.3% vs mes anterior',
          icon: Users,
          color: 'text-dr-blue',
          bg: 'bg-blue-50'
        },
        {
          title: 'Usuarios del Sistema',
          value: '47',
          change: '+3 este mes',
          icon: UserPlus,
          color: 'text-dr-blue',
          bg: 'bg-blue-50'
        },
        {
          title: 'Solicitudes Pendientes',
          value: '8,456',
          change: '-12% vs semana anterior',
          icon: Clock,
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        },
        {
          title: 'Uptime del Sistema',
          value: '99.8%',
          change: '24/7 operativo',
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50'
        },
      ];
    } else if (currentUser?.roleLevel === 'manager') {
      return [
        {
          title: 'Solicitudes sin Asignar',
          value: '34',
          change: '+5 hoy',
          icon: ClipboardList,
          color: 'text-dr-blue',
          bg: 'bg-blue-50'
        },
        {
          title: 'Solicitudes Pendientes',
          value: '8,456',
          change: '-12% vs semana anterior',
          icon: Clock,
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        },
        {
          title: 'Solicitudes Aprobadas',
          value: '12,234',
          change: '+19% vs mes anterior',
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50'
        },
        {
          title: 'Mi Equipo',
          value: '12',
          change: 'analistas activos',
          icon: Users,
          color: 'text-dr-blue',
          bg: 'bg-blue-50'
        },
      ];
    } else {
      return [
        {
          title: 'Mis Solicitudes Hoy',
          value: '23',
          change: '+5 vs ayer',
          icon: ClipboardList,
          color: 'text-dr-blue',
          bg: 'bg-blue-50'
        },
        {
          title: 'Pendientes de Revisión',
          value: '15',
          change: 'requieren atención',
          icon: Clock,
          color: 'text-amber-600',
          bg: 'bg-amber-50'
        },
        {
          title: 'Completadas Hoy',
          value: '8',
          change: '+3 vs ayer',
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

  // Solicitudes adaptadas según el rol del usuario
  const getAllRequests = () => [
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

  // Filtrar solicitudes según el rol del usuario
  const getFilteredRequests = () => {
    const allRequests = getAllRequests();
    
    if (currentUser?.roleLevel === 'analista') {
      // Para analistas: mostrar principalmente sus solicitudes asignadas + algunas recientes del sistema
      const myAssignedRequests = allRequests.filter(req => req.assignedTo === currentUser.name);
      const recentSystemRequests = allRequests.filter(req => req.assignedTo !== currentUser.name).slice(0, 2);
      return [...myAssignedRequests, ...recentSystemRequests];
    } else if (currentUser?.roleLevel === 'manager') {
      // Para managers: mostrar solicitudes que requieren aprobación + en revisión
      return allRequests.filter(req => 
        req.status === 'review' || 
        req.status === 'pending' || 
        (req.assignedTo === currentUser.name)
      );
    } else {
      // Para administradores: mostrar todas las solicitudes recientes
      return allRequests;
    }
  };

  const recentRequests = getFilteredRequests();

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
                {recentRequests.map((request) => (
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
                ))}
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
                  {selectedRequest.documents?.map((doc: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-dr-dark-gray">{doc}</span>
                    </div>
                  ))}
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
export function RequestsPage({ currentUser }: PageProps) {
  const [requests, setRequests] = useState(() => {
    // Initialize requests data
    return [
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
        id: '2025-001237', 
        applicant: 'Pedro Martínez López', 
        cedula: '001-4567890-1',
        status: 'pending', 
        date: '07/07/2025',
        province: 'San Cristóbal',
        type: 'benefit_application',
        address: 'Av. Constitución #890, San Cristóbal',
        phone: '809-555-4567',
        email: 'pedro.martinez@email.com',
        householdSize: 6,
        monthlyIncome: 'RD$ 18,500',
        reason: 'Nueva solicitud de beneficio',
        description: 'Familia de 6 miembros solicita ingreso al programa de beneficios sociales debido a situación económica vulnerable.',
        documents: ['Cédula', 'Certificados de nacimiento (todos)', 'Comprobante de ingresos', 'Evaluación socioeconómica'],
        assignedTo: null,
        reviewedBy: null,
        reviewDate: null,
        priority: 'high'
      },
      { 
        id: '2025-001238', 
        applicant: 'Carmen Elena Rodríguez', 
        cedula: '001-5678901-2',
        status: 'pending', 
        date: '07/07/2025',
        province: 'Azua',
        type: 'address_change',
        address: 'Calle Duarte #345, Azua',
        phone: '809-555-5678',
        email: 'carmen.rodriguez@email.com',
        householdSize: 3,
        monthlyIncome: 'RD$ 22,000',
        reason: 'Cambio de residencia',
        description: 'Solicitud de actualización de dirección por mudanza a nueva provincia por motivos familiares.',
        documents: ['Contrato de alquiler', 'Comprobante de servicios', 'Declaración jurada de mudanza'],
        assignedTo: null,
        reviewedBy: null,
        reviewDate: null,
        priority: 'low'
      },
      // Solicitudes ya asignadas para analistas
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
        assignedTo: 'Lic. Esperanza María Rodríguez',
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
        assignedTo: 'Lic. Juan Miguel Valdez',
        reviewedBy: null,
        reviewDate: null,
        priority: 'medium'
      },
      {
        id: '2025-001243',
        applicant: 'Rosa Elena Fernández',
        cedula: '001-0123456-7',
        status: 'review',
        date: '05/07/2025',
        province: 'Barahona',
        type: 'info_update',
        address: 'Calle Independencia #567, Barahona',
        phone: '809-555-0123',
        email: 'rosa.fernandez@email.com',
        householdSize: 4,
        monthlyIncome: 'RD$ 16,500',
        reason: 'Actualización de información familiar',
        description: 'Cambios en la composición familiar requieren actualización de datos en el sistema.',
        documents: ['Acta de matrimonio', 'Certificados de nacimiento nuevos', 'Comprobante de ingresos actualizado'],
        assignedTo: 'Lic. Esperanza María Rodríguez',
        reviewedBy: null,
        reviewDate: null,
        priority: 'medium'
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAnalyst, setSelectedAnalyst] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

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
        req.applicant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.cedula.includes(searchTerm) ||
        req.id.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
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
    if (!selectedAnalyst || !selectedRequest) return;

    const analystInfo = availableAnalysts.find(a => a.id === selectedAnalyst);
    if (!analystInfo) return;

    // Update the request
    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id 
        ? {
            ...req,
            status: 'assigned',
            assignedTo: analystInfo.name,
            assignmentDate: new Date().toLocaleDateString('es-DO')
          }
        : req
    ));

    toast.success(
      `Solicitud #${selectedRequest.id} asignada correctamente a ${analystInfo.name}`,
      {
        description: assignmentNotes || 'Sin comentarios adicionales'
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
    ? requests.filter(req => req.status === 'pending' && !req.assignedTo).length 
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
                {filteredRequests.length} solicitud{filteredRequests.length !== 1 ? 'es' : ''} 
                {currentUser?.roleLevel === 'analista' ? ' asignada' + (filteredRequests.length !== 1 ? 's' : '') : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Assignment button for managers on unassigned requests */}
                        {(currentUser?.roleLevel === 'manager' || currentUser?.roleLevel === 'administrador') && 
                         request.status === 'pending' && !request.assignedTo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignRequest(request)}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
            <div>
              <Label htmlFor="analyst">Seleccionar Analista</Label>
              <Select value={selectedAnalyst} onValueChange={setSelectedAnalyst}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un analista..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAnalysts.map((analyst) => (
                    <SelectItem key={analyst.id} value={analyst.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{analyst.name}</span>
                        <span className="text-sm text-gray-500">{analyst.role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Comentarios (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agregue comentarios o instrucciones especiales para el analista..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                rows={3}
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
                  {selectedRequest.documents?.map((doc: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-dr-dark-gray">{doc}</span>
                    </div>
                  ))}
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
export function BeneficiariesPage({ currentUser }: PageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Mock beneficiaries data
  const beneficiaries = [
    {
      id: 'BEN-001234',
      name: 'Ana María González Pérez',
      cedula: '001-1234567-8',
      status: 'active',
      registrationDate: '15/03/2023',
      province: 'Santo Domingo',
      municipality: 'Los Alcarrizos',
      address: 'Calle Primera #123, Los Alcarrizos',
      phone: '809-555-1234',
      email: 'ana.gonzalez@email.com',
      householdSize: 4,
      monthlyIncome: 'RD$ 15,000',
      benefitType: 'Tarjeta Solidaridad',
      lastPayment: '01/07/2025',
      nextPayment: '01/08/2025',
      totalReceived: 'RD$ 48,000'
    },
    {
      id: 'BEN-001235',
      name: 'Carlos Roberto Martínez López',
      cedula: '001-2345678-9',
      status: 'suspended',
      registrationDate: '22/05/2023',
      province: 'Santiago',
      municipality: 'Santiago',
      address: 'Av. Estrella Sadhalá #456, Santiago',
      phone: '809-555-2345',
      email: 'carlos.martinez@email.com',
      householdSize: 6,
      monthlyIncome: 'RD$ 18,500',
      benefitType: 'Subsidio Familiar',
      lastPayment: '01/05/2025',
      nextPayment: 'Suspendido',
      totalReceived: 'RD$ 96,000'
    },
    {
      id: 'BEN-001236',
      name: 'María Elena Rodríguez Castro',
      cedula: '001-3456789-0',
      status: 'active',
      registrationDate: '08/01/2024',
      province: 'La Vega',
      municipality: 'La Vega',
      address: 'Calle Duarte #789, La Vega',
      phone: '809-555-3456',
      email: 'maria.rodriguez@email.com',
      householdSize: 3,
      monthlyIncome: 'RD$ 12,000',
      benefitType: 'Tarjeta Solidaridad',
      lastPayment: '01/07/2025',
      nextPayment: '01/08/2025',
      totalReceived: 'RD$ 24,000'
    },
    {
      id: 'BEN-001237',
      name: 'José Miguel Fernández Herrera',
      cedula: '001-4567890-1',
      status: 'inactive',
      registrationDate: '12/09/2022',
      province: 'San Cristóbal',
      municipality: 'San Cristóbal',
      address: 'Av. Constitución #890, San Cristóbal',
      phone: '809-555-4567',
      email: 'jose.fernandez@email.com',
      householdSize: 5,
      monthlyIncome: 'RD$ 25,000',
      benefitType: 'Subsidio Familiar',
      lastPayment: '01/12/2024',
      nextPayment: 'Inactivo',
      totalReceived: 'RD$ 120,000'
    }
  ];

  // Filter beneficiaries
  const filteredBeneficiaries = beneficiaries.filter(beneficiary => {
    const matchesSearch = beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         beneficiary.cedula.includes(searchTerm) ||
                         beneficiary.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || beneficiary.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewBeneficiary = (beneficiary: any) => {
    setSelectedBeneficiary(beneficiary);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dr-dark-gray">Gestión de Beneficiarios</h1>
        <p className="text-gray-600 mt-1">
          Consulte y gestione la información de beneficiarios del sistema SIUBEN
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-xl font-bold text-dr-dark-gray">1,245,672</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Suspendidos</p>
                <p className="text-xl font-bold text-dr-dark-gray">1,892</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactivos</p>
                <p className="text-xl font-bold text-dr-dark-gray">328</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-dr-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pagado</p>
                <p className="text-xl font-bold text-dr-dark-gray">RD$ 89.2M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, cédula o ID de beneficiario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiaries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Beneficiarios</CardTitle>
          <CardDescription>
            {filteredBeneficiaries.length} beneficiario{filteredBeneficiaries.length !== 1 ? 's' : ''} encontrado{filteredBeneficiaries.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Beneficiario</TableHead>
                  <TableHead className="hidden sm:table-cell">Cédula</TableHead>
                  <TableHead className="hidden md:table-cell">Provincia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo de Beneficio</TableHead>
                  <TableHead className="hidden xl:table-cell">Último Pago</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBeneficiaries.map((beneficiary) => (
                  <TableRow key={beneficiary.id}>
                    <TableCell className="font-medium text-dr-blue">{beneficiary.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{beneficiary.name}</p>
                        <p className="text-sm text-gray-500 sm:hidden">{beneficiary.cedula}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{beneficiary.cedula}</TableCell>
                    <TableCell className="hidden md:table-cell">{beneficiary.province}</TableCell>
                    <TableCell>{getBeneficiaryStatusBadge(beneficiary.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{beneficiary.benefitType}</TableCell>
                    <TableCell className="hidden xl:table-cell">{beneficiary.lastPayment}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Beneficiary Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dr-dark-gray flex items-center gap-2">
              <User className="h-5 w-5 text-dr-blue" />
              Perfil del Beneficiario {selectedBeneficiary?.id}
            </DialogTitle>
            <DialogDescription>
              Información completa de {selectedBeneficiary?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBeneficiary && (
            <div className="space-y-6">
              {/* Status and Registration Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getBeneficiaryStatusBadge(selectedBeneficiary.status)}
                  <span className="text-sm text-gray-600">
                    Registrado el {selectedBeneficiary.registrationDate}
                  </span>
                </div>
                <div className="text-sm font-medium text-dr-blue">
                  {selectedBeneficiary.benefitType}
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Nombre Completo</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedBeneficiary.name}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Cédula</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedBeneficiary.cedula}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Teléfono</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <p className="text-dr-dark-gray">{selectedBeneficiary.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-dr-dark-gray">{selectedBeneficiary.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Dirección</Label>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <p className="text-dr-dark-gray">{selectedBeneficiary.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Household Information */}
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Información del Hogar
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Miembros del Hogar</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedBeneficiary.householdSize} personas</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Ingresos Mensuales</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedBeneficiary.monthlyIncome}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Provincia</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedBeneficiary.province}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Benefit Information */}
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Información de Beneficios
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Tipo de Beneficio</Label>
                    <div className="p-3 bg-blue-50 rounded-md">
                      <p className="text-dr-blue font-medium">{selectedBeneficiary.benefitType}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Total Recibido</Label>
                    <div className="p-3 bg-green-50 rounded-md">
                      <p className="text-green-700 font-medium">{selectedBeneficiary.totalReceived}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Último Pago</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedBeneficiary.lastPayment}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Próximo Pago</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-dr-dark-gray font-medium">{selectedBeneficiary.nextPayment}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reports Page
export function ReportsPage({ currentUser }: PageProps) {
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full">
                <Users className="h-6 w-6 text-dr-blue" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray">Total Beneficiarios</h3>
                <p className="text-2xl font-bold text-dr-blue">1,247,892</p>
                <p className="text-sm text-gray-600">+2.3% vs mes anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray">Pagos Este Mes</h3>
                <p className="text-2xl font-bold text-green-600">RD$ 8.9M</p>
                <p className="text-sm text-gray-600">+5.7% vs mes anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-full">
                <ClipboardList className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dr-dark-gray">Solicitudes Procesadas</h3>
                <p className="text-2xl font-bold text-amber-600">15,642</p>
                <p className="text-sm text-gray-600">Este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Button variant="outline" className="h-auto p-6 text-left">
              <div className="flex items-start gap-4">
                <FileText className="h-8 w-8 text-dr-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-dr-dark-gray">Reporte de Beneficiarios</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Lista completa de beneficiarios activos, suspendidos e inactivos
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ArrowRight className="h-4 w-4 text-dr-blue" />
                    <span className="text-sm text-dr-blue">Generar reporte</span>
                  </div>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-6 text-left">
              <div className="flex items-start gap-4">
                <DollarSign className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-dr-dark-gray">Reporte de Pagos</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Detalle de pagos realizados por período y tipo de beneficio
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ArrowRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Generar reporte</span>
                  </div>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-6 text-left">
              <div className="flex items-start gap-4">
                <ClipboardList className="h-8 w-8 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-dr-dark-gray">Reporte de Solicitudes</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Estado y seguimiento de solicitudes por período
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-600">Generar reporte</span>
                  </div>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-6 text-left">
              <div className="flex items-start gap-4">
                <TrendingUp className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-dr-dark-gray">Reporte Estadístico</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Análisis estadístico y tendencias del sistema
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ArrowRight className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-600">Generar reporte</span>
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Recientes</CardTitle>
          <CardDescription>
            Últimos reportes generados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-dr-blue" />
                <div>
                  <p className="font-medium text-dr-dark-gray">Reporte de Beneficiarios - Julio 2025</p>
                  <p className="text-sm text-gray-600">Generado el 05/07/2025 por Dr. María Elena Santos</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Ver
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-dr-dark-gray">Reporte de Pagos - Junio 2025</p>
                  <p className="text-sm text-gray-600">Generado el 02/07/2025 por Lic. Ana Patricia Jiménez</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Ver
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-dr-dark-gray">Análisis Estadístico - Q2 2025</p>
                  <p className="text-sm text-gray-600">Generado el 28/06/2025 por Dr. María Elena Santos</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Ver
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}