const express = require('express');
const path = require('path');

const metaRoutes = require('./routes/meta');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/meta', metaRoutes);
app.use('/api/config', configRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Lead Tracker running on http://localhost:${PORT}`);
});
