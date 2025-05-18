"use client"


import React from 'react'
import ChatSidebar from './ChatSidebar'
import Chats from './Chats'

const Dashboard = () => {
  return (
    <div className='h-screen w-full grid grid-cols-10'>
        <div className='col-span-2 border-r border-gray-300'>
            <ChatSidebar />
        </div>
        <div className='col-span-8'>
            <Chats />
        </div>
    </div>
  )
}

export default Dashboard