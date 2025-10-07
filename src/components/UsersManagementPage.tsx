import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { 
  Users, 
  UserPlus, 
  Search,
  Filter,
  Edit3,
  Shield,
  Eye,
  Trash2,
  Settings,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Clock,
  UserX,
  UserCheck,
  Ban,
  RotateCcw,
  Save,
  Key,
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
  onUpdateUser?: (username: string, updates: any) => void;
  getPermissionsByRole?: (roleLevel: 'administrador' | 'manager' | 'analista') => any;
}

interface SystemUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  roleLevel: 'administrador' | 'manager' | 'analista';
  status: 'active' | 'inactive' | 'suspended';
  department: string;
  province: string;
  lastLogin: string;
  createdDate: string;
}

export function UsersManagementPage({ currentUser, onUpdateUser, getPermissionsByRole }: PageProps) {
  // Estado de usuarios - ahora funcional
  const [users, setUsers] = useState<SystemUser[]>([
    {
      id: 'USR-001',
      username: 'admin',
      name: 'Dr. María Elena Santos',
      email: 'maria.santos@siuben.gob.do',
      role: 'Administrador General SIUBEN',
      roleLevel: 'administrador',
      status: 'active',
      department: 'Administración Central',
      province: 'Distrito Nacional',
      lastLogin: '08/01/2025 09:30',
      createdDate: '15/03/2024'
    },
    {
      id: 'USR-002',
      username: 'manager',
      name: 'Lic. Ana Patricia Jiménez',
      email: 'ana.jimenez@siuben.gob.do',
      role: 'Gerente de Operaciones',
      roleLevel: 'manager',
      status: 'active',
      department: 'Operaciones',
      province: 'Santo Domingo',
      lastLogin: '08/01/2025 08:45',
      createdDate: '20/04/2024'
    },
    {
      id: 'USR-003',
      username: 'analista',
      name: 'Lic. Esperanza María Rodríguez',
      email: 'esperanza.rodriguez@siuben.gob.do',
      role: 'Analista de Solicitudes',
      roleLevel: 'analista',
      status: 'active',
      department: 'Evaluación',
      province: 'Santiago',
      lastLogin: '08/01/2025 07:15',
      createdDate: '10/05/2024'
    },
    {
      id: 'USR-004',
      username: 'jvaldez',
      name: 'Lic. Juan Miguel Valdez',
      email: 'juan.valdez@siuben.gob.do',
      role: 'Analista Regional',
      roleLevel: 'analista',
      status: 'active',
      department: 'Evaluación Regional',
      province: 'La Vega',
      lastLogin: '07/01/2025 16:30',
      createdDate: '25/06/2024'
    },
    {
      id: 'USR-005',
      username: 'rmendoza',
      name: 'Ing. Roberto Carlos Mendoza',
      email: 'roberto.mendoza@siuben.gob.do',
      role: 'Supervisor Regional',
      roleLevel: 'manager',
      status: 'active',
      department: 'Supervisión Regional',
      province: 'San Cristóbal',
      lastLogin: '08/01/2025 06:45',
      createdDate: '12/07/2024'
    },
    {
      id: 'USR-006',
      username: 'cperez',
      name: 'Lic. Carmen Pérez González',
      email: 'carmen.perez@siuben.gob.do',
      role: 'Analista Senior',
      roleLevel: 'analista',
      status: 'suspended',
      department: 'Evaluación',
      province: 'Azua',
      lastLogin: '05/01/2025 14:20',
      createdDate: '18/08/2024'
    }
  ]);

  // Estados para modales y formularios
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // Modal solo para ver
  const [showEditModal, setShowEditModal] = useState(false); // Modal para editar
  const [showRoleCredentialsModal, setShowRoleCredentialsModal] = useState(false); // Modal para cambiar rol y credenciales
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Estado para nuevo usuario
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    email: '',
    role: '',
    roleLevel: '' as 'administrador' | 'manager' | 'analista' | '',
    department: '',
    province: '',
    password: '',
    confirmPassword: ''
  });

  // Estado para editar usuario
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Estado para cambiar rol y credenciales
  const [roleCredentialsForm, setRoleCredentialsForm] = useState({
    newRoleLevel: '' as 'administrador' | 'manager' | 'analista' | '',
    newRole: '',
    newPassword: '',
    confirmNewPassword: '',
    reason: ''
  });

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.roleLevel === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Activo
        </Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <Clock className="h-3 w-3 mr-1" />
          Inactivo
        </Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200">
          <Ban className="h-3 w-3 mr-1" />
          Suspendido
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (roleLevel: string) => {
    switch (roleLevel) {
      case 'administrador':
        return <Badge className="bg-dr-blue text-white">Administrador</Badge>;
      case 'manager':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Manager</Badge>;
      case 'analista':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Analista</Badge>;
      default:
        return <Badge variant="outline">{roleLevel}</Badge>;
    }
  };

  // Funciones de acción - Completamente funcionales

  // Ver usuario (solo lectura)
  const handleViewUser = (user: SystemUser) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  // Editar usuario (con campos editables)
  const handleEditUser = (user: SystemUser) => {
    setEditingUser({ ...user }); // Clonar el usuario para editar
    setShowEditModal(true);
  };

  // Guardar cambios del usuario editado
  const handleSaveEditUser = () => {
    if (!editingUser) return;

    // Validaciones básicas
    if (!editingUser.name.trim() || !editingUser.email.trim()) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    // Verificar email único (excluyendo el usuario actual)
    if (users.some(user => user.email === editingUser.email && user.id !== editingUser.id)) {
      toast.error('El email ya está en uso por otro usuario');
      return;
    }

    // Actualizar el usuario en la lista
    setUsers(prev => prev.map(user => 
      user.id === editingUser.id ? editingUser : user
    ));

    toast.success(`Usuario ${editingUser.name} actualizado exitosamente`);
    
    // Cerrar modal y limpiar estado
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !suspendReason.trim()) {
      toast.error('Por favor proporcione una razón para la suspensión');
      return;
    }

    // Actualizar el estado del usuario
    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id 
        ? { ...user, status: 'suspended' as const }
        : user
    ));

    toast.success(`Usuario ${selectedUser.name} suspendido exitosamente`);
    
    // Cerrar modal y limpiar estado
    setShowSuspendDialog(false);
    setSelectedUser(null);
    setSuspendReason('');
  };

  const handleActivateUser = async () => {
    if (!selectedUser) return;

    // Actualizar el estado del usuario
    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id 
        ? { ...user, status: 'active' as const }
        : user
    ));

    toast.success(`Usuario ${selectedUser.name} activado exitosamente`);
    
    // Cerrar modal y limpiar estado
    setShowActivateDialog(false);
    setSelectedUser(null);
  };

  const handleCreateUser = () => {
    // Validación básica
    if (!newUser.username || !newUser.name || !newUser.email || !newUser.roleLevel) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Verificar si el usuario ya existe
    if (users.some(user => user.username === newUser.username || user.email === newUser.email)) {
      toast.error('El nombre de usuario o email ya existe');
      return;
    }

    // Crear nuevo usuario
    const newUserId = `USR-${String(users.length + 1).padStart(3, '0')}`;
    const userToAdd: SystemUser = {
      id: newUserId,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || `${newUser.roleLevel === 'administrador' ? 'Administrador' : newUser.roleLevel === 'manager' ? 'Manager' : 'Analista'} del Sistema`,
      roleLevel: newUser.roleLevel,
      status: 'active',
      department: newUser.department || 'Por asignar',
      province: newUser.province || 'Por asignar',
      lastLogin: 'Nunca',
      createdDate: new Date().toLocaleDateString('es-DO')
    };

    setUsers(prev => [...prev, userToAdd]);
    toast.success(`Usuario ${newUser.name} creado exitosamente`);
    
    // Resetear formulario y cerrar modal
    setNewUser({
      username: '',
      name: '',
      email: '',
      role: '',
      roleLevel: '',
      department: '',
      province: '',
      password: '',
      confirmPassword: ''
    });
    setShowCreateModal(false);
  };

  const openSuspendDialog = (user: SystemUser) => {
    // Prevenir que un usuario se suspenda a sí mismo
    if (currentUser && user.username === currentUser.username) {
      toast.error('No puede suspenderse a sí mismo');
      return;
    }
    setSelectedUser(user);
    setShowSuspendDialog(true);
  };

  const openActivateDialog = (user: SystemUser) => {
    setSelectedUser(user);
    setShowActivateDialog(true);
  };

  // Función para abrir modal de cambio de rol y credenciales
  const handleChangeRoleCredentials = (user: SystemUser) => {
    if (currentUser && user.username === currentUser.username) {
      toast.error('No puede cambiar su propio rol o credenciales');
      return;
    }
    
    setSelectedUser(user);
    setRoleCredentialsForm({
      newRoleLevel: user.roleLevel,
      newRole: user.role,
      newPassword: '',
      confirmNewPassword: '',
      reason: ''
    });
    setShowRoleCredentialsModal(true);
  };

  // Función para guardar cambios de rol y credenciales
  const handleSaveRoleCredentials = () => {
    if (!selectedUser) return;

    // Validaciones
    if (!roleCredentialsForm.newRoleLevel) {
      toast.error('Por favor seleccione un nivel de rol');
      return;
    }

    if (!roleCredentialsForm.reason.trim()) {
      toast.error('Por favor proporcione una razón para el cambio');
      return;
    }

    if (roleCredentialsForm.newPassword) {
      if (roleCredentialsForm.newPassword !== roleCredentialsForm.confirmNewPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (roleCredentialsForm.newPassword.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    // Actualizar el usuario en la lista local
    const updatedUser = {
      roleLevel: roleCredentialsForm.newRoleLevel as 'administrador' | 'manager' | 'analista',
      role: roleCredentialsForm.newRole || getRoleTitle(roleCredentialsForm.newRoleLevel as 'administrador' | 'manager' | 'analista')
    };

    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id 
        ? { ...user, ...updatedUser }
        : user
    ));

    // Actualizar el sistema de autenticación si está disponible
    if (onUpdateUser && getPermissionsByRole) {
      const systemUpdates = {
        ...updatedUser,
        permissions: getPermissionsByRole(roleCredentialsForm.newRoleLevel as 'administrador' | 'manager' | 'analista')
      };

      // Si se cambió la contraseña, incluirla
      if (roleCredentialsForm.newPassword) {
        systemUpdates.password = roleCredentialsForm.newPassword;
      }

      onUpdateUser(selectedUser.username, systemUpdates);
    }

    const changeMessage = roleCredentialsForm.newPassword 
      ? `Rol y credenciales de ${selectedUser.name} actualizados exitosamente`
      : `Rol de ${selectedUser.name} actualizado exitosamente`;
    
    toast.success(changeMessage);
    
    // Cerrar modal y limpiar estado
    setShowRoleCredentialsModal(false);
    setSelectedUser(null);
    setRoleCredentialsForm({
      newRoleLevel: '',
      newRole: '',
      newPassword: '',
      confirmNewPassword: '',
      reason: ''
    });
  };

  // Función auxiliar para obtener título de rol por defecto
  const getRoleTitle = (roleLevel: 'administrador' | 'manager' | 'analista') => {
    switch (roleLevel) {
      case 'administrador':
        return 'Administrador del Sistema';
      case 'manager':
        return 'Supervisor/Manager';
      case 'analista':
        return 'Analista de Solicitudes';
      default:
        return 'Usuario del Sistema';
    }
  };

  if (!currentUser?.permissions.canCreateUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No tiene permisos suficientes para acceder a la gestión de usuarios.
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
          <h2 className="text-3xl font-bold tracking-tight text-dr-dark-gray">Gestión de Usuarios</h2>
          <p className="text-gray-600">Administración de usuarios del sistema SIUBEN</p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="bg-dr-blue hover:bg-dr-blue-dark text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-dr-dark-gray">Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Complete los datos para crear un nuevo usuario del sistema SIUBEN
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Nombre de usuario"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="usuario@siuben.gob.do"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roleLevel">Nivel de Rol *</Label>
                <Select value={newUser.roleLevel} onValueChange={(value: 'administrador' | 'manager' | 'analista') => setNewUser({...newUser, roleLevel: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="manager">Manager/Supervisor</SelectItem>
                    <SelectItem value="analista">Analista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Título del Cargo</Label>
                <Input
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  placeholder="Ej: Analista de Solicitudes"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  placeholder="Ej: Evaluación"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Select value={newUser.province} onValueChange={(value) => setNewUser({...newUser, province: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Distrito Nacional">Distrito Nacional</SelectItem>
                    <SelectItem value="Santo Domingo">Santo Domingo</SelectItem>
                    <SelectItem value="Santiago">Santiago</SelectItem>
                    <SelectItem value="La Vega">La Vega</SelectItem>
                    <SelectItem value="San Cristóbal">San Cristóbal</SelectItem>
                    <SelectItem value="Azua">Azua</SelectItem>
                    <SelectItem value="Barahona">Barahona</SelectItem>
                    <SelectItem value="La Romana">La Romana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Contraseña temporal"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  placeholder="Confirmar contraseña"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} className="bg-dr-blue hover:bg-dr-blue-dark text-white">
                Crear Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para Cambiar Rol y Credenciales */}
        <Dialog open={showRoleCredentialsModal} onOpenChange={setShowRoleCredentialsModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-dr-dark-gray flex items-center gap-2">
                <Key className="h-5 w-5 text-dr-blue" />
                Cambiar Rol y Credenciales
              </DialogTitle>
              <DialogDescription>
                Modificar el nivel de acceso y credenciales de {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                {/* Información del Usuario Actual */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-dr-dark-gray mb-2">Información Actual:</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Usuario:</span> {selectedUser.name} (@{selectedUser.username})</p>
                    <p><span className="font-medium">Rol Actual:</span> {getRoleBadge(selectedUser.roleLevel)}</p>
                    <p><span className="font-medium">Departamento:</span> {selectedUser.department}</p>
                  </div>
                </div>

                {/* Nuevo Nivel de Rol */}
                <div className="space-y-2">
                  <Label htmlFor="newRoleLevel">Nuevo Nivel de Rol *</Label>
                  <Select 
                    value={roleCredentialsForm.newRoleLevel} 
                    onValueChange={(value: 'administrador' | 'manager' | 'analista') => 
                      setRoleCredentialsForm({...roleCredentialsForm, newRoleLevel: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nuevo nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrador">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Manager/Supervisor
                        </div>
                      </SelectItem>
                      <SelectItem value="analista">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Analista
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Título del Cargo (opcional) */}
                <div className="space-y-2">
                  <Label htmlFor="newRole">Título del Cargo</Label>
                  <Input
                    id="newRole"
                    value={roleCredentialsForm.newRole}
                    onChange={(e) => setRoleCredentialsForm({...roleCredentialsForm, newRole: e.target.value})}
                    placeholder={getRoleTitle(roleCredentialsForm.newRoleLevel as any) || "Ej: Supervisor Regional"}
                  />
                </div>

                {/* Cambiar Contraseña (opcional) */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium text-dr-dark-gray">Cambiar Contraseña (Opcional)</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={roleCredentialsForm.newPassword}
                      onChange={(e) => setRoleCredentialsForm({...roleCredentialsForm, newPassword: e.target.value})}
                      placeholder="Dejar vacío para mantener actual"
                    />
                  </div>
                  
                  {roleCredentialsForm.newPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={roleCredentialsForm.confirmNewPassword}
                        onChange={(e) => setRoleCredentialsForm({...roleCredentialsForm, confirmNewPassword: e.target.value})}
                        placeholder="Confirmar contraseña"
                      />
                    </div>
                  )}
                </div>

                {/* Razón del Cambio */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Razón del Cambio *</Label>
                  <Textarea
                    id="reason"
                    value={roleCredentialsForm.reason}
                    onChange={(e) => setRoleCredentialsForm({...roleCredentialsForm, reason: e.target.value})}
                    placeholder="Explicar el motivo del cambio de rol y/o credenciales..."
                    rows={3}
                  />
                </div>

                {/* Información de Permisos */}
                {roleCredentialsForm.newRoleLevel && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-dr-blue mb-2">Permisos del Nuevo Rol:</h4>
                    <div className="text-sm space-y-1">
                      {roleCredentialsForm.newRoleLevel === 'administrador' && (
                        <>
                          <p>✅ Crear y gestionar usuarios</p>
                          <p>✅ Aprobar y revisar solicitudes</p>
                          <p>✅ Acceso a reportes completos</p>
                          <p>✅ Gestión de beneficiarios</p>
                        </>
                      )}
                      {roleCredentialsForm.newRoleLevel === 'manager' && (
                        <>
                          <p>❌ Crear usuarios</p>
                          <p>✅ Aprobar y revisar solicitudes</p>
                          <p>✅ Acceso a reportes operacionales</p>
                          <p>✅ Gestión de beneficiarios</p>
                        </>
                      )}
                      {roleCredentialsForm.newRoleLevel === 'analista' && (
                        <>
                          <p>❌ Crear usuarios</p>
                          <p>❌ Aprobar solicitudes</p>
                          <p>✅ Revisar solicitudes</p>
                          <p>❌ Acceso a reportes</p>
                          <p>❌ Gestión de beneficiarios</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowRoleCredentialsModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveRoleCredentials} 
                className="bg-dr-blue hover:bg-dr-blue-dark text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-dr-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dr-dark-gray">{users.length}</div>
            <p className="text-xs text-gray-600 mt-1">Usuarios registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dr-dark-gray">
              {users.filter(u => u.status === 'active').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Conectados recientemente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-dr-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dr-dark-gray">
              {users.filter(u => u.roleLevel === 'administrador').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Acceso completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dr-dark-gray">
              {users.filter(u => u.status === 'suspended').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar usuarios..." 
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
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
              <SelectItem value="suspended">Suspendidos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px] border-gray-300">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Roles</SelectItem>
              <SelectItem value="administrador">Administrador</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="analista">Analista</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-dr-dark-gray">ID</TableHead>
                  <TableHead className="text-dr-dark-gray min-w-[200px]">Usuario</TableHead>
                  <TableHead className="text-dr-dark-gray hidden sm:table-cell">Rol</TableHead>
                  <TableHead className="text-dr-dark-gray hidden md:table-cell">Departamento</TableHead>
                  <TableHead className="text-dr-dark-gray hidden lg:table-cell">Provincia</TableHead>
                  <TableHead className="text-dr-dark-gray">Estado</TableHead>
                  <TableHead className="text-dr-dark-gray hidden lg:table-cell">Último Acceso</TableHead>
                  <TableHead className="w-[160px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isCurrentUser = currentUser?.username === user.username;
                  return (
                    <TableRow 
                      key={user.id} 
                      className={isCurrentUser ? "bg-blue-50/50 border-l-4 border-dr-blue" : ""}
                    >
                      <TableCell className="font-medium text-dr-blue">{user.id}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-dr-dark-gray">{user.name}</p>
                            {isCurrentUser && (
                              <Badge variant="outline" className="bg-dr-blue text-white border-dr-blue text-xs">
                                Usted
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          <p className="text-sm text-gray-500 md:hidden">{user.department}</p>
                        </div>
                      </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getRoleBadge(user.roleLevel)}
                    </TableCell>
                    <TableCell className="text-dr-dark-gray hidden md:table-cell">{user.department}</TableCell>
                    <TableCell className="text-dr-dark-gray hidden lg:table-cell">{user.province}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-dr-dark-gray hidden lg:table-cell text-sm">
                      {user.lastLogin}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* Botón VER (solo lectura) */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewUser(user)}
                          title="Ver detalles"
                          className="text-dr-blue hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Botón EDITAR (modificar información) */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title="Editar información"
                          className="text-green-600 hover:bg-green-50"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        {/* Botón CAMBIAR ROL/CREDENCIALES */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleChangeRoleCredentials(user)}
                          title={currentUser?.username === user.username ? "No puede cambiar su propio rol" : "Cambiar rol y credenciales"}
                          className={`
                            ${currentUser?.username === user.username 
                              ? "text-gray-400 cursor-not-allowed" 
                              : "text-purple-600 hover:bg-purple-50"
                            }
                          `}
                          disabled={currentUser?.username === user.username}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        
                        {/* Botón SUSPENDER/ACTIVAR */}
                        {user.status === 'active' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openSuspendDialog(user)}
                            title={currentUser?.username === user.username ? "No puede suspenderse a sí mismo" : "Suspender usuario"}
                            className={`
                              ${currentUser?.username === user.username 
                                ? "text-gray-400 cursor-not-allowed" 
                                : "text-red-600 hover:text-red-700 hover:bg-red-50"
                              }
                            `}
                            disabled={currentUser?.username === user.username}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : user.status === 'suspended' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openActivateDialog(user)}
                            title="Activar usuario"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Usuario inactivo"
                            disabled
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal VER USUARIO (Solo lectura) */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dr-dark-gray flex items-center gap-2">
              <Eye className="h-5 w-5 text-dr-blue" />
              Ver Detalles del Usuario
            </DialogTitle>
            <DialogDescription>
              Información completa del usuario {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info - Solo lectura */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">ID de Usuario</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-dr-dark-gray font-medium">{selectedUser.id}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Nombre de Usuario</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-dr-dark-gray font-medium">@{selectedUser.username}</p>
                  </div>
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium text-gray-600">Nombre Completo</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-dr-dark-gray font-medium">{selectedUser.name}</p>
                  </div>
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium text-gray-600">Correo Electrónico</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-dr-dark-gray font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Cargo</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-dr-dark-gray font-medium">{selectedUser.role}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Nivel de Rol</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    {getRoleBadge(selectedUser.roleLevel)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Estado</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Departamento</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-dr-dark-gray font-medium">{selectedUser.department}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Provincia</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-dr-dark-gray font-medium">{selectedUser.province}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Último Acceso</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-dr-dark-gray font-medium">{selectedUser.lastLogin}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Fecha de Creación</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-dr-dark-gray font-medium">{selectedUser.createdDate}</p>
                  </div>
                </div>
              </div>
              
              {/* Footer info */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>Usuario creado el {selectedUser.createdDate}</p>
                  <p>Último acceso: {selectedUser.lastLogin}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal EDITAR USUARIO (Campos editables) */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dr-dark-gray flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-green-600" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>
              Modificar información del usuario {editingUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-6">
              {/* Campos editables */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-name">Nombre Completo *</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    placeholder="Nombre completo"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-email">Correo Electrónico *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    placeholder="usuario@siuben.gob.do"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-role">Título del Cargo</Label>
                  <Input
                    id="edit-role"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    placeholder="Ej: Analista de Solicitudes"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Departamento</Label>
                  <Input
                    id="edit-department"
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                    placeholder="Ej: Evaluación"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-province">Provincia</Label>
                  <Select 
                    value={editingUser.province} 
                    onValueChange={(value) => setEditingUser({...editingUser, province: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Distrito Nacional">Distrito Nacional</SelectItem>
                      <SelectItem value="Santo Domingo">Santo Domingo</SelectItem>
                      <SelectItem value="Santiago">Santiago</SelectItem>
                      <SelectItem value="La Vega">La Vega</SelectItem>
                      <SelectItem value="San Cristóbal">San Cristóbal</SelectItem>
                      <SelectItem value="Azua">Azua</SelectItem>
                      <SelectItem value="Barahona">Barahona</SelectItem>
                      <SelectItem value="La Romana">La Romana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Campos no editables (solo lectura) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">ID de Usuario</Label>
                  <div className="p-2 bg-gray-100 rounded-md">
                    <p className="text-gray-700">{editingUser.id}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Nombre de Usuario</Label>
                  <div className="p-2 bg-gray-100 rounded-md">
                    <p className="text-gray-700">@{editingUser.username}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Nivel de Rol</Label>
                  <div className="p-2 bg-gray-100 rounded-md">
                    {getRoleBadge(editingUser.roleLevel)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Estado</Label>
                  <div className="p-2 bg-gray-100 rounded-md">
                    {getStatusBadge(editingUser.status)}
                  </div>
                </div>
              </div>
              
              {/* Información adicional */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-dr-blue">
                <div className="text-sm text-dr-dark-gray">
                  <p><strong>Fecha de creación:</strong> {editingUser.createdDate}</p>
                  <p><strong>Último acceso:</strong> {editingUser.lastLogin}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditModal(false);
              setEditingUser(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEditUser} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dr-dark-gray">
              Suspender Usuario
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea suspender al usuario <strong>{selectedUser?.name}</strong>?
              Esta acción impedirá que el usuario acceda al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="suspend-reason">Razón de la suspensión *</Label>
            <Textarea
              id="suspend-reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Describa la razón de la suspensión..."
              rows={3}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowSuspendDialog(false);
              setSelectedUser(null);
              setSuspendReason('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspendUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Suspender Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate User Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dr-dark-gray">
              Activar Usuario
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea activar al usuario <strong>{selectedUser?.name}</strong>?
              Esta acción permitirá que el usuario acceda nuevamente al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowActivateDialog(false);
              setSelectedUser(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActivateUser}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Activar Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}