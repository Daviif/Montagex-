require('dotenv').config();

const http = require('http');
const app = require('./app');
const setupWebSocket = require('./config/websocket');
const { initRedis } = require('./config/redis');
const { sequelize } = require('./models');

const port = Number(process.env.PORT) || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Banco de dados conectado com sucesso');
  } catch (err) {
    console.error('Falha ao conectar no banco de dados:', err.message);
    process.exit(1);
  }

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
};

startServer();
