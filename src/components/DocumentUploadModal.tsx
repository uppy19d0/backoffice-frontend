import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  File
} from 'lucide-react';

interface DocumentFile {
  id: string;
  file: File;
  type: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  preview?: string;
}

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (files: DocumentFile[], metadata: any) => void;
}

const documentTypes = [
  { value: 'cedula', label: 'Cédula de Identidad' },
  { value: 'birth_certificate', label: 'Acta de Nacimiento' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'death_certificate', label: 'Acta de Defunción' },
  { value: 'marriage_certificate', label: 'Acta de Matrimonio' },
  { value: 'proof_of_income', label: 'Comprobante de Ingresos' },
  { value: 'utility_bill', label: 'Factura de Servicios' },
  { value: 'other', label: 'Otro Documento' }
];

export function DocumentUploadModal({ isOpen, onClose, onSubmit }: DocumentUploadModalProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];

    selectedFiles.forEach(file => {
      if (file.size > maxFileSize) {
        setError(`El archivo ${file.name} excede el tamaño máximo de 10MB`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setError(`El archivo ${file.name} no es un tipo válido. Solo se permiten imágenes (JPG, PNG, GIF) y PDF`);
        return;
      }

      const newFile: DocumentFile = {
        id: Date.now().toString() + Math.random(),
        file: file,
        type: selectedDocumentType,
        uploadProgress: 0,
        status: 'pending'
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === newFile.id ? { ...f, preview: e.target?.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      setFiles(prev => [...prev, newFile]);
    });

    setError('');
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          if (f.uploadProgress >= 100) {
            clearInterval(interval);
            return { ...f, status: 'completed' };
          }
          return { ...f, uploadProgress: f.uploadProgress + 10, status: 'uploading' };
        }
        return f;
      }));
    }, 200);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Por favor seleccione al menos un archivo');
      return;
    }

    if (!selectedDocumentType) {
      setError('Por favor seleccione el tipo de documento');
      return;
    }

    setIsUploading(true);
    setError('');

    // Simulate upload process
    files.forEach(file => {
      if (file.status === 'pending') {
        simulateUpload(file.id);
      }
    });

    // Wait for all uploads to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    const metadata = {
      documentType: selectedDocumentType,
      uploadTimestamp: new Date().toISOString(),
      uploadedBy: 'current-user-id'
    };

    onSubmit(files, metadata);
    setIsUploading(false);
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      setSelectedDocumentType('');
      setError('');
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-dr-red" />;
      case 'uploading':
        return <div className="h-4 w-4 border-2 border-dr-blue border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dr-dark-gray text-xl font-semibold">
            Subir Documentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label className="text-dr-dark-gray font-medium">Tipo de Documento</Label>
            <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Seleccione el tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-dr-blue hover:bg-blue-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-dr-dark-gray font-medium mb-2">
                Haga clic para seleccionar archivos
              </p>
              <p className="text-sm text-gray-600">
                Soporta: JPG, PNG, GIF, PDF (máximo 10MB por archivo)
              </p>
            </div>

            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Upload Timestamp */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-dr-light-gray p-3 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>Fecha de carga: {new Date().toLocaleString('es-DO')}</span>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Label className="text-dr-dark-gray font-medium">Archivos Seleccionados</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map(file => (
                  <div key={file.id} className="bg-dr-light-gray p-3 rounded-lg">
                    <div className="flex items-start gap-3">
                      {/* Preview */}
                      <div className="flex-shrink-0">
                        {file.preview ? (
                          <img 
                            src={file.preview} 
                            alt={file.file.name}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-white rounded border flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-dr-dark-gray truncate">
                              {file.file.name}
                            </p>
                            {getStatusIcon(file.status)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-gray-400 hover:text-dr-red"
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-600">
                            {formatFileSize(file.file.size)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {documentTypes.find(t => t.value === file.type)?.label || 'Sin tipo'}
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        {file.status === 'uploading' && (
                          <div className="mt-2">
                            <Progress value={file.uploadProgress} className="h-2" />
                            <p className="text-xs text-gray-600 mt-1">
                              Subiendo... {file.uploadProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="border-dr-red bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-dr-red">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="border-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 || !selectedDocumentType || isUploading}
            className="bg-dr-blue hover:bg-dr-blue-dark text-white"
          >
            {isUploading ? 'Subiendo...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}