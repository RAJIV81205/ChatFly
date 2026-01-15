# Ping - Real-Time Encrypted Messaging Platform

A modern, secure real-time messaging application built with Next.js, featuring end-to-end encryption, video calling, and real-time presence indicators.

## Features

### Core Messaging
- **Real-time messaging** with Socket.IO for instant communication
- **End-to-end encryption** using AES-256-CBC for messages, files, and URLs
- **Private and group conversations** with member management
- **File sharing** with support for images, videos, and documents
- **Read receipts** and message status indicators
- **Typing indicators** with multi-device support
- **Online/offline presence** tracking with last seen timestamps

### Communication
- **Voice & video calls** powered by ZegoCloud
- **Call notifications** with incoming call UI and ringtone
- **30-second call timeout** for unanswered calls
- **Multi-device call handling** with proper state management

### Security
- **JWT authentication** for secure API and WebSocket connections
- **Email OTP verification** for account registration
- **Password hashing** with bcryptjs
- **Encrypted file storage** on Cloudinary
- **Secure file URL generation** with encryption

### User Experience
- **Dark/light theme** support with next-themes
- **Responsive design** optimized for all devices
- **Profile management** with avatar upload and bio
- **User search** functionality
- **Emoji picker** for expressive messaging
- **File preview** for images and documents

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Lucide React** - Icon library
- **GSAP** - Animations
- **React Hot Toast** - Notifications

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Express** - WebSocket server
- **Socket.IO** - Real-time bidirectional communication
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Primary database
- **Prisma Accelerate** - Database connection pooling

### Services & APIs
- **Cloudinary** - File storage and CDN
- **Brevo** - Email service for OTP delivery
- **ZegoCloud** - Video/audio calling infrastructure

### Security & Validation
- **jsonwebtoken** - JWT token generation and verification
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **crypto** (Node.js) - AES-256-CBC encryption

## Getting Started

### Prerequisites
- Node.js 20+ or Bun
- PostgreSQL database
- Cloudinary account
- Brevo account (for email)
- ZegoCloud account (for video calls)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RAJIV81205/ping.git
cd ping
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:
- `DATABASE_URL` - Prisma Accelerate connection string
- `ENCRYPTION_KEY` - 256-bit hex key (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `JWT_SECRET` - Random secret for JWT signing
- `CLOUDINARY_*` - Cloudinary credentials
- `BREVO_*` - Brevo email service credentials
- `NEXT_PUBLIC_ZEGO_APP_ID` & `ZEGO_SERVER_SECRET` - ZegoCloud credentials
- `FRONTEND_URL` - Your app URL (for CORS)
- `NEXT_PUBLIC_WEBSOCKET_URL` - WebSocket server URL

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate deploy
```

5. Run the development servers:
```bash
# Run both Next.js and WebSocket server
npm run dev:all

# Or run separately:
npm run dev          # Next.js (port 3000)
npm run websocket    # WebSocket server (port 3001)
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ping/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── (dashboard)/     # Protected dashboard APIs
│   │   │   ├── chats/       # Chat management
│   │   │   ├── conversations/ # Conversation APIs
│   │   │   └── messages/    # Message handling
│   │   ├── users/           # User management
│   │   └── files/           # File serving
│   ├── auth/                # Auth pages (login/register)
│   ├── dashboard/           # Main app interface
│   └── generated/           # Prisma generated client
├── components/              # React components
│   ├── Auth/               # Login/signup forms
│   ├── Dashboard/          # Chat interface & settings
│   ├── Calls/              # Video call components
│   └── Landing/            # Landing page
├── lib/                    # Utilities and services
│   ├── db/                 # Database client & services
│   ├── hooks/              # Custom React hooks
│   ├── middleware/         # Auth middleware
│   ├── utils/              # Helper functions
│   ├── validators/         # Zod schemas
│   ├── encryption.ts       # Encryption utilities
│   ├── cloudinary.ts       # File upload service
│   └── email.ts            # Email service
├── prisma/                 # Database schema & migrations
├── server/                 # WebSocket server
│   └── index.ts           # Socket.IO server
└── public/                # Static assets
```

## Database Schema

The application uses PostgreSQL with the following main models:

- **User** - User accounts with authentication
- **Conversation** - Chat containers (private/group)
- **ConversationMember** - User-conversation relationships
- **Message** - Encrypted messages with type support
- **MessageFile** - Encrypted file attachments
- **ReadReceipt** - Message read tracking
- **EmailOTP** - Email verification codes

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/verify-otp` - Verify email OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/socket-token` - Get WebSocket token

### Users
- `GET /api/users/[username]` - Get user by username
- `GET /api/users/by-id/[userId]` - Get user by ID
- `GET /api/users/search` - Search users
- `PUT /api/users/[username]/avatar` - Update avatar
- `GET /api/users/online-status` - Check online status

### Conversations
- `GET /api/conversations` - List user conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/[id]/online-users` - Get online members

### Messages
- `GET /api/chats/[id]/messages` - Get conversation messages
- `POST /api/messages` - Send message
- `POST /api/messages/upload` - Upload file
- `PUT /api/messages/[id]` - Update message
- `DELETE /api/messages/[id]` - Delete message

## WebSocket Events

### Client → Server
- `send_message` - Send new message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_message_read` - Mark message as read
- `incoming_call` - Initiate call
- `call_accepted` - Accept incoming call
- `call_rejected` - Reject incoming call
- `call_ended` - End active call

### Server → Client
- `new_message` - New message received
- `message_read` - Message read by recipient
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing
- `user_online` - User came online
- `user_offline` - User went offline
- `online_users` - List of online users
- `incoming_call` - Incoming call notification
- `call_accepted` - Call was accepted
- `call_rejected` - Call was rejected
- `call_ended` - Call ended
- `call_failed` - Call failed

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run websocket    # Start WebSocket server
npm run dev:all      # Start both servers concurrently
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run studio       # Open Prisma Studio
```

## Deployment

### Vercel (Frontend)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### WebSocket Server
Deploy the WebSocket server separately (Railway, Render, or any Node.js hosting):
1. Set `WEBSOCKET_PORT` environment variable
2. Run `npm run websocket`
3. Update `NEXT_PUBLIC_WEBSOCKET_URL` in frontend

### Database
Use a managed PostgreSQL service:
- Vercel Postgres
- Supabase
- Railway
- Neon

Enable Prisma Accelerate for connection pooling and caching.

## Security Considerations

- All messages are encrypted at rest using AES-256-CBC
- File URLs are encrypted before storage
- JWT tokens expire and require refresh
- CORS is configured for production domains
- Environment variables must be kept secure
- Use HTTPS in production
- WebSocket connections are authenticated

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and modern web technologies.
