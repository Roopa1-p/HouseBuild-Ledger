const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    vendor TEXT,
    amount REAL NOT NULL,
    status TEXT NOT NULL
  )`);
});

// Get all expenses
app.get('/api/expenses', (req, res) => {
  db.all('SELECT * FROM expenses', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      res.json(rows);
    }
  });
});

// Add a new expense
app.post('/api/expenses', (req, res) => {
  const { date, category, description, vendor, amount, status } = req.body;
  const sql = `INSERT INTO expenses (date, category, description, vendor, amount, status)
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [date, category, description, vendor, amount, status], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      res.json({ id: this.lastID });
    }
  });
});

// Update an expense
app.put('/api/expenses/:id', (req, res) => {
  const { date, category, description, vendor, amount, status } = req.body;
  const sql = `UPDATE expenses
               SET date = ?, category = ?, description = ?, vendor = ?, amount = ?, status = ?
               WHERE id = ?`;
  db.run(sql, [date, category, description, vendor, amount, status, req.params.id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      res.sendStatus(200);
    }
  });
});

// Delete an expense
app.delete('/api/expenses/:id', (req, res) => {
  const sql = `DELETE FROM expenses WHERE id = ?`;
  db.run(sql, [req.params.id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      res.sendStatus(200);
    }
  });
});

// Bulk import expenses from CSV
app.post('/api/expenses/import', upload.single('file'), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const sql = `INSERT INTO expenses (date, category, description, vendor, amount, status)
                   VALUES (?, ?, ?, ?, ?, ?)`;
      results.forEach((row) => {
        db.run(sql, [row.date, row.category, row.description, row.vendor, row.amount, row.status]);
      });
      fs.unlinkSync(req.file.path);
      res.sendStatus(200);
    });
});

// Backup expenses to JSON
app.get('/api/expenses/backup', (req, res) => {
  db.all('SELECT * FROM expenses', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      res.json(rows);
    }
  });
});

// Restore expenses from JSON
app.post('/api/expenses/restore', (req, res) => {
  const expenses = req.body;
  const sql = `INSERT INTO expenses (date, category, description, vendor, amount, status)
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.serialize(() => {
    db.run('DELETE FROM expenses');
    expenses.forEach((expense) => {
      db.run(sql, [expense.date, expense.category, expense.description, expense.vendor, expense.amount, expense.status]);
    });
  });
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
