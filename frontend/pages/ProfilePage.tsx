
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-100 mb-4">User Profile</h1>
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        {user ? (
          <div className="flex items-center space-x-4">
            <img src={user.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full" />
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
