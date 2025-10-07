import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  MapPin, 
  Navigation, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Map,
  Search
} from 'lucide-react';

interface AddressChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (addressData: AddressData) => void;
  currentAddress?: string;
}

interface AddressData {
  address: string;
  latitude: number;
  longitude: number;
  dataQuality: 'high' | 'medium' | 'low';
  locationMethod: 'manual' | 'gps' | 'autocomplete';
}

interface LocationSuggestion {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
}

export function AddressChangeModal({ isOpen, onClose, onSubmit, currentAddress = '' }: AddressChangeModalProps) {
  const [address, setAddress] = useState(currentAddress);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [dataQuality, setDataQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [locationMethod, setLocationMethod] = useState<'manual' | 'gps' | 'autocomplete'>('manual');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock address suggestions for Dominican Republic
  const mockSuggestions: LocationSuggestion[] = [
    {
      id: '1',
      address: 'Av. 27 de Febrero, Santo Domingo, Distrito Nacional',
      latitude: 18.4861,
      longitude: -69.9312
    },
    {
      id: '2',
      address: 'Calle El Conde, Ciudad Colonial, Santo Domingo',
      latitude: 18.4734,
      longitude: -69.8845
    },
    {
      id: '3',
      address: 'Av. Winston Churchill, Piantini, Santo Domingo',
      latitude: 18.4747,
      longitude: -69.9342
    },
    {
      id: '4',
      address: 'Calle José Reyes, Santiago de los Caballeros',
      latitude: 19.4517,
      longitude: -70.6970
    }
  ];

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setError('');
    
    // Show suggestions when typing
    if (value.length > 3) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.address.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    setAddress(suggestion.address);
    setCoordinates({ lat: suggestion.latitude, lng: suggestion.longitude });
    setLocationMethod('autocomplete');
    setDataQuality('high');
    setShowSuggestions(false);
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('La geolocalización no está soportada en este navegador');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setLocationMethod('gps');
        setDataQuality('high');
        setIsLoadingLocation(false);
        
        // Mock reverse geocoding
        setAddress(`Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      (error) => {
        setError('No se pudo obtener la ubicación actual. Por favor, verifique los permisos.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setLocationMethod('manual');
    setDataQuality('medium');
    setError('');
  };

  const getQualityBadge = (quality: 'high' | 'medium' | 'low') => {
    const configs = {
      high: { label: 'Alta Precisión', className: 'bg-green-100 text-green-800 border-green-200' },
      medium: { label: 'Precisión Media', className: 'bg-amber-100 text-amber-800 border-amber-200' },
      low: { label: 'Baja Precisión', className: 'bg-red-100 text-red-800 border-red-200' }
    };
    
    return (
      <Badge className={configs[quality].className}>
        {configs[quality].label}
      </Badge>
    );
  };

  const validateForm = () => {
    if (!address.trim()) {
      setError('La dirección es requerida');
      return false;
    }

    if (!coordinates) {
      setError('Por favor, seleccione una ubicación en el mapa o use la geolocalización');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const addressData: AddressData = {
      address: address.trim(),
      latitude: coordinates!.lat,
      longitude: coordinates!.lng,
      dataQuality,
      locationMethod
    };

    onSubmit(addressData);
    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAddress(currentAddress);
      setCoordinates(null);
      setError('');
      setShowSuggestions(false);
      onClose();
    }
  };

  // Mock interactive map component
  const MockMap = () => (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
      <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 relative">
        {/* Mock map interface */}
        <div className="absolute inset-0 bg-opacity-10 bg-black">
          <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md">
            <div className="flex items-center gap-2 text-xs">
              <Map className="h-4 w-4 text-dr-blue" />
              <span className="text-dr-dark-gray">Mapa Interactivo</span>
            </div>
          </div>
          
          {/* Mock streets */}
          <div className="absolute top-20 left-8 right-8 h-1 bg-gray-400 opacity-60"></div>
          <div className="absolute top-32 left-16 right-4 h-1 bg-gray-400 opacity-60"></div>
          <div className="absolute top-44 left-4 right-12 h-1 bg-gray-400 opacity-60"></div>
          
          {/* Coordinates display */}
          {coordinates && (
            <div className="absolute top-4 right-4 bg-white rounded-lg p-3 shadow-md">
              <div className="text-xs text-dr-dark-gray">
                <div className="font-medium mb-1">Coordenadas</div>
                <div>Lat: {coordinates.lat.toFixed(6)}</div>
                <div>Lng: {coordinates.lng.toFixed(6)}</div>
              </div>
            </div>
          )}
          
          {/* Location pin */}
          {coordinates && (
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: `${50 + (coordinates.lng * 2)}%`, 
                top: `${50 - (coordinates.lat * 2)}%` 
              }}
            >
              <MapPin className="h-8 w-8 text-dr-red drop-shadow-lg" />
            </div>
          )}
          
          {/* Click area */}
          <div 
            className="absolute inset-0 cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              
              // Mock coordinate calculation
              const lat = 18.4861 + (0.5 - y / rect.height) * 0.1;
              const lng = -69.9312 + (x / rect.width - 0.5) * 0.1;
              
              handleMapClick(lat, lng);
            }}
          />
        </div>
      </div>
      
      {/* Map controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="bg-white shadow-md border-gray-300"
        >
          {isLoadingLocation ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dr-dark-gray text-xl font-semibold flex items-center gap-2">
            <Navigation className="h-5 w-5 text-dr-blue" />
            Actualizar Dirección
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Address Input with Autocomplete */}
          <div className="space-y-2 relative">
            <Label className="text-dr-dark-gray font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Dirección
            </Label>
            <Input
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Ingrese la nueva dirección..."
              className="border-gray-300"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-10">
                {suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className="p-3 hover:bg-dr-light-gray cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-dr-dark-gray">{suggestion.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Map */}
          <div className="space-y-2">
            <Label className="text-dr-dark-gray font-medium">
              Ubicación en el Mapa
            </Label>
            <MockMap />
            <p className="text-sm text-gray-600">
              Haga clic en el mapa para colocar un marcador manualmente o use el botón de geolocalización.
            </p>
          </div>

          {/* Location Information */}
          {coordinates && (
            <div className="bg-dr-light-gray p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-dr-dark-gray">Información de Ubicación</h4>
                {getQualityBadge(dataQuality)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Latitud:</span>
                  <p className="font-mono text-dr-dark-gray">{coordinates.lat.toFixed(6)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Longitud:</span>
                  <p className="font-mono text-dr-dark-gray">{coordinates.lng.toFixed(6)}</p>
                </div>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600">Método de ubicación:</span>
                <p className="text-dr-dark-gray">
                  {locationMethod === 'gps' && 'GPS / Geolocalización'}
                  {locationMethod === 'manual' && 'Selección manual en mapa'}
                  {locationMethod === 'autocomplete' && 'Búsqueda de dirección'}
                </p>
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

          {/* Information Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              El cambio de dirección puede afectar la elegibilidad para ciertos programas sociales. 
              Asegúrese de que la ubicación sea precisa.
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
            disabled={isSubmitting || !coordinates}
            className="bg-dr-blue hover:bg-dr-blue-dark text-white"
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar Ubicación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}