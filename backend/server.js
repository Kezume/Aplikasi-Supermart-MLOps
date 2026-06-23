const express = require('express');
const cors = require('cors');
const { initDb, getDb } = require('./database');
const { exec } = require('child_process');
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

// Initialize Database on startup
initDb().then(() => {
  console.log("Database initialized successfully.");
}).catch(console.error);

// Penjadwalan Otomatis (Cron Job)
// Berjalan otomatis setiap hari pada jam 00:00 (Tengah Malam)
cron.schedule('0 0 * * *', () => {
  console.log('[CRON] Menjalankan pembaruan model otomatis pada tengah malam...');
  const pythonScript = path.join(__dirname, '..', 'analysis_crisp_dm.py');
  
  exec(`python "${pythonScript}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[CRON] Error during automatic model retrain: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`[CRON] Model retrain stderr: ${stderr}`);
    }
    console.log(`[CRON] Update model otomatis berhasil diselesaikan: ${stdout}`);
  });
});

// ---------------------------------------------------------
// GET /api/products
// Fetch product catalog
// ---------------------------------------------------------
app.get('/api/products', async (req, res) => {
  try {
    const db = await getDb();
    const products = await db.all('SELECT * FROM products');
    // convert boolean back
    products.forEach(p => p.isBestSeller = !!p.isBestSeller);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// GET /api/rules
// Fetch current association rules
// ---------------------------------------------------------
app.get('/api/rules', async (req, res) => {
  try {
    const db = await getDb();
    const rules = await db.all('SELECT * FROM rules');
    
    // Map string fields back to arrays
    const formattedRules = rules.map(r => ({
      if_buy: r.if_buy.split(','),
      recommend: r.recommend.split(','),
      support: r.support,
      confidence: r.confidence,
      lift: r.lift
    }));

    res.json(formattedRules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// POST /api/checkout
// Record a new transaction
// ---------------------------------------------------------
app.post('/api/checkout', async (req, res) => {
  try {
    const { cartItems } = req.body;
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    // Generate unique transaction ID
    const txId = 'TX-' + Date.now();
    
    const db = await getDb();
    const stmt = await db.prepare('INSERT INTO transactions (transaction_id, product_name) VALUES (?, ?)');
    
    for (const item of cartItems) {
      await stmt.run([txId, item.product_name]);
    }
    await stmt.finalize();

    res.json({ message: "Transaction saved successfully", transaction_id: txId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// POST /api/retrain
// Automatically trigger the Python script to run Apriori
// ---------------------------------------------------------
app.post('/api/retrain', async (req, res) => {
  console.log("Triggering Apriori retraining model...");
  
  // Note: Windows uses 'python', Mac/Linux often 'python3'
  // The cwd will be the Model folder
  const pythonScript = path.join(__dirname, '..', 'analysis_crisp_dm.py');
  const cwd = path.join(__dirname, '..');

  exec(`python "${pythonScript}"`, { cwd }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing python script: ${error.message}`);
      return res.status(500).json({ error: "Failed to retrain model", details: error.message });
    }
    
    console.log(`Python stdout: ${stdout}`);
    if (stderr) console.error(`Python stderr: ${stderr}`);

    res.json({ 
      message: "Model retrained successfully and rules updated in Database",
      logs: stdout
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
