require('dotenv').config();

const http = require('http');
const app = require('./app');
const setupWebSocket = require('./config/websocket');
const { initRedis } = require('./config/redis');

const port = Number(process.env.PORT) || 3000;

// Criar servidor HTTP para suportar WebSocket
const server = http.createServer(app);

// Inicializar Redis
initRedis().catch((err) => {
  console.error('Redis não disponível:', err);
});

// Configurar Socket.io
const io = setupWebSocket(server);

// Exportar io para uso em outras partes da aplicação
app.set('io', io);

server.listen(port, () => {
  console.log(`API running on port ${port}`);
  console.log(`WebSocket disponível em ws://localhost:${port}`);
});
