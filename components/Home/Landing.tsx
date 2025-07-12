"use client"

import React from 'react'
import { useTheme } from '@/components/ThemeProvider'

const Landing = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`text-center transition-colors duration-300 min-h-screen flex justify-center items-center flex-col ${
      isDarkMode ? 'text-white' : 'text-gray-900'
    }`}>
      <h2 className="text-4xl font-bold mb-4">Welcome to TextNest</h2>
      <p className="text-lg opacity-80">Your text processing companion</p>
    </div>
  )
}

export default Landing