import React from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { GraduationCap, Users, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user } = useUser();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Classrooms', href: '/classrooms', icon: Users },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AttendanceAI</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Welcome, {user?.firstName}
            </div>
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8'
                }
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}