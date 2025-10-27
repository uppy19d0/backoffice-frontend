import React, { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  Save,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from './ui/utils';

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

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onPasswordChange: (payload: {
    username: string;
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onValidateCurrentPassword?: (username: string, currentPassword: string) => Promise<boolean>;
  forceChange?: boolean;
}

export function ChangePasswordModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onPasswordChange,
  onValidateCurrentPassword,
  forceChange = false,
}: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Resetear el formulario cuando se abre/cierra el modal
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors([]);
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  const validateForm = (data = formData): string[] => {
    const validationErrors: string[] = [];

    // Validar contraseña actual
    if (!data.currentPassword.trim()) {
      validationErrors.push('La contraseña actual es requerida');
    }

    // Validar nueva contraseña
    if (!data.newPassword.trim()) {
      validationErrors.push('La nueva contraseña es requerida');
    } else {
      if (data.newPassword.length < 6) {
        validationErrors.push('La nueva contraseña debe tener al menos 6 caracteres');
      }
      if (data.newPassword === data.currentPassword) {
        validationErrors.push('La nueva contraseña debe ser diferente a la actual');
      }
    }

    // Validar confirmación
    if (!data.confirmPassword.trim()) {
      validationErrors.push('La confirmación de contraseña es requerida');
    } else if (data.newPassword !== data.confirmPassword) {
      validationErrors.push('Las contraseñas no coinciden');
    }

    return validationErrors;
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Verificar contraseña actual primero (simulando validación)
      // En un sistema real, esto verificaría la contraseña contra la base de datos
      const isCurrentPasswordValid = onValidateCurrentPassword 
        ? await onValidateCurrentPassword(currentUser.username, formData.currentPassword)
        : true; // Si no hay función de validación, asumir que es válida

      if (!isCurrentPasswordValid) {
        setErrors(['La contraseña actual es incorrecta']);
        setIsLoading(false);
        return;
      }

      // Actualizar la contraseña
      const result = await onPasswordChange({
        username: currentUser.username,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (result.success) {
        toast.success('Contraseña actualizada exitosamente');
        setHasAttemptedSubmit(false);
        setErrors([]);
        onClose();
      } else {
        setErrors([result.error ?? 'Error al actualizar la contraseña. Inténtelo nuevamente.']);
      }
    } catch (error) {
      setErrors(['Error al actualizar la contraseña. Inténtelo nuevamente.']);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleFieldChange = (
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  React.useEffect(() => {
    if (!hasAttemptedSubmit) {
      return;
    }
    const nextErrors = validateForm();
    setErrors((prevErrors) => {
      if (
        prevErrors.length === nextErrors.length &&
        prevErrors.every((error, index) => error === nextErrors[index])
      ) {
        return prevErrors;
      }
      return nextErrors;
    });
  }, [formData, hasAttemptedSubmit]);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Débil', color: 'text-red-600' };
    if (password.length < 8) return { strength: 2, label: 'Regular', color: 'text-yellow-600' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: 'Fuerte', color: 'text-green-600' };
    }
    return { strength: 2, label: 'Regular', color: 'text-yellow-600' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        if (!forceChange) {
          onClose();
        }
        return;
      }
    },
    [forceChange, onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className={cn(
          'w-[min(100vw-1.5rem,420px)] max-w-lg p-0 overflow-hidden rounded-xl',
          'flex flex-col max-h-[90vh]',
          'sm:w-full',
        )}
      >
        <DialogHeader className="space-y-1.5 px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 flex-shrink-0">
          <DialogTitle className="text-dr-dark-gray flex items-center gap-2 text-lg sm:text-xl">
            <Key className="h-5 w-5 text-dr-blue" />
            Cambiar Contraseña
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 sm:text-base">
            {forceChange ? (
              <>
                Por seguridad, debes actualizar tu contraseña personal antes de continuar.
              </>
            ) : (
              <>
                Actualice su contraseña personal para <strong>{currentUser.name}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6 overflow-y-auto flex-1">
          {forceChange && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Has iniciado sesión con una contraseña temporal. Debes crear una nueva contraseña para acceder al sistema.
              </AlertDescription>
            </Alert>
          )}

          {/* Información del Usuario */}
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-dr-blue">
            <div className="text-sm">
              <p><span className="font-medium">Usuario:</span> @{currentUser.username}</p>
              <p><span className="font-medium">Rol:</span> {currentUser.role}</p>
            </div>
          </div>

          {/* Errores de validación */}
          {errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <Shield className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Contraseña Actual */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={handleFieldChange('currentPassword')}
                placeholder="Ingrese su contraseña actual"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleFieldChange('newPassword')}
                placeholder="Ingrese su nueva contraseña"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>

            {/* Indicador de fortaleza de contraseña */}
            {formData.newPassword && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.strength === 1 ? 'w-1/3 bg-red-500' :
                        passwordStrength.strength === 2 ? 'w-2/3 bg-yellow-500' :
                        passwordStrength.strength === 3 ? 'w-full bg-green-500' : 'w-0'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Recomendaciones:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li className={formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      Al menos 8 caracteres
                    </li>
                    <li className={/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                      Una letra mayúscula
                    </li>
                    <li className={/[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                      Un número
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleFieldChange('confirmPassword')}
                placeholder="Confirme su nueva contraseña"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Las contraseñas no coinciden
              </p>
            )}
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0 && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Las contraseñas coinciden
              </p>
            )}
          </div>

          {/* Información de Seguridad */}
          <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Recomendaciones de Seguridad:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Use una contraseña única para este sistema</li>
                  <li>No comparta su contraseña con otras personas</li>
                  <li>Cambie su contraseña periódicamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 border-t border-gray-100 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 flex-shrink-0">
          {!forceChange && (
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || errors.length > 0}
            className="bg-dr-blue hover:bg-dr-blue-dark text-white"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Actualizando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Actualizar Contraseña
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
