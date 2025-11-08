import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Lock, User, CheckCircle2, Headset } from 'lucide-react';
import governmentLogo from '../assets/Logo-Siuben.png';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  error?: string;
  isLoading?: boolean;
}

const HERO_FEATURES = [
  {
    title: 'Panel centralizado',
    description: 'Monitoree solicitudes, beneficiarios y reportes en un mismo lugar.',
  },
  {
    title: 'Seguridad reforzada',
    description: 'Autenticación cifrada y controles basados en el rol institucional.',
  },
  {
    title: 'Gestión en tiempo real',
    description: 'Actualizaciones instantáneas ante nuevas solicitudes o asignaciones.',
  },
];

export function LoginForm({ onLogin, error, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#eef2f7] via-white to-[#e4ecff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_farthest-corner_at_12%_18%,rgba(18,94,201,0.18),transparent_52%)]" />
      <div className="pointer-events-none absolute right-[-18%] top-[-8%] hidden h-[28rem] w-[28rem] rounded-full bg-dr-blue-dark/15 blur-[180px] md:block" />
      <div className="pointer-events-none absolute left-[-30%] bottom-[-10%] h-[24rem] w-[24rem] rounded-full bg-dr-blue/12 blur-[160px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col items-center px-5 pb-12 pt-10 sm:px-8 md:px-10 lg:px-16">
        <div className="w-full max-w-2xl space-y-3 text-center md:space-y-4">
          <img
            src={governmentLogo}
            alt="Gobierno de la República Dominicana - Sistema Único de Beneficiarios"
            className="mx-auto h-32 w-auto md:h-28"
          />
          <h1 className="text-[34px] font-gotham font-bold leading-tight text-dr-dark-gray md:text-[46px]">
            Sistema Único de Beneficiarios
          </h1>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-dr-blue/80 md:text-base">
            Backoffice SIUBEN
          </p>
          <p className="text-sm text-gray-600 md:text-base">
            Ingrese con sus credenciales institucionales para administrar solicitudes, beneficiarios y reportes.
          </p>
        </div>

        <div className="mt-10 flex w-full max-w-lg justify-center md:mt-12">
          <Card className="w-full rounded-3xl border border-white/60 bg-white/95 shadow-[0_32px_80px_rgba(15,41,82,0.18)] backdrop-blur-sm">
            <CardContent className="space-y-6 px-6 py-8 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert className="border-amber-300 bg-amber-50 text-left">
                    <AlertDescription className="text-sm text-amber-800 sm:text-base">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 text-left">
                  <Label htmlFor="email" className="text-sm font-medium text-dr-dark-gray">
                    Correo institucional
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nombre.apellido@siuben.gob.do"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 pr-3 text-sm sm:text-base"
                      autoComplete="username"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="password" className="text-sm font-medium text-dr-dark-gray">
                      Contraseña
                    </Label>
                    <a
                      href="mailto:mesadeservicio@siuben.gob.do?subject=Asistencia%20de%20acceso"
                      className="text-xs font-semibold uppercase tracking-wide text-dr-blue transition-colors hover:text-dr-blue-dark"
                    >
                      ¿Necesita ayuda?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingrese su contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 text-sm sm:text-base"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-dr-blue py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:bg-dr-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dr-blue focus-visible:ring-offset-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>
              </form>

              <div className="flex flex-col gap-4 rounded-xl border border-dashed border-dr-blue/20 bg-dr-blue/5 p-4 text-left text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-dr-blue/10 text-dr-blue">
                    <Headset className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-dr-dark-gray">Mesa de ayuda SIUBEN</p>
                    <p className="text-xs text-gray-500 sm:text-sm">
                      soporte@siuben.gob.do • (809) 732-0230 ext. 234
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-dr-blue/40 text-dr-blue hover:bg-dr-blue/10"
                  asChild
                >
                  <a href="mailto:soporte@siuben.gob.do?subject=Solicitud%20de%20apoyo">
                    Contactar soporte
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
