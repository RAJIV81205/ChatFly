"use client"

import React from 'react'
import Header from './Header'
import Landing from './Landing'
import { useTheme } from '@/components/ThemeProvider'

const Home = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`relative w-full min-h-screen flex flex-col transition-all duration-700 ease-in-out overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black via-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse ${
          isDarkMode ? 'bg-white' : 'bg-black'
        }`} 
        style={{
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        
        <div className={`absolute top-3/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl animate-pulse ${
          isDarkMode ? 'bg-gray-300' : 'bg-gray-700'
        }`}
        style={{
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
        
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-10 blur-3xl ${
          isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
        }`}
        style={{
          animation: 'float 10s ease-in-out infinite'
        }}></div>
      </div>

      {/* Glassmorphism Overlay */}
      <div className={`absolute inset-0 backdrop-blur-[0.5px] ${
        isDarkMode 
          ? 'bg-gradient-to-b from-transparent via-black/10 to-black/20' 
          : 'bg-gradient-to-b from-white/10 via-white/20 to-white/30'
      }`}></div>

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {/* Header with enhanced styling */}
        <div className={`backdrop-blur-lg border-b transition-all duration-500 ${
          isDarkMode 
            ? 'bg-black/20 border-gray-700/50 shadow-lg shadow-black/20' 
            : 'bg-white/20 border-white/30 shadow-lg shadow-gray-200/20'
        }`}>
          <Header />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className={`w-full max-w-6xl transition-all duration-700 transform hover:scale-[1.02] ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            <Landing />
          </div>
        </div>
      </div>

      {/* Subtle grid pattern */}
      <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${
        isDarkMode ? 'bg-grid-white' : 'bg-grid-black'
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000' fill-opacity='0.4'%3e%3ccircle cx='30' cy='30' r='1'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
      }}></div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  )
}

export default Home