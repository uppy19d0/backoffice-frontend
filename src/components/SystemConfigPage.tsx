import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Shield,
  Activity,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

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

interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ip: string;
  status: 'success' | 'failed' | 'warning';
  details: string;
  category: 'auth' | 'user' | 'request' | 'system' | 'security';
}

export function SystemConfigPage({ currentUser }: PageProps) {
  // Estados para filtros de logs
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  // Mock system logs expandido
  const [systemLogs] = useState<SystemLog[]>([
    {
      id: 'LOG-001',
      timestamp: '08/01/2025 10:15:32',
      user: 'admin',
      action: 'Inicio de Sesión',
      resource: 'Sistema',
      ip: '192.168.1.100',
      status: 'success',
      details: 'Inicio de sesión exitoso desde navegador Chrome',
      category: 'auth'
    },
    {
      id: 'LOG-002',
      timestamp: '08/01/2025 10:12:45',
      user: 'manager',
      action: 'Aprobar Solicitud',
      resource: 'Solicitud #2025-001234',
      ip: '192.168.1.101',
      status: 'success',
      details: 'Solicitud de beneficio aprobada por gerente de operaciones',
      category: 'request'
    },
    {
      id: 'LOG-003',
      timestamp: '08/01/2025 10:10:18',
      user: 'analista',
      action: 'Revisar Solicitud',
      resource: 'Solicitud #2025-001235',
      ip: '192.168.1.102',
      status: 'success',
      details: 'Solicitud enviada a revisión con recomendación de aprobación',
      category: 'request'
    },
    {
      id: 'LOG-004',
      timestamp: '08/01/2025 09:55:33',
      user: 'system',
      action: 'Respaldo Automático',
      resource: 'Base de datos',
      ip: 'localhost',
      status: 'success',
      details: 'Respaldo automático de base de datos completado (2.3GB)',
      category: 'system'
    },
    {
      id: 'LOG-005',
      timestamp: '08/01/2025 09:30:12',
      user: 'admin',
      action: 'Crear Usuario',
      resource: 'Usuario: jperez',
      ip: '192.168.1.100',
      status: 'success',
      details: 'Nuevo usuario analista creado: Juan Pérez (jperez)',
      category: 'user'
    },
    {
      id: 'LOG-006',
      timestamp: '08/01/2025 09:15:44',
      user: 'unknown',
      action: 'Intento de Acceso',
      resource: 'Sistema',
      ip: '192.168.1.150',
      status: 'failed',
      details: 'Intento de inicio de sesión fallido - credenciales incorrectas (usuario: hacker)',
      category: 'security'
    },
    {
      id: 'LOG-007',
      timestamp: '08/01/2025 09:00:15',
      user: 'manager',
      action: 'Suspender Usuario',
      resource: 'Usuario: cperez',
      ip: '192.168.1.101',
      status: 'success',
      details: 'Usuario Carmen Pérez suspendido por violación de política',
      category: 'user'
    },
    {
      id: 'LOG-008',
      timestamp: '08/01/2025 08:45:22',
      user: 'system',
      action: 'Verificación de Integridad',
      resource: 'Sistema de archivos',
      ip: 'localhost',
      status: 'success',
      details: 'Verificación de integridad del sistema completada sin errores',
      category: 'system'
    },
    {
      id: 'LOG-009',
      timestamp: '08/01/2025 08:30:11',
      user: 'analista',
      action: 'Exportar Reporte',
      resource: 'Reporte mensual',
      ip: '192.168.1.102',
      status: 'success',
      details: 'Reporte mensual de solicitudes exportado en formato PDF',
      category: 'system'
    },
    {
      id: 'LOG-010',
      timestamp: '08/01/2025 08:15:33',
      user: 'unknown',
      action: 'Acceso No Autorizado',
      resource: 'Página de administración',
      ip: '203.0.113.45',
      status: 'failed',
      details: 'Intento de acceso directo a página de administración bloqueado',
      category: 'security'
    }
  ]);

  // Filtrar logs
  const filteredLogs = systemLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          Exitoso
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">
          Fallido
        </Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          Advertencia
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'auth':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Autenticación
        </Badge>;
      case 'user':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          Usuarios
        </Badge>;
      case 'request':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Solicitudes
        </Badge>;
      case 'system':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Sistema
        </Badge>;
      case 'security':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Seguridad
        </Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const handleExportLogs = () => {
    // Simular exportación de logs
    alert('Exportando logs del sistema...');
  };

  const handleRefreshLogs = () => {
    // Simular actualización de logs
    alert('Actualizando logs del sistema...');
  };

  if (!currentUser?.permissions.canCreateUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No tiene permisos suficientes para acceder a los logs del sistema.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-dr-dark-gray">Logs del Sistema</h2>
          <p className="text-gray-600">Registro de actividades y eventos del sistema SIUBEN</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshLogs}
            className="border-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button 
            onClick={handleExportLogs}
            className="bg-dr-blue hover:bg-dr-blue-dark text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-dr-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dr-dark-gray">{systemLogs.length}</div>
            <p className="text-xs text-gray-600 mt-1">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Exitosos</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dr-dark-gray">
              {systemLogs.filter(log => log.status === 'success').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {Math.round((systemLogs.filter(log => log.status === 'success').length / systemLogs.length) * 100)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Fallidos</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dr-dark-gray">
              {systemLogs.filter(log => log.status === 'failed').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos de Seguridad</CardTitle>
            <Shield className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dr-dark-gray">
              {systemLogs.filter(log => log.category === 'security').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Eventos críticos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar en logs..." 
            className="pl-10 border-gray-300" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] border-gray-300">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              <SelectItem value="success">Exitoso</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
              <SelectItem value="warning">Advertencia</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[150px] border-gray-300">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              <SelectItem value="auth">Autenticación</SelectItem>
              <SelectItem value="user">Usuarios</SelectItem>
              <SelectItem value="request">Solicitudes</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
              <SelectItem value="security">Seguridad</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[150px] border-gray-300">
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="all">Todo el Tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-dr-dark-gray">ID</TableHead>
                  <TableHead className="text-dr-dark-gray min-w-[140px]">Fecha/Hora</TableHead>
                  <TableHead className="text-dr-dark-gray">Usuario</TableHead>
                  <TableHead className="text-dr-dark-gray">Acción</TableHead>
                  <TableHead className="text-dr-dark-gray hidden lg:table-cell">Recurso</TableHead>
                  <TableHead className="text-dr-dark-gray hidden xl:table-cell">IP</TableHead>
                  <TableHead className="text-dr-dark-gray">Estado</TableHead>
                  <TableHead className="text-dr-dark-gray hidden sm:table-cell">Categoría</TableHead>
                  <TableHead className="w-[50px]">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No se encontraron logs que coincidan con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-dr-blue">{log.id}</TableCell>
                      <TableCell className="text-dr-dark-gray text-sm">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="text-dr-dark-gray">
                        <span className="font-medium">{log.user}</span>
                      </TableCell>
                      <TableCell className="text-dr-dark-gray">{log.action}</TableCell>
                      <TableCell className="text-dr-dark-gray hidden lg:table-cell text-sm">
                        {log.resource}
                      </TableCell>
                      <TableCell className="text-dr-dark-gray hidden xl:table-cell text-sm font-mono">
                        {log.ip}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getCategoryBadge(log.category)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title={log.details}
                          onClick={() => alert(log.details)}
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

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Mostrando {filteredLogs.length} de {systemLogs.length} eventos del sistema
      </div>
    </div>
  );
}