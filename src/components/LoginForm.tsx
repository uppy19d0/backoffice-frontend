import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import governmentLogo from '../assets/Logo-Siuben.png';

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
  isLoading?: boolean;
}

export function LoginForm({ onLogin, error, isLoading }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-dr-light-gray flex flex-col">
      {/* Government Header */}
      <div className="government-header py-8 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <img 
                src={governmentLogo} 
                alt="Gobierno de la República Dominicana - Sistema Único de Beneficiarios" 
                className="h-20 w-auto max-w-sm"
              />
            </div>
            <div className="text-center">
              <p className="text-blue-200 text-lg font-medium">
                Panel Administrativo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 bg-dr-blue rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-dr-dark-gray text-2xl">
                Acceso al Sistema
              </CardTitle>
              <CardDescription className="text-gray-600">
                Ingrese sus credenciales para acceder al panel administrativo
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-amber-300 bg-amber-50">
                  <AlertDescription className="text-amber-800">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-dr-dark-gray font-medium">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-dr-blue focus:ring-dr-blue"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-dr-dark-gray font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-gray-300 focus:border-dr-blue focus:ring-dr-blue"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-dr-blue hover:bg-dr-blue-dark text-white font-medium py-2"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-dr-light-gray rounded-lg space-y-3">
              <p className="text-sm text-dr-dark-gray text-center font-medium">
                Credenciales de demostración:
              </p>
              
              {/* Administrador */}
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium">ADMINISTRADOR</p>
                <p className="text-sm text-gray-600">
                  Usuario: <span className="font-mono text-dr-blue">admin</span> | 
                  Contraseña: <span className="font-mono text-dr-blue">admin123</span>
                </p>
              </div>
              
              {/* Manager */}
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium">GERENTE/SUPERVISOR</p>
                <p className="text-sm text-gray-600">
                  Usuario: <span className="font-mono text-dr-blue">manager</span> | 
                  Contraseña: <span className="font-mono text-dr-blue">manager123</span>
                </p>
              </div>
              
              {/* Analista */}
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium">ANALISTA</p>
                <p className="text-sm text-gray-600">
                  Usuario: <span className="font-mono text-dr-blue">analista</span> | 
                  Contraseña: <span className="font-mono text-dr-blue">analista123</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t py-4 px-6">
        <div className="container mx-auto text-center">
          <p className="text-sm text-gray-600">
            © 2025 Gobierno de la República Dominicana - SIUBEN
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Sistema seguro protegido por medidas de seguridad gubernamentales
          </p>
        </div>
      </div>
    </div>
  );
}