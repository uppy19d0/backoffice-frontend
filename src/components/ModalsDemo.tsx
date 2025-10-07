import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { DocumentUploadModal } from './DocumentUploadModal';
import { AddMemberModal, RemoveMemberModal } from './HouseholdMemberModals';
import { AddressChangeModal } from './AddressChangeModal';
import { 
  Upload, 
  UserPlus, 
  UserMinus, 
  MapPin, 
  FileText, 
  Users, 
  Navigation,
  CheckCircle
} from 'lucide-react';

interface HouseholdMember {
  id: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  relationship: string;
}

export function ModalsDemo() {
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [removeMemberModalOpen, setRemoveMemberModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState('');

  // Mock household members data
  const [householdMembers] = useState<HouseholdMember[]>([
    {
      id: '1',
      fullName: 'María Esperanza González',
      idNumber: '001-1234567-8',
      dateOfBirth: '1985-03-15',
      relationship: 'Cónyuge'
    },
    {
      id: '2',
      fullName: 'Carlos Miguel Rodríguez',
      idNumber: '001-2345678-9',
      dateOfBirth: '2010-07-22',
      relationship: 'Hijo'
    },
    {
      id: '3',
      fullName: 'Ana Lucía Rodríguez',
      idNumber: '001-3456789-0',
      dateOfBirth: '2015-11-08',
      relationship: 'Hija'
    }
  ]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleDocumentUpload = (files: any[], metadata: any) => {
    console.log('Documents uploaded:', files, metadata);
    showSuccess(`Se han subido ${files.length} documento(s) exitosamente`);
    setDocumentModalOpen(false);
  };

  const handleAddMember = (member: Omit<HouseholdMember, 'id'>) => {
    console.log('Member added:', member);
    showSuccess(`Se ha agregado a ${member.fullName} al hogar`);
    setAddMemberModalOpen(false);
  };

  const handleRemoveMember = (memberId: string, reason: string) => {
    const member = householdMembers.find(m => m.id === memberId);
    console.log('Member removed:', member, 'Reason:', reason);
    showSuccess(`Se ha removido a ${member?.fullName} del hogar`);
    setRemoveMemberModalOpen(false);
  };

  const handleAddressChange = (addressData: any) => {
    console.log('Address changed:', addressData);
    showSuccess('La dirección ha sido actualizada exitosamente');
    setAddressModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-dr-dark-gray">
          Modales del Sistema SIUBEN
        </h2>
        <p className="text-gray-600">
          Demostración de los componentes modales para gestión de beneficiarios
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Demo Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Document Upload Modal */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-dr-dark-gray flex items-center gap-2">
              <FileText className="h-5 w-5 text-dr-blue" />
              Subir Documentos
            </CardTitle>
            <CardDescription>
              Modal para cargar documentos con vista previa, validación y seguimiento de progreso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Funcionalidades:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Selección múltiple de archivos</li>
                  <li>Vista previa de imágenes</li>
                  <li>Validación de tipos y tamaños</li>
                  <li>Barra de progreso de subida</li>
                  <li>Metadatos automáticos</li>
                </ul>
              </div>
              <Button 
                onClick={() => setDocumentModalOpen(true)}
                className="w-full bg-dr-blue hover:bg-dr-blue-dark text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Abrir Modal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Member Modal */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-dr-dark-gray flex items-center gap-2">
              <Users className="h-5 w-5 text-dr-blue" />
              Gestión de Miembros
            </CardTitle>
            <CardDescription>
              Modales para agregar y remover miembros del hogar con validación completa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Funcionalidades:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Validación de cédula dominicana</li>
                  <li>Formateo automático de campos</li>
                  <li>Validación de fechas</li>
                  <li>Selección de parentesco</li>
                  <li>Confirmación de acciones</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => setAddMemberModalOpen(true)}
                  variant="outline"
                  className="border-dr-blue text-dr-blue hover:bg-blue-50"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
                <Button 
                  onClick={() => setRemoveMemberModalOpen(true)}
                  variant="outline"
                  className="border-dr-red text-dr-red hover:bg-red-50"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Change Modal */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-dr-dark-gray flex items-center gap-2">
              <Navigation className="h-5 w-5 text-dr-blue" />
              Cambio de Dirección
            </CardTitle>
            <CardDescription>
              Modal con mapa interactivo, geolocalización y autocompletado de direcciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Funcionalidades:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Mapa interactivo</li>
                  <li>Geolocalización GPS</li>
                  <li>Autocompletado de direcciones</li>
                  <li>Coordenadas precisas</li>
                  <li>Indicador de calidad de datos</li>
                </ul>
              </div>
              <Button 
                onClick={() => setAddressModalOpen(true)}
                className="w-full bg-dr-blue hover:bg-dr-blue-dark text-white"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Abrir Modal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Data Display */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-dr-dark-gray">Miembros del Hogar Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {householdMembers.map(member => (
                <div key={member.id} className="bg-dr-light-gray p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-dr-dark-gray">{member.fullName}</p>
                      <p className="text-sm text-gray-600">{member.idNumber}</p>
                      <p className="text-sm text-gray-600">{member.relationship}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-dr-dark-gray">Dirección Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-dr-light-gray p-3 rounded-lg">
                <p className="text-dr-dark-gray">
                  Av. 27 de Febrero #123, Santo Domingo, Distrito Nacional
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Coordenadas: 18.4861, -69.9312
                </p>
                <p className="text-sm text-gray-600">
                  Calidad: Alta precisión
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Components */}
      <DocumentUploadModal
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        onSubmit={handleDocumentUpload}
      />

      <AddMemberModal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        onSubmit={handleAddMember}
      />

      <RemoveMemberModal
        isOpen={removeMemberModalOpen}
        onClose={() => setRemoveMemberModalOpen(false)}
        onSubmit={handleRemoveMember}
        members={householdMembers}
      />

      <AddressChangeModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSubmit={handleAddressChange}
        currentAddress="Av. 27 de Febrero #123, Santo Domingo, Distrito Nacional"
      />
    </div>
  );
}