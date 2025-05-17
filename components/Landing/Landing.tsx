"use client"

import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { MessageSquare, Shield, Zap, Globe, Image as ImageIcon, Users, Bell, Menu, X, ChevronRight, Send } from 'lucide-react';
import Link from 'next/link';

const Home: NextPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDemo, setCurrentDemo] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  
  // Animation for the demo chat
  useEffect(() => {
    const messages = [
      "Hey team, I just pushed the latest changes to the repository.",
      "Great! Did you update the documentation as well?",
      "Yes, everything is updated and ready for review."
    ];
    
    let currentIndex = 0;
    let currentChar = 0;
    let typingInterval: NodeJS.Timeout;
    
    if (currentDemo === 2) {
      typingInterval = setInterval(() => {
        if (currentChar < messages[currentIndex].length) {
          setTypingText(messages[currentIndex].substring(0, currentChar + 1));
          currentChar++;
          setIsTyping(true);
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
          
          setTimeout(() => {
            currentIndex = (currentIndex + 1) % messages.length;
            currentChar = 0;
            if (currentDemo === 2) {
              typingInterval = setInterval(() => {
                if (currentChar < messages[currentIndex].length) {
                  setTypingText(messages[currentIndex].substring(0, currentChar + 1));
                  currentChar++;
                  setIsTyping(true);
                } else {
                  clearInterval(typingInterval);
                  setIsTyping(false);
                }
              }, 50);
            }
          }, 2000);
        }
      }, 50);
    }
    
    const demoInterval = setInterval(() => {
      setCurrentDemo((prev) => (prev === 3 ? 1 : prev + 1));
    }, 8000);
    
    return () => {
      clearInterval(typingInterval);
      clearInterval(demoInterval);
    };
  }, [currentDemo]);
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Head>
        <title>TextNest - Modern Secure Messaging Platform</title>
        <meta name="description" content="Secure, elegant, and intuitive messaging for teams and individuals" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Header with animated gradient border */}
      <header className="fixed w-full bg-gray-950/90 backdrop-blur-lg border-b border-gray-800/50 px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-lg blur opacity-50"></div>
            <div className="relative bg-gray-900 p-1.5 rounded-lg">
              <MessageSquare className="h-6 w-6 text-teal-400" />
            </div>
          </div>
          <span className="text-xl font-bold">Text<span className="text-teal-400">Nest</span></span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            <li><a href="#features" className="text-gray-300 hover:text-teal-400 transition">Features</a></li>
            <li><a href="#security" className="text-gray-300 hover:text-teal-400 transition">Security</a></li>
            <li><a href="#testimonials" className="text-gray-300 hover:text-teal-400 transition">Testimonials</a></li>
            <li><a href="#pricing" className="text-gray-300 hover:text-teal-400 transition">Pricing</a></li>
          </ul>
        </nav>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/auth/login" className="px-4 py-2 border border-teal-500 text-teal-400 rounded-lg hover:bg-teal-500/10 transition font-medium">
            Get Started
          </Link>
          
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-gray-950/95 z-40 pt-20 px-6 md:hidden">
          <nav>
            <ul className="space-y-6 text-lg">
              <li><a href="#features" className="block py-2 text-gray-300 hover:text-teal-400 transition" onClick={() => setIsMenuOpen(false)}>Features</a></li>
              <li><a href="#security" className="block py-2 text-gray-300 hover:text-teal-400 transition" onClick={() => setIsMenuOpen(false)}>Security</a></li>
              <li><a href="#testimonials" className="block py-2 text-gray-300 hover:text-teal-400 transition" onClick={() => setIsMenuOpen(false)}>Testimonials</a></li>
              <li><a href="#pricing" className="block py-2 text-gray-300 hover:text-teal-400 transition" onClick={() => setIsMenuOpen(false)}>Pricing</a></li>
              <li className="pt-4">
                <a href="#login" className="block w-full py-3 text-center border border-teal-500 text-teal-400 rounded-lg hover:bg-teal-500/10 transition font-medium">
                  Login
                </a>
              </li>
              <li className="pt-4">
                <a href="#signup" className="block w-full py-3 text-center bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-lg shadow-lg shadow-teal-500/20 transition font-medium">
                  Sign Up Free
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}
      
      <main>
        {/* Hero Section with interactive elements */}
        <section className="relative pt-32 pb-20 px-6 md:px-12 lg:px-24 overflow-hidden">
          {/* Animated background gradients */}
          <div className="absolute top-40 left-10 w-64 h-64 bg-teal-600/20 rounded-full filter blur-3xl"></div>
          <div className="absolute top-60 right-10 w-96 h-96 bg-emerald-600/10 rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-12 md:mb-0 relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your conversations <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">deserve</span> a better home
              </h1>
              <p className="text-gray-400 text-lg mb-8 max-w-lg">
                TextNest brings elegance, security, and intuitive design to your team communication. Built for the way modern teams work.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <a href="#signup" className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-lg shadow-lg shadow-teal-500/20 transition transform hover:-translate-y-0.5 font-medium text-center group">
                  <span className="flex items-center justify-center">
                    Get Started 
                    <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </span>
                </a>
                <a href="#demo" className="px-8 py-3 border border-gray-700 hover:border-teal-500/50 bg-gray-900/60 hover:bg-gray-800/60 rounded-lg transition font-medium text-center flex items-center justify-center">
                  Watch Demo
                </a>
              </div>
            </div>
            
            {/* Interactive Message Demo */}
            <div className="md:w-1/2 relative">
              <div className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Demo Screen 1: Chat Interface */}
                <div className={`${currentDemo === 1 ? 'opacity-100' : 'opacity-0 absolute inset-0'} transition-opacity duration-1000 ease-in-out`}>
                  <div className="bg-gray-800 p-4 flex items-center space-x-3">
                    <div className="bg-teal-500 rounded-full w-3 h-3"></div>
                    <div className="bg-emerald-500 rounded-full w-3 h-3"></div>
                    <div className="bg-cyan-500 rounded-full w-3 h-3"></div>
                    <span className="text-sm text-gray-400 ml-2">TextNest Chat</span>
                  </div>
                  <div className="h-[450px] overflow-hidden">
                    <div className="flex flex-col h-full">
                      <div className="flex-1 p-4 space-y-4 overflow-auto">
                        <div className="flex items-start space-x-3">
                          <div className="bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">JD</span>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-3 max-w-xs">
                            <p className="text-sm text-gray-200">Hey team, what's the status on the project?</p>
                            <span className="text-xs text-gray-500 mt-1 block">10:24 AM</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 justify-end">
                          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg p-3 max-w-xs">
                            <p className="text-sm">Almost done with the frontend part. Will push the changes by EOD.</p>
                            <span className="text-xs text-teal-200/70 mt-1 block">10:26 AM</span>
                          </div>
                          <div className="bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">ME</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="bg-emerald-700 h-8 w-8 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">AR</span>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-3 max-w-xs">
                            <p className="text-sm text-gray-200">Backend APIs are ready for integration. Here's the documentation:</p>
                            <div className="bg-gray-700/50 mt-2 p-2 rounded flex items-center space-x-2">
                              <div className="bg-gray-600 p-1 rounded">
                                <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <span className="text-xs text-gray-300">api-docs.pdf</span>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 block">10:30 AM</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border-t border-gray-800">
                        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
                          <input
                            type="text"
                            placeholder="Type a message..."
                            className="bg-transparent border-0 flex-1 focus:outline-none text-sm"
                          />
                          <button className="p-1 rounded-full hover:bg-gray-700 transition">
                            <Send size={18} className="text-teal-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Demo Screen 2: Typing Indicator */}
                <div className={`${currentDemo === 2 ? 'opacity-100' : 'opacity-0 absolute inset-0'} transition-opacity duration-1000 ease-in-out`}>
                  <div className="bg-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-teal-500 rounded-full w-3 h-3"></div>
                      <div className="bg-emerald-500 rounded-full w-3 h-3"></div>
                      <div className="bg-cyan-500 rounded-full w-3 h-3"></div>
                    </div>
                    <span className="text-sm font-medium">Development Team</span>
                    <span className="text-xs text-gray-400">3 online</span>
                  </div>
                  <div className="h-[450px] overflow-hidden p-4">
                    <div className="flex flex-col h-full">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <div className="bg-cyan-700 h-10 w-10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">MK</span>
                            </div>
                            <div className="absolute bottom-0 right-0 bg-green-500 h-3 w-3 rounded-full border-2 border-gray-900"></div>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-3 max-w-sm">
                            <p className="font-medium text-sm text-gray-300 mb-1">Mark Kim</p>
                            <p className="text-sm text-gray-200">Hey team, I just pushed the latest changes to the repository.</p>
                            <span className="text-xs text-gray-500 mt-1 block">Just now</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <div className="bg-emerald-700 h-10 w-10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">JD</span>
                            </div>
                            <div className="absolute bottom-0 right-0 bg-green-500 h-3 w-3 rounded-full border-2 border-gray-900"></div>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-3 max-w-sm">
                            <p className="font-medium text-sm text-gray-300 mb-1">Jane Davis</p>
                            <p className="text-sm text-gray-200">Great! Did you update the documentation as well?</p>
                            <span className="text-xs text-gray-500 mt-1 block">Just now</span>
                          </div>
                        </div>
                        
                        {typingText && (
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <div className="bg-teal-700 h-10 w-10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold">MK</span>
                              </div>
                              <div className="absolute bottom-0 right-0 bg-green-500 h-3 w-3 rounded-full border-2 border-gray-900"></div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3 max-w-sm">
                              <p className="font-medium text-sm text-gray-300 mb-1">Mark Kim</p>
                              <p className="text-sm text-gray-200">{typingText}</p>
                              <span className="text-xs text-gray-500 mt-1 block">Typing...</span>
                            </div>
                          </div>
                        )}
                        
                        {isTyping && !typingText && (
                          <div className="flex items-center space-x-2 p-2">
                            <div className="text-xs text-gray-400">Mark is typing</div>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Demo Screen 3: Dark UI with Stats */}
                <div className={`${currentDemo === 3 ? 'opacity-100' : 'opacity-0 absolute inset-0'} transition-opacity duration-1000 ease-in-out`}>
                  <div className="bg-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-teal-500 h-8 w-8 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <span className="font-medium">Dashboard</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-700 p-1 rounded-md">
                        <svg className="h-4 w-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="bg-gray-700 p-1 rounded-md">
                        <Bell size={16} className="text-teal-400" />
                      </div>
                    </div>
                  </div>
                  <div className="h-[450px] overflow-hidden">
                    <div className="p-4">
                      <h3 className="text-lg font-bold mb-4">Team Activity</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <div className="text-3xl font-bold text-teal-400 mb-1">24</div>
                          <div className="text-sm text-gray-400">Active Conversations</div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <div className="text-3xl font-bold text-emerald-400 mb-1">87%</div>
                          <div className="text-sm text-gray-400">Response Rate</div>
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Messages</h4>
                      <div className="space-y-3">
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-center">
                          <div className="bg-cyan-700 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold">AR</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">Alex Rodriguez</span>
                              <span className="text-xs text-gray-500">2m ago</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">Shipped the new features to production</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-center">
                          <div className="bg-emerald-700 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold">JD</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">Jane Davis</span>
                              <span className="text-xs text-gray-500">15m ago</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">Updated the API documentation</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-center">
                          <div className="bg-teal-700 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold">MK</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">Mark Kim</span>
                              <span className="text-xs text-gray-500">1h ago</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">Created a new project repository</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Navigation dots */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  <button 
                    onClick={() => setCurrentDemo(1)} 
                    className={`w-2 h-2 rounded-full transition-all ${currentDemo === 1 ? 'bg-teal-400 w-4' : 'bg-gray-600 hover:bg-gray-500'}`}
                  />
                  <button 
                    onClick={() => setCurrentDemo(2)} 
                    className={`w-2 h-2 rounded-full transition-all ${currentDemo === 2 ? 'bg-teal-400 w-4' : 'bg-gray-600 hover:bg-gray-500'}`}
                  />
                  <button 
                    onClick={() => setCurrentDemo(3)} 
                    className={`w-2 h-2 rounded-full transition-all ${currentDemo === 3 ? 'bg-teal-400 w-4' : 'bg-gray-600 hover:bg-gray-500'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 bg-gradient-to-b from-gray-950 to-gray-900 px-6 md:px-12 lg:px-24 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
          
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience the Difference</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                TextNest combines thoughtful design with powerful features to create the messaging experience your team deserves.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-teal-500/50 transition transform hover:-translate-y-1 group">
                <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 p-3 border border-teal-500/20 group-hover:border-teal-500/40 transition-colors">
                  <Zap className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-teal-400 transition-colors">Instant Delivery</h3>
                <p className="text-gray-400">
                  Messages sent in real-time with typing indicators, read receipts, and delivery confirmations that keep everyone connected.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-teal-500/50 transition transform hover:-translate-y-1 group">
                <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 p-3 border border-teal-500/20 group-hover:border-teal-500/40 transition-colors">
                  <Shield className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-teal-400 transition-colors">Enterprise Security</h3>
                <p className="text-gray-400">
                  Zero-knowledge encryption ensures your conversations remain private. Only you and your intended recipients can access messages.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-teal-500/50 transition transform hover:-translate-y-1 group">
                <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 p-3 border border-teal-500/20 group-hover:border-teal-500/40 transition-colors">
                  <Globe className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-teal-400 transition-colors">Global Reach</h3>
                <p className="text-gray-400">
                  Connect with team members worldwide through our reliable infrastructure that ensures consistent performance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;