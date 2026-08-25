import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import os from 'node:os';

function getLocalNetworkIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return process.env.HOST || 'localhost';
}

const dev = process.env.NODE_ENV !== 'production';
const networkIp = getLocalNetworkIp();
const port = Number.parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname: '0.0.0.0', port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (!req.url) throw new Error('No url on request');
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    destroyUpgrade: false,
  });

  const upgradeHandler = app.getUpgradeHandler();
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/_next/')) {
      upgradeHandler(req, socket, head);
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_restaurant', (restaurantId: string) => {
      console.log(`Socket ${socket.id} joined restaurant room: ${restaurantId}`);
      socket.join(`restaurant:${restaurantId}`);
    });

    socket.on('join_super_admin', () => {
      console.log(`Socket ${socket.id} joined super_admin room`);
      socket.join('super_admin');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Make io available globally so API routes can use it if needed
  // @ts-expect-error - attach io to global
  global.io = io;

  server.listen(port, '0.0.0.0', () => {
    console.log('\n=====================================================');
    console.log('🚀 RESTAURANT MANAGEMENT SYSTEM LIVE & READY');
    console.log(`  - Local:   http://localhost:${port}`);
    console.log(`  - Network: http://${networkIp}:${port}`);
    console.log('=====================================================\n');
  });
});
