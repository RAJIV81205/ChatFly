"use client"
import React, { useState } from 'react'
import { EllipsisVertical, Search, MessageCircle, Phone, Video, Archive, Settings, Plus } from 'lucide-react'

const ChatSidebar = ({ onChatSelect, selectedChatId }:any) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Mock chat data - replace with your actual data
  const [chats] = useState([
    {
      id: 1,
      name: "Alice Johnson",
      lastMessage: "Hey! How are you doing?",
      timestamp: "10:30 AM",
      unreadCount: 2,
      avatar: null,
      isOnline: true,
      lastSeen: "now",
      isPinned: true
    },
    {
      id: 2,
      name: "Bob Smith",
      lastMessage: "Can we schedule a meeting for tomorrow?",
      timestamp: "9:45 AM",
      unreadCount: 0,
      avatar: null,
      isOnline: false,
      lastSeen: "2 hours ago",
      isPinned: false
    },
    {
      id: 3,
      name: "Team Dev",
      lastMessage: "Sarah: The new features are ready for testing",
      timestamp: "Yesterday",
      unreadCount: 5,
      avatar: null,
      isOnline: true,
      lastSeen: "now",
      isPinned: true
    },
    {
      id: 4,
      name: "Emma Wilson",
      lastMessage: "Thanks for the help with the project!",
      timestamp: "Yesterday",
      unreadCount: 0,
      avatar: null,
      isOnline: false,
      lastSeen: "1 day ago",
      isPinned: false
    },
    {
      id: 5,
      name: "Marketing Team",
      lastMessage: "John: Let's discuss the campaign strategy",
      timestamp: "Monday",
      unreadCount: 1,
      avatar: null,
      isOnline: true,
      lastSeen: "now",
      isPinned: false
    }
  ])

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleChatClick = (chat:any) => {
    onChatSelect(chat)
  }

  const formatTime = (timestamp:any) => {
    // Simple time formatting - you can enhance this
    return timestamp
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-800">TextNest</h1>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <EllipsisVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {[
          { id: 'all', label: 'All', icon: MessageCircle },
          { id: 'unread', label: 'Unread', icon: MessageCircle },
          { id: 'archived', label: 'Archived', icon: Archive }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedChatId === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.name}&background=random`}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {chat.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                    {chat.isPinned && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">{chat.name}</h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(chat.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">Chats</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">Calls</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">Video</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatSidebar