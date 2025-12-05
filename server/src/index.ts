import express from 'express';
import cors from 'cors';
import applicationsRouter from './routes/applications.js';

const app = express();
const PORT = 4000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use('/api/applications', applicationsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Start server
startServer();

