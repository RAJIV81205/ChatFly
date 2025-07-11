"use client"

import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className={`w-[60dvw] h-[10dvh] rounded-lg px-6 py-4 border-2 border-white/10 backdrop-blur-sm mt-5 transition-colors duration-300 absolute top-0 left-1/2 -translate-x-1/2 ${
      isDarkMode 
        ? 'bg-black border-gray-800' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDarkMode 
              ? 'bg-blue-600' 
              : 'bg-blue-500'
          }`}>
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <h1 className={`text-xl font-semibold ${
            isDarkMode 
              ? 'text-white' 
              : 'text-gray-900'
          }`}>
            TextNest
          </h1>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;