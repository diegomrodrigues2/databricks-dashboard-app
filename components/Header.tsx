
import React from 'react';
import ProfileDropdown from './ProfileDropdown';
import type { Page } from '../types';

interface HeaderProps {
    onNavigate: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center z-20">
      <div className="text-2xl font-bold text-white">
        StoneX <span className="font-light">Portal</span>
      </div>
      <ProfileDropdown onNavigate={onNavigate} />
    </header>
  );
};

export default Header;
