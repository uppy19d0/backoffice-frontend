import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Users,
  UserCheck,
  ClipboardList,
  FileText,
  Settings,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Calendar
} from 'lucide-react';

// Tokens de diseño específicos
const tokens = {
  // Colores
  navBg: '#0B1F36',
  navItemText: '#E6EDF6',
  navItemTextMuted: '#9FB0C6',
  navItemActiveBg: '#14365C', // tema oscuro
  navItemActiveText: '#E6EDF6',
  navItemHoverBg: '#0F2A4A',
  focusRing: '#7DB3FF',
  
  // Dimensiones
  widthExpanded: 264,
  widthCollapsed: 72,
  itemHeight: 44,
  iconSize: 20,
  scrollbarGutter: 12,
  borderRadius: 10,
  
  // Espaciado
  paddingVertical: 12,
  paddingHorizontal: 8,
  gap: 6,
  itemPaddingH: 10,
  itemPaddingV: 8,
  safeZone: 12
};

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  hasSubmenu?: boolean;
  submenuItems?: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const navigationItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Panel Principal',
    icon: Home,
    isActive: true,
    hasSubmenu: true,
    submenuItems: [
      { id: 'overview', label: 'Vista General', icon: BarChart3 },
      { id: 'calendar', label: 'Calendario', icon: Calendar },
    ]
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: Users,
  },
  {
    id: 'beneficiaries',
    label: 'Beneficiarios',
    icon: UserCheck,
  },
  {
    id: 'requests',
    label: 'Solicitudes',
    icon: ClipboardList,
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: FileText,
  },
  {
    id: 'config',
    label: 'Configuraciones',
    icon: Settings,
  }
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onItemClick?: (itemId: string) => void;
  currentPage?: string;
  theme?: 'light' | 'dark';
}

interface SidebarItemComponentProps {
  item: SidebarItem;
  isCollapsed: boolean;
  isActive: boolean;
  isExpanded?: boolean;
  onItemClick: (itemId: string) => void;
  onToggleSubmenu?: () => void;
}

// Componente individual del item
const SidebarItemComponent: React.FC<SidebarItemComponentProps> = ({
  item,
  isCollapsed,
  isActive,
  isExpanded = false,
  onItemClick,
  onToggleSubmenu
}) => {
  const Icon = item.icon;

  return (
    <div className="sidebar-item-container">
      {/* Item principal */}
      <button
        onClick={() => {
          onItemClick(item.id);
          if (item.hasSubmenu && onToggleSubmenu) {
            onToggleSubmenu();
          }
        }}
        className={`
          sidebar-nav-item
          ${isActive ? 'sidebar-nav-item--active' : ''}
          ${isCollapsed ? 'sidebar-nav-item--collapsed' : ''}
        `}
        style={{
          minHeight: `${tokens.itemHeight}px`,
          paddingLeft: `${tokens.itemPaddingH}px`,
          paddingRight: isCollapsed ? `${tokens.itemPaddingH}px` : `${tokens.itemPaddingH + tokens.safeZone}px`,
          paddingTop: `${tokens.itemPaddingV}px`,
          paddingBottom: `${tokens.itemPaddingV}px`,
          borderRadius: `${tokens.borderRadius}px`,
          marginBottom: `${tokens.gap}px`,
        }}
      >
        {/* Ícono */}
        <Icon 
          className="sidebar-nav-icon"
          style={{
            width: `${tokens.iconSize}px`,
            height: `${tokens.iconSize}px`,
          }}
        />
        
        {/* Label */}
        {!isCollapsed && (
          <span className="sidebar-nav-label">
            {item.label}
          </span>
        )}
        
        {/* Chevron para submenú */}
        {!isCollapsed && item.hasSubmenu && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.16 }}
            className="sidebar-nav-chevron"
          >
            <ChevronRight 
              style={{
                width: `${tokens.iconSize - 4}px`,
                height: `${tokens.iconSize - 4}px`,
              }}
            />
          </motion.div>
        )}
      </button>

      {/* Submenú expandible */}
      <AnimatePresence>
        {!isCollapsed && item.hasSubmenu && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeInOut' }}
            className="sidebar-submenu"
            style={{
              paddingLeft: `${tokens.iconSize + tokens.itemPaddingH + 8}px`,
              marginBottom: `${tokens.gap}px`,
            }}
          >
            {item.submenuItems?.map((subItem) => {
              const SubIcon = subItem.icon;
              return (
                <button
                  key={subItem.id}
                  onClick={() => onItemClick(subItem.id)}
                  className="sidebar-submenu-item"
                  style={{
                    minHeight: `${tokens.itemHeight - 8}px`,
                    paddingLeft: `${tokens.itemPaddingH}px`,
                    paddingRight: `${tokens.itemPaddingH + tokens.safeZone}px`,
                    paddingTop: `${tokens.itemPaddingV - 2}px`,
                    paddingBottom: `${tokens.itemPaddingV - 2}px`,
                    borderRadius: `${tokens.borderRadius - 2}px`,
                    marginBottom: `${tokens.gap - 2}px`,
                  }}
                >
                  <SubIcon 
                    style={{
                      width: `${tokens.iconSize - 4}px`,
                      height: `${tokens.iconSize - 4}px`,
                    }}
                  />
                  <span className="sidebar-nav-label sidebar-nav-label--submenu">
                    {subItem.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente principal del sidebar
export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed = false,
  onToggle,
  onItemClick = () => {},
  currentPage = 'dashboard',
  theme = 'dark'
}) => {
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>('dashboard');

  const handleItemClick = (itemId: string) => {
    onItemClick(itemId);
  };

  const handleToggleSubmenu = (itemId: string) => {
    setExpandedSubmenu(expandedSubmenu === itemId ? null : itemId);
  };

  return (
    <aside 
      className="admin-sidebar"
      style={{
        width: isCollapsed ? `${tokens.widthCollapsed}px` : `${tokens.widthExpanded}px`,
        backgroundColor: tokens.navBg,
        paddingTop: `${tokens.paddingVertical}px`,
        paddingBottom: `${tokens.paddingVertical}px`,
        paddingLeft: `${tokens.paddingHorizontal}px`,
        paddingRight: `${tokens.paddingHorizontal}px`,
      }}
    >
      {/* Header del sidebar */}
      <div className="sidebar-header" style={{ marginBottom: `${tokens.gap * 2}px` }}>
        {!isCollapsed && (
          <div className="sidebar-brand">
            <h2 className="sidebar-title">
              SIUBEN
            </h2>
            <p className="sidebar-subtitle">
              Panel Administrativo
            </p>
          </div>
        )}
      </div>

      {/* Contenedor de navegación con scroll interno */}
      <nav 
        className="sidebar-nav"
        style={{
          // Reservamos espacio para el scrollbar gutter
          marginRight: `-${tokens.scrollbarGutter}px`,
          paddingRight: `${tokens.scrollbarGutter}px`,
        }}
      >
        <div className="sidebar-nav-list">
          {navigationItems.map((item) => (
            <SidebarItemComponent
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              isActive={currentPage === item.id}
              isExpanded={expandedSubmenu === item.id}
              onItemClick={handleItemClick}
              onToggleSubmenu={() => handleToggleSubmenu(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* Footer del sidebar */}
      <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: `${tokens.gap * 2}px` }}>
        {!isCollapsed && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              AD
            </div>
            <div className="sidebar-user-details">
              <p className="sidebar-user-name">Administrador</p>
              <p className="sidebar-user-role">Sistema SIUBEN</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};