'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, User, LogOut, Search, X } from 'lucide-react';
import { Input } from '@/components/shared/Input';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/recruitment/vacancies?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="hidden sm:block">
            <h1 className="font-playfair text-lg font-semibold text-navy">
              Recruitment Management
            </h1>
          </div>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <Input
              placeholder="Search vacancies, applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </form>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 md:hidden transition-colors"
          >
            <Search size={20} />
          </button>

          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          <div className="relative group">
            <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
                <User size={16} className="text-gold" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-navy">
              </span>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-3 border-b border-gray-100">
              </div>
              <button
                onClick={() => router.push('/profile' as any)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Profile Settings
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden p-4 border-t border-gray-200">
          <form onSubmit={handleSearch} className="relative">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

export default Header;