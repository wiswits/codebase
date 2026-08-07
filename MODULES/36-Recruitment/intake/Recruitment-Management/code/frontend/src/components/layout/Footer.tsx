'use client';

import { Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <p>
            &copy; {currentYear} WisWits. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Made with
            <Heart size={14} className="text-red-500 fill-red-500" />
            by WisWits Edutech
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-navy transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-navy transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-navy transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;