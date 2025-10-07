import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import './AdminSidebarStyles.css';

interface SidebarDemoProps {
  className?: string;
}

export const SidebarDemo: React.FC<SidebarDemoProps> = ({ className = '' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleItemClick = (itemId: string) => {
    setCurrentPage(itemId);
    console.log(`Navegando a: ${itemId}`);
  };

  return (
    <div className={`sidebar-demo h-screen flex ${className}`}>
      {/* AdminSidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        onItemClick={handleItemClick}
        currentPage={currentPage}
        theme="dark"
      />

      {/* Contenido principal */}
      <main 
        className="flex-1 bg-gray-100 p-8 transition-all duration-300"
        style={{
          marginLeft: isCollapsed ? '72px' : '264px',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Demostración del AdminSidebar
                </h1>
                <p className="text-gray-600">
                  Página actual: <span className="font-semibold">{currentPage}</span>
                </p>
              </div>
              
              <button
                onClick={handleToggle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isCollapsed ? 'Expandir Sidebar' : 'Colapsar Sidebar'}
              </button>
            </div>

            <div className="grid gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Características Implementadas
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Ancho fijo: 264px expandido, 72px colapsado
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Scrollbar gutter de 12px para evitar superposición
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Estados: Rest, Hover, Active, Focus-visible
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Objetivo táctil mínimo de 44px
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Submenú expandible con animación de 160ms
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Focus ring de 2px externo (#7DB3FF)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Tipografía Inter 14px/16px
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Safe zone de 12px para evitar superposición del scroll
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">
                  Tokens de Color Implementados
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0B1F36' }}></div>
                      <span>--nav-bg: #0B1F36</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E6EDF6' }}></div>
                      <span>--nav-item-text: #E6EDF6</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9FB0C6' }}></div>
                      <span>--nav-item-text-muted: #9FB0C6</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#14365C' }}></div>
                      <span>--nav-item-active-bg: #14365C</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0F2A4A' }}></div>
                      <span>--nav-item-hover-bg: #0F2A4A</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#7DB3FF' }}></div>
                      <span>--focus-ring: #7DB3FF</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-yellow-900 mb-3">
                  Problema Resuelto
                </h2>
                <p className="text-yellow-800 mb-3">
                  <strong>Antes:</strong> La barra de scroll se superponía al item activo, 
                  causando problemas de interacción y visualización.
                </p>
                <p className="text-yellow-800">
                  <strong>Después:</strong> Implementación de scrollbar gutter de 12px y 
                  safe zone para mantener los elementos interactivos alejados del área de scroll.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-900 text-white rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Instrucciones de Prueba</h2>
              <div className="space-y-2 text-gray-300">
                <p>1. Haz clic en "Panel Principal" para ver el submenú expandirse</p>
                <p>2. Usa el botón "Colapsar Sidebar" para ver la versión de solo iconos</p>
                <p>3. Navega entre los diferentes items para ver los estados activos</p>
                <p>4. Observa cómo el scroll interno no interfiere con los elementos activos</p>
                <p>5. Usa Tab para probar la navegación por teclado y los focus rings</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};