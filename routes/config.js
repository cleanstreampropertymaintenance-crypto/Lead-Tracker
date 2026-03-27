const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'default-rules.json');

router.get('/', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read config: ' + err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const current = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const updated = { ...current, ...req.body };

    // Validate critical fields
    if (typeof updated.targetCPL !== 'number' || updated.targetCPL <= 0) {
      return res.status(400).json({ error: 'targetCPL must be a positive number' });
    }
    if (typeof updated.autoOptimize !== 'boolean') {
      return res.status(400).json({ error: 'autoOptimize must be a boolean' });
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config: ' + err.message });
  }
});

module.exports = router;
