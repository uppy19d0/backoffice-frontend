import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { UserPlus, UserMinus, Calendar, IdCard, User, AlertTriangle } from 'lucide-react';

interface HouseholdMember {
  id: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  relationship: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (member: Omit<HouseholdMember, 'id'>) => void;
}

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberId: string, reason: string) => void;
  members: HouseholdMember[];
}

// Add Member Modal
export function AddMemberModal({ isOpen, onClose, onSubmit }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    dateOfBirth: '',
    relationship: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const relationships = [
    { value: 'spouse', label: 'Cónyuge' },
    { value: 'child', label: 'Hijo/a' },
    { value: 'parent', label: 'Padre/Madre' },
    { value: 'sibling', label: 'Hermano/a' },
    { value: 'grandparent', label: 'Abuelo/a' },
    { value: 'grandchild', label: 'Nieto/a' },
    { value: 'other', label: 'Otro familiar' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'El número de cédula es requerido';
    } else if (!/^\d{3}-\d{7}-\d{1}$/.test(formData.idNumber)) {
      newErrors.idNumber = 'Formato de cédula inválido (ejemplo: 001-1234567-8)';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'La fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age > 120) {
        newErrors.dateOfBirth = 'La fecha de nacimiento no puede ser mayor a 120 años';
      } else if (birthDate > today) {
        newErrors.dateOfBirth = 'La fecha de nacimiento no puede ser futura';
      }
    }

    if (!formData.relationship) {
      newErrors.relationship = 'El parentesco es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onSubmit(formData);
    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        fullName: '',
        idNumber: '',
        dateOfBirth: '',
        relationship: ''
      });
      setErrors({});
      onClose();
    }
  };

  const formatIdNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XXXXXXX-X
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10, 11)}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-dr-dark-gray text-xl font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-dr-blue" />
            Agregar Miembro del Hogar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label className="text-dr-dark-gray font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Nombre Completo
            </Label>
            <Input
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Ingrese el nombre completo"
              className={`border-gray-300 ${errors.fullName ? 'border-dr-red' : ''}`}
            />
            {errors.fullName && (
              <p className="text-sm text-dr-red">{errors.fullName}</p>
            )}
          </div>

          {/* ID Number */}
          <div className="space-y-2">
            <Label className="text-dr-dark-gray font-medium flex items-center gap-2">
              <IdCard className="h-4 w-4" />
              Número de Cédula
            </Label>
            <Input
              value={formData.idNumber}
              onChange={(e) => handleInputChange('idNumber', formatIdNumber(e.target.value))}
              placeholder="001-1234567-8"
              maxLength={13}
              className={`border-gray-300 ${errors.idNumber ? 'border-dr-red' : ''}`}
            />
            {errors.idNumber && (
              <p className="text-sm text-dr-red">{errors.idNumber}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label className="text-dr-dark-gray font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha de Nacimiento
            </Label>
            <Input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className={`border-gray-300 ${errors.dateOfBirth ? 'border-dr-red' : ''}`}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-dr-red">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label className="text-dr-dark-gray font-medium">Parentesco</Label>
            <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
              <SelectTrigger className={`border-gray-300 ${errors.relationship ? 'border-dr-red' : ''}`}>
                <SelectValue placeholder="Seleccione el parentesco" />
              </SelectTrigger>
              <SelectContent>
                {relationships.map(rel => (
                  <SelectItem key={rel.value} value={rel.value}>
                    {rel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.relationship && (
              <p className="text-sm text-dr-red">{errors.relationship}</p>
            )}
          </div>

          {/* Information Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Asegúrese de que toda la información sea correcta. Los cambios en la composición familiar 
              pueden afectar la elegibilidad para programas sociales.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-dr-blue hover:bg-dr-blue-dark text-white"
          >
            {isSubmitting ? 'Guardando...' : 'Agregar Miembro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Remove Member Modal
export function RemoveMemberModal({ isOpen, onClose, onSubmit, members }: RemoveMemberModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedMemberId) {
      newErrors.selectedMemberId = 'Debe seleccionar un miembro para remover';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Debe proporcionar una razón para la remoción';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'La razón debe tener al menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onSubmit(selectedMemberId, reason);
    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedMemberId('');
      setReason('');
      setErrors({});
      onClose();
    }
  };

  const selectedMember = members.find(member => member.id === selectedMemberId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-dr-dark-gray text-xl font-semibold flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-dr-red" />
            Remover Miembro del Hogar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label className="text-dr-dark-gray font-medium">Seleccionar Miembro</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className={`border-gray-300 ${errors.selectedMemberId ? 'border-dr-red' : ''}`}>
                <SelectValue placeholder="Seleccione el miembro a remover" />
              </SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{member.fullName}</span>
                      <span className="text-sm text-gray-600">{member.idNumber}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.selectedMemberId && (
              <p className="text-sm text-dr-red">{errors.selectedMemberId}</p>
            )}
          </div>

          {/* Member Details */}
          {selectedMember && (
            <div className="bg-dr-light-gray p-4 rounded-lg">
              <h4 className="font-medium text-dr-dark-gray mb-2">Detalles del Miembro</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nombre:</span> {selectedMember.fullName}</p>
                <p><span className="font-medium">Cédula:</span> {selectedMember.idNumber}</p>
                <p><span className="font-medium">Fecha de Nacimiento:</span> {selectedMember.dateOfBirth}</p>
                <p><span className="font-medium">Parentesco:</span> {selectedMember.relationship}</p>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-dr-dark-gray font-medium">Razón para la Remoción</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique la razón para remover este miembro del hogar (ejemplo: fallecimiento, mudanza, etc.)"
              className={`border-gray-300 min-h-[100px] ${errors.reason ? 'border-dr-red' : ''}`}
            />
            {errors.reason && (
              <p className="text-sm text-dr-red">{errors.reason}</p>
            )}
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive" className="border-dr-red bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-dr-red">
              <strong>Advertencia:</strong> La remoción de un miembro del hogar es una acción permanente 
              que puede afectar la elegibilidad para programas sociales. Asegúrese de que esta acción sea correcta.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-dr-red hover:bg-dr-red-dark text-white"
          >
            {isSubmitting ? 'Removiendo...' : 'Remover Miembro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}