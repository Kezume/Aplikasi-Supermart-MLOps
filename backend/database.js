const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');

async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

async function initDb() {
  const db = await getDb();
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      isBestSeller BOOLEAN,
      rank INTEGER
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      if_buy TEXT NOT NULL,
      recommend TEXT NOT NULL,
      support REAL NOT NULL,
      confidence REAL NOT NULL,
      lift REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Initial Products if empty
  const count = await db.get('SELECT COUNT(*) as count FROM products');
  if (count.count === 0) {
    console.log("Seeding initial products...");
    const products = [
      { id: "cereal",     name: "Cereal",     price: 24500, category: "Sarapan",          isBestSeller: 1,  rank: 1 },
      { id: "ice_cream",  name: "Ice Cream",  price: 32000, category: "Makanan Beku",     isBestSeller: 1,  rank: 2 },
      { id: "chicken",    name: "Chicken",    price: 45000, category: "Daging & Ikan",    isBestSeller: 1,  rank: 3 },
      { id: "soda",       name: "Soda",       price: 8000,  category: "Minuman",          isBestSeller: 1,  rank: 4 },
      { id: "juice",      name: "Juice",      price: 15000, category: "Minuman",          isBestSeller: 1,  rank: 5 },
      { id: "cheese",     name: "Cheese",     price: 22000, category: "Olahan Susu",      isBestSeller: 1,  rank: 6 },
      { id: "soap",       name: "Soap",       price: 6000,  category: "Perawatan Tubuh",  isBestSeller: 1,  rank: 7 },
      { id: "beans",      name: "Beans",      price: 12000, category: "Biji-bijian",      isBestSeller: 1,  rank: 8 },
      { id: "orange",     name: "Orange",     price: 28000, category: "Buah-buahan",      isBestSeller: 1,  rank: 9 },
      { id: "sausage",    name: "Sausage",    price: 35000, category: "Daging & Ikan",    isBestSeller: 1,  rank: 10 },
      { id: "apple",          name: "Apple",              price: 30000, category: "Buah-buahan",     isBestSeller: 0, rank: null },
      { id: "banana",         name: "Banana",             price: 16000, category: "Buah-buahan",     isBestSeller: 0, rank: null },
      { id: "chickpeas",      name: "Chickpeas",          price: 14500, category: "Biji-bijian",     isBestSeller: 0, rank: null },
      { id: "bread",          name: "Bread",              price: 14000, category: "Roti & Tepung",   isBestSeller: 0, rank: null },
      { id: "butter",         name: "Butter",             price: 19500, category: "Olahan Susu",     isBestSeller: 0, rank: null },
      { id: "chips",          name: "Chips",              price: 9500,  category: "Camilan",         isBestSeller: 0, rank: null },
      { id: "chocolate",      name: "Chocolate",          price: 15000, category: "Camilan",         isBestSeller: 0, rank: null },
      { id: "cola",           name: "Cola",               price: 8500,  category: "Minuman",         isBestSeller: 0, rank: null },
      { id: "cookie",         name: "Cookie",             price: 12500, category: "Camilan",         isBestSeller: 0, rank: null },
      { id: "cracker",        name: "Cracker",            price: 10000, category: "Camilan",         isBestSeller: 0, rank: null },
      { id: "cucumber",       name: "Cucumber",           price: 7000,  category: "Sayuran",         isBestSeller: 0, rank: null },
      { id: "detergent",      name: "Detergent",          price: 26000, category: "Kebutuhan Rumah", isBestSeller: 0, rank: null },
      { id: "dish_sponge",    name: "Dish Sponge",        price: 4500,  category: "Kebutuhan Rumah", isBestSeller: 0, rank: null },
      { id: "dumpling",       name: "Dumpling",           price: 28000, category: "Makanan Beku",    isBestSeller: 0, rank: null },
      { id: "egg",            name: "Egg",                price: 21000, category: "Olahan Susu",     isBestSeller: 0, rank: null },
      { id: "fish",           name: "Fish",               price: 38000, category: "Daging & Ikan",   isBestSeller: 0, rank: null },
      { id: "flatbread_meat", name: "Flatbread With Meat",price: 25000, category: "Roti & Tepung",   isBestSeller: 0, rank: null },
      { id: "honey",          name: "Honey",              price: 48000, category: "Sarapan",         isBestSeller: 0, rank: null },
      { id: "lentil",         name: "Lentil",             price: 13000, category: "Biji-bijian",     isBestSeller: 0, rank: null },
      { id: "milk",           name: "Milk",               price: 18000, category: "Olahan Susu",     isBestSeller: 0, rank: null },
      { id: "minced_meat",    name: "Minced Meat",        price: 52000, category: "Daging & Ikan",   isBestSeller: 0, rank: null },
      { id: "onion",          name: "Onion",              price: 9000,  category: "Sayuran",         isBestSeller: 0, rank: null },
      { id: "pizza",          name: "Pizza",              price: 65000, category: "Makanan Beku",    isBestSeller: 0, rank: null },
      { id: "potato",         name: "Potato",             price: 11000, category: "Sayuran",         isBestSeller: 0, rank: null },
      { id: "rice",           name: "Rice",               price: 14000, category: "Biji-bijian",     isBestSeller: 0, rank: null },
      { id: "shampoo",        name: "Shampoo",            price: 24000, category: "Perawatan Tubuh", isBestSeller: 0, rank: null },
      { id: "strawberry",     name: "Strawberry",         price: 35000, category: "Buah-buahan",     isBestSeller: 0, rank: null },
      { id: "tomato",         name: "Tomato",             price: 12000, category: "Sayuran",         isBestSeller: 0, rank: null },
      { id: "water",          name: "Water",              price: 5000,  category: "Minuman",         isBestSeller: 0, rank: null },
      { id: "yogurt",         name: "Yogurt",             price: 10500, category: "Olahan Susu",     isBestSeller: 0, rank: null },
    ];

    const stmt = await db.prepare('INSERT INTO products (id, name, price, category, isBestSeller, rank) VALUES (?, ?, ?, ?, ?, ?)');
    for (const p of products) {
      await stmt.run([p.id, p.name, p.price, p.category, p.isBestSeller, p.rank]);
    }
    await stmt.finalize();
    console.log("Seeding products complete.");
  }

  // Seed initial rules from output/rules_api.json if rules table is empty
  const rulesCount = await db.get('SELECT COUNT(*) as count FROM rules');
  if (rulesCount.count === 0) {
    try {
      const rulesJsonPath = path.join(__dirname, '..', 'output', 'rules_api.json');
      if (fs.existsSync(rulesJsonPath)) {
        console.log("Seeding initial rules from existing JSON...");
        const rulesData = JSON.parse(fs.readFileSync(rulesJsonPath, 'utf8'));
        const stmt = await db.prepare('INSERT INTO rules (if_buy, recommend, support, confidence, lift) VALUES (?, ?, ?, ?, ?)');
        for (const r of rulesData) {
          // Store arrays as comma separated strings
          const ifBuyStr = r.if_buy.join(',');
          const recStr = r.recommend.join(',');
          await stmt.run([ifBuyStr, recStr, r.support, r.confidence, r.lift]);
        }
        await stmt.finalize();
        console.log("Seeding rules complete.");
      }
    } catch (e) {
      console.log("Could not seed rules:", e.message);
    }
  }

  // Seed a few dummy transactions so model doesn't fail if we retrain right away
  const txCount = await db.get('SELECT COUNT(*) as count FROM transactions');
  if (txCount.count === 0) {
    console.log("Seeding a few dummy transactions...");
    const stmt = await db.prepare('INSERT INTO transactions (transaction_id, product_name) VALUES (?, ?)');
    await stmt.run(['TX-10001', 'Milk']);
    await stmt.run(['TX-10001', 'Bread']);
    await stmt.run(['TX-10001', 'Apple']);
    await stmt.run(['TX-10002', 'Cereal']);
    await stmt.run(['TX-10002', 'Milk']);
    await stmt.run(['TX-10003', 'Soap']);
    await stmt.run(['TX-10003', 'Shampoo']);
    await stmt.finalize();
  }

  return db;
}

module.exports = {
  getDb,
  initDb
};
