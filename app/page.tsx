import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { MessageCircle, Lock, Zap, Globe, Smile, Users } from 'lucide-react';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>ChatSync - Modern Messaging Platform</title>
        <meta name="description" content="Secure, fast, and reliable messaging for teams and individuals" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="fixed w-full bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold">Chat<span className="text-purple-500">Sync</span></span>
        </div>

        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            <li><a href="#features" className="text-gray-300 hover:text-white transition">Features</a></li>
            <li><a href="#security" className="text-gray-300 hover:text-white transition">Security</a></li>
            <li><a href="#testimonials" className="text-gray-300 hover:text-white transition">Testimonials</a></li>
            <li><a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a></li>
          </ul>
        </nav>

        <div className="flex items-center space-x-4">
          <a href="#login" className="px-4 py-2 border border-purple-500 text-purple-500 rounded-lg hover:bg-purple-500/10 transition font-medium">
            Login
          </a>
          <a href="#signup" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg shadow-purple-500/20 transition transform hover:-translate-y-0.5 font-medium">
            Sign Up Free
          </a>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 md:px-12 lg:px-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Communication <span className="text-purple-500">reimagined</span> for the digital age
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg">
              Experience seamless messaging with advanced features designed for individuals and teams. Stay connected, secured, and productive.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <a href="#signup" className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg shadow-purple-500/20 transition transform hover:-translate-y-0.5 font-medium text-center">
                Get Started
              </a>
              <a href="#demo" className="px-8 py-3 border border-gray-700 hover:border-gray-600 bg-gray-800 hover:bg-gray-700 rounded-lg transition font-medium text-center">
                Watch Demo
              </a>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="w-full h-96 md:h-[500px] relative">
              <Image
                src="/api/placeholder/600/500"
                alt="ChatSync Interface"
                layout="fill"
                objectFit="contain"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-800 px-6 md:px-12 lg:px-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              ChatSync is packed with everything you need for modern communication without the complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Messaging</h3>
              <p className="text-gray-300">
                Lightning-fast message delivery with typing indicators and read receipts. Stay connected without delays.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">End-to-End Encryption</h3>
              <p className="text-gray-300">
                Your conversations are secured with military-grade encryption. Only you and your recipients can read messages.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Cross-platform Support</h3>
              <p className="text-gray-300">
                Available on all your devices. Seamlessly switch between desktop, mobile, and web without missing a beat.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <Smile className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Rich Media Sharing</h3>
              <p className="text-gray-300">
                Share photos, videos, files, and more with intelligent preview capabilities and organization.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Group Conversations</h3>
              <p className="text-gray-300">
                Create channels for teams or chat with multiple friends. Organize discussions with threads and mentions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <MessageCircle className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Notifications</h3>
              <p className="text-gray-300">
                AI-powered notification system that learns your preferences and only alerts you for important messages.
              </p>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-20 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-gray-900 to-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Security First Approach</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                We've built ChatSync with your privacy and security as our top priority.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <div className="w-full h-64 md:h-96 relative">
                  <Image
                    src="/api/placeholder/500/400"
                    alt="Security Illustration"
                    layout="fill"
                    objectFit="contain"
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                      <Lock className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">End-to-End Encryption</h3>
                      <p className="text-gray-300">
                        Your messages are encrypted the moment you hit send and can only be decrypted by the intended recipient.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                      <Lock className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Self-Destructing Messages</h3>
                      <p className="text-gray-300">
                        Set messages to delete after they're read or after a specific time period.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                      <Lock className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Two-Factor Authentication</h3>
                      <p className="text-gray-300">
                        Add an extra layer of security to your account with our 2FA options.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-6 md:px-12 lg:px-24 bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Thousands of individuals and teams trust ChatSync for their daily communications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold text-purple-500">S</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Sarah Johnson</h4>
                    <p className="text-gray-400 text-sm">Product Manager</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  "ChatSync has transformed how our team communicates. The intuitive interface and powerful features have boosted our productivity by at least 30%."
                </p>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold text-purple-500">M</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Michael Chen</h4>
                    <p className="text-gray-400 text-sm">Software Developer</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  "The end-to-end encryption and security features give me peace of mind when sharing sensitive information with clients and team members."
                </p>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold text-purple-500">A</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Alex Rodriguez</h4>
                    <p className="text-gray-400 text-sm">Small Business Owner</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  "As a small business, we needed an affordable solution that doesn't compromise on features. ChatSync delivers everything we need and more."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-gray-800 to-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Choose the plan that fits your needs. All plans include our core features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 hover:border-purple-500/50 transition flex flex-col">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <p className="text-gray-400 mb-6">Perfect for individuals</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>Up to 10 group chats</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>Basic encryption</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>File sharing up to 100MB</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>30-day message history</span>
                  </li>
                </ul>
                <a href="#signup" className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium text-center">
                  Sign Up Free
                </a>
              </div>

              {/* Pro Plan */}
              <div className="bg-gray-900 p-8 rounded-xl border border-purple-500 hover:border-purple-400 transition flex flex-col relative">
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-sm font-bold py-1 px-3 rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-gray-400 mb-6">For professionals & small teams</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$12</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>Unlimited group chats</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>End-to-end encryption</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>File sharing up to 5GB</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>1-year message history</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <a href="#signup" className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition font-medium text-center">
                  Get Pro
                </a>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 hover:border-purple-500/50 transition flex flex-col">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-400 mb-6">For organizations & large teams</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>Advanced admin controls</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>User activity analytics</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>Custom integration</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 text-purple-500 mr-2" />
                    <span>Dedicated support manager</span>
                  </li>
                </ul>
                <a href="#contact" className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium text-center">
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 md:px-12 lg:px-24 bg-purple-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your conversations?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of satisfied users who have made ChatSync their primary messaging platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#signup" className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg shadow-purple-500/20 transition transform hover:-translate-y-0.5 font-medium text-xl">
                Get Started for Free
              </a>
              <a href="#demo" className="px-8 py-4 border border-purple-500 text-purple-500 rounded-lg hover:bg-purple-500/10 transition font-medium text-xl">
                Schedule a Demo
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <MessageCircle className="h-6 w-6 text-purple-500" />
                <span className="text-xl font-bold">Chat<span className="text-purple-500">Sync</span></span>
              </div>
              <p className="text-gray-400 mb-6">
                Modern messaging for individuals and teams. Secure, fast, and reliable.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-purple-500 transition">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.093 4.093 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.615 11.615 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-500 transition">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-500 transition">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-purple-500 transition">Features</a></li>
                <li><a href="#security" className="text-gray-400 hover:text-purple-500 transition">Security</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-purple-500 transition">Pricing</a></li>
                <li><a href="#roadmap" className="text-gray-400 hover:text-purple-500 transition">Roadmap</a></li>
                <li><a href="#download" className="text-gray-400 hover:text-purple-500 transition">Download</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#blog" className="text-gray-400 hover:text-purple-500 transition">Blog</a></li>
                <li><a href=" #help-center" className="text-gray-400 hover:text-purple-500 transition">Help Center</a></li>
                <li><a href="#community" className="text-gray-400 hover:text-purple-500 transition">Community</a></li>
                <li><a href="#status" className="text-gray-400 hover:text-purple-500 transition">Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-purple-500 transition">About Us</a></li>
                <li><a href="#careers" className="text-gray-400 hover:text-purple-500 transition">Careers</a></li>
                <li><a href="#press" className="text-gray-400 hover:text-purple-500 transition">Press</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-purple-500 transition">Contact</a></li>
                <li><a href="#privacy" className="text-gray-400 hover:text-purple-500 transition">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ChatSync. All rights reserved.</p>
          </div>
          </div>
        

      </footer >
    </div>

  );
};

export default Home;
