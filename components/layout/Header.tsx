
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserCircleIcon, LogoutIcon } from '../../constants';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 shadow-md flex items-center justify-between px-6 border-b dark:border-slate-700">
      <div>
        {/* Breadcrumbs or page title can go here */}
        <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200">Bienvenido</h2>
      </div>
      <div className="relative">
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <UserCircleIcon className="w-8 h-8 text-gray-600 dark:text-slate-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-slate-200 hidden md:block">{user?.username} ({user?.role})</span>
           <svg className={`w-4 h-4 text-gray-600 dark:text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {dropdownOpen && (
          <div 
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 z-20 ring-1 ring-black dark:ring-slate-600 ring-opacity-5"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
          >
            <button
              onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-primary-dark dark:hover:text-primary-light transition-colors"
              role="menuitem"
            >
              Mi Perfil
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-400 transition-colors"
              role="menuitem"
            >
              <LogoutIcon className="w-5 h-5 inline mr-2" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};