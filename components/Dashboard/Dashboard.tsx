"use client"
import React, { useState } from 'react'
import ChatSidebar from './ChatSidebar'
import Chats from './Chats'

const Dashboard = () => {
  const [selectedChat, setSelectedChat] = useState(null)
  const [isMobileView, setIsMobileView] = useState(false)

  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
    setIsMobileView(true) // For mobile, show chat view when selected
  }

  const handleBackToSidebar = () => {
    setIsMobileView(false)
    // Don't clear selectedChat so it remains highlighted in sidebar
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className={`${
        isMobileView ? 'hidden' : 'block'
      } lg:block w-full lg:w-80 flex-shrink-0`}>
        <ChatSidebar 
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChat?.id}
        />
      </div>

      {/* Chat Area */}
      <div className={`${
        isMobileView ? 'block' : 'hidden'
      } lg:block lg:flex-1`}>
        <Chats 
          selectedChat={selectedChat}
          onBack={handleBackToSidebar}
        />
      </div>
    </div>
  )
}

export default Dashboard