import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket | null {
  if (typeof window === 'undefined') return null;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  // Always create new socket if not exists or disconnected
  if (!socket || socket.disconnected) {
    console.log('[Socket.IO] Creating new socket connection to:', apiUrl);
    
    socket = io(apiUrl, {
      auth: {
        token: token
      },
      // Also send token in query as fallback (backend checks both)
      query: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false // Reuse connection if available
    });
    
    socket.on('connect', () => {
      console.log('[Socket.IO] ✅✅✅ Connected to server!');
      console.log('[Socket.IO] Socket ID:', socket?.id);
      console.log('[Socket.IO] Ready to receive events!');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] ❌ Disconnected from server, reason:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] ❌ Connection error:', error.message);
      console.error('[Socket.IO] Error details:', {
        message: error.message,
        description: (error as any).description,
        type: (error as any).type,
        stack: (error as any).stack
      });
    });
    
    socket.on('error', (error: any) => {
      console.error('[Socket.IO] ❌ Socket error:', error);
    });
    
    // Listen to ALL events for debugging
    socket.onAny((eventName: string, ...args: any[]) => {
      console.log(`[Socket.IO] 📡📡📡 Event received: ${eventName}`, args);
      if (eventName === 'whatsapp:qr') {
        console.log('[Socket.IO] 🎯🎯🎯 QR CODE EVENT!', args[0]);
      }
    });
  } else {
    console.log('[Socket.IO] Using existing socket connection, ID:', socket.id, 'Connected:', socket.connected);
  }
  
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket.IO] 🔌 Socket disconnected');
  }
}

