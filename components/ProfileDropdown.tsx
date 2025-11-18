
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Page } from '../types';
import { UserIcon } from './icons/UserIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CogIcon } from './icons/CogIcon';
import { LogoutIcon } from './icons/LogoutIcon';


interface ProfileDropdownProps {
    onNavigate: (page: Page) => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (page: Page) => {
    onNavigate(page);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-700 transition-colors"
      >
        <img className="w-8 h-8 rounded-full" src={user?.avatarUrl} alt="User Avatar" />
        <span className="hidden md:block text-sm font-medium text-white">{user?.name}</span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
          <a
            onClick={() => handleNavigation('profile')}
            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
          >
            <UserIcon className="w-4 h-4 mr-2" /> Profile
          </a>
          <a
            onClick={() => handleNavigation('config')}
            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
          >
            <CogIcon className="w-4 h-4 mr-2" /> Config
          </a>
          <div className="border-t border-gray-700 my-1"></div>
          <a
            onClick={logout}
            className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 cursor-pointer"
          >
            <LogoutIcon className="w-4 h-4 mr-2" /> Logout
          </a>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
