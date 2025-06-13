"use client"
import React, { useState } from 'react'
import { Phone, Video, MoreVertical, ArrowLeft, Search, Smile, Paperclip, Send, Check } from 'lucide-react'

const Chats = ({ selectedChat, onBack }:any) => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hey! How are you doing?",
      sender: "user",
      timestamp: "10:30 AM",
      status: "read"
    },
    {
      id: 2,
      text: "I'm doing great! Just finished a project. How about you?",
      sender: "me",
      timestamp: "10:32 AM",
      status: "read"
    },
    {
      id: 3,
      text: "That's awesome! I'd love to hear about it. Are you free for a call later?",
      sender: "user",
      timestamp: "10:35 AM",
      status: "read"
    },
    {
      id: 4,
      text: "Sure! Let me know when works best for you.",
      sender: "me",
      timestamp: "10:37 AM",
      status: "delivered"
    }
  ])

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "sent"
      }
      setMessages([...messages, newMessage])
      setMessage('')
    }
  }

  const handleKeyPress = (e:any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Empty state when no chat is selected
  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a chat to start messaging</h3>
          <p className="text-gray-500">Choose a conversation from the sidebar to view messages</p>
        </div>
      </div>
    )
  }

  // Active chat state
  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          {/* Back button for mobile */}
          <button 
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* User Avatar */}
          <div className="relative">
            <img 
              src={selectedChat.avatar || `https://ui-avatars.com/api/?name=${selectedChat.name}&background=random`}
              alt={selectedChat.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {selectedChat.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          
          {/* User Info */}
          <div>
            <h3 className="font-semibold text-gray-800">{selectedChat.name}</h3>
            <p className="text-sm text-gray-500">
              {selectedChat.isOnline ? 'Online' : `Last seen ${selectedChat.lastSeen}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.sender === 'me' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-800 shadow-sm'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <div className={`flex items-center justify-end space-x-1 mt-1 ${
                msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                <span className="text-xs">{msg.timestamp}</span>
                {msg.sender === 'me' && (
                  <div className="flex">
                    <Check className={`w-3 h-3 ${
                      msg.status === 'read' ? 'text-blue-200' : 'text-blue-300'
                    }`} />
                    {msg.status === 'read' && (
                      <Check className="w-3 h-3 -ml-1 text-blue-200" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors">
              <Smile className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <button 
            onClick={handleSendMessage}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chats