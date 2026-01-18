import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pino from 'pino';
import http from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import healthRouter from './routes/health.js';
import chatRouter from './routes/chat.js';
import { handleChatConnection } from './realtime/chatHandler.js';

const app = express();
const logger = pino();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('views', 'views');
app.set('view engine', 'ejs');

// Routes
app.use('/healthz', healthRouter);
app.use('/', chatRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 8010;
const server = http.createServer(app);

// WebSocket server for chat
const chatWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = parse(request.url || '');

  if (pathname === '/ws/chat') {
    chatWss.handleUpgrade(request, socket, head, (ws) => {
      chatWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

chatWss.on('connection', handleChatConnection);

server.listen(port, () => {
  logger.info(`Sell Me a Pen - Sales Training App running on :${port}`);
  logger.info(`Chat interface: http://localhost:${port}/`);
});
