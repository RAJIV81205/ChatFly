"use client"

import React from 'react'
import { EllipsisVertical } from 'lucide-react';

const ChatSidebar = () => {
  return (
    <div className="h-full bg-transparent flex flex-col items-center justify-between p-4">
      <div className="h-10 flex items-center justify-between w-full">
        <p>TextNest</p>

        <EllipsisVertical size={20} color="white" />

      </div>
      <div className="w-full">
        <input type="text"  />
      </div>

    </div>
  )
}

export default ChatSidebar