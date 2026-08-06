import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          &copy; {currentYear} EMPS - Employee Management & Productivity System
        </p>
        <div className="flex items-center space-x-4 mt-2 md:mt-0">
          <a href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            Privacy Policy
          </a>
          <a href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            Terms of Service
          </a>
          <a href="/support" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;