import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import governmentLogo from '../assets/Logo-Siuben.png';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  error?: string;
  isLoading?: boolean;
}

export function LoginForm({ onLogin, error, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-dr-light-gray flex flex-col md:flex-row">
      {/* Brand / Hero */}
      <div className="relative w-full md:w-1/2 xl:w-2/5 bg-gradient-to-br from-dr-blue via-dr-blue-dark to-dr-navy flex items-center justify-center px-6 py-10 md:py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,white,transparent_60%)]" />
        <div className="relative w-full max-w-md space-y-6 text-center md:text-left">
          <div className="inline-flex items-center justify-center md:justify-start rounded-2xl bg-white/10 backdrop-blur px-5 py-3 border border-white/20 shadow-lg">
            <img
              src={governmentLogo}
              alt="Gobierno de la República Dominicana - Sistema Único de Beneficiarios"
              className="h-14 w-auto md:h-16 lg:h-18"
            />
          </div>
          <div className="space-y-3 text-white">
            <p className="text-sm uppercase tracking-[0.35em] text-white/80 font-gotham">
              República Dominicana
            </p>
            <h1 className="text-3xl md:text-4xl font-gotham font-bold leading-tight">
              Sistema Único de Beneficiarios
            </h1>
            <p className="text-white/90 text-base md:text-lg font-arial-rounded">
              Acceso seguro al panel administrativo para la gestión nacional de beneficiarios.
            </p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 md:px-10 md:py-16">
        <Card className="w-full max-w-sm sm:max-w-md shadow-xl border border-gray-200/80">
          <CardHeader className="text-center space-y-4 px-6 sm:px-8 pt-8">
            <div className="mx-auto h-12 w-12 bg-dr-blue rounded-full flex items-center justify-center shadow-md">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-dr-dark-gray text-2xl sm:text-3xl">
                Acceso al Sistema
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Ingrese sus credenciales institucionales para acceder al panel administrativo.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert className="border-amber-300 bg-amber-50 text-left">
                  <AlertDescription className="text-amber-800 text-sm sm:text-base">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="text-dr-dark-gray font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@siuben.gob.do"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-dr-blue focus:ring-dr-blue"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
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
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-dr-blue hover:bg-dr-blue-dark text-white font-medium py-2.5"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
