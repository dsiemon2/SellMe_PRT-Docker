import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pino from 'pino';
import adminRouter from './routes/admin.js';

const app = express();
const logger = pino();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('views', 'views');
app.set('view engine', 'ejs');

// Admin routes
app.use('/admin', adminRouter);

// Redirect root to admin
app.get('/', (req, res) => {
  const token = process.env.ADMIN_TOKEN || 'admin';
  res.redirect(`/admin?token=${token}`);
});

const port = process.env.ADMIN_PORT ? Number(process.env.ADMIN_PORT) : 8011;

app.listen(port, () => {
  logger.info(`Sell Me a Pen - Admin Panel running on :${port}`);
  logger.info(`Admin URL: http://localhost:${port}/admin?token=${process.env.ADMIN_TOKEN || 'admin'}`);
});
