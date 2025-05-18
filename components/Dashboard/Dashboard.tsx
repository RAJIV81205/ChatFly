"use client"

import React from 'react'
import ChatSidebar from './ChatSidebar'
import Chats from './Chats'

const Dashboard = () => {
  return (
    <div className='h-screen w-full flex bg-black'>
      <div className='w-[20vw] border-r border-white/20'>
        <ChatSidebar />
      </div>
      <div className='flex-1'>
        <Chats />
      </div>
    </div>
  )
}

export default Dashboard