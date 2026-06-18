const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initialize } = require('./db/init');
const productRoutes = require('./routes/products');
const touristRoutes = require('./routes/tourists');
const operationRoutes = require('./routes/operations');
const financeRoutes = require('./routes/finance');
const noticeRoutes = require('./routes/notices');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '旅行社平台API运行正常' });
});

app.use('/api/products', productRoutes);
app.use('/api/tourists', touristRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/notices', noticeRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

async function start() {
  try {
    await initialize();
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('启动失败，请检查数据库配置:', err.message);
    process.exit(1);
  }
}

start();
