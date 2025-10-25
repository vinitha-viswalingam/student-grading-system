const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'students.json');

// helper to load/save data (synchronous for simplicity)
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(DATA_FILE)) saveData([]);

// Routes

// List students
app.get('/students', (req, res) => {
  const students = loadData();
  res.json(students);
});

// Get student by id
app.get('/students/:id', (req, res) => {
  const students = loadData();
  const s = students.find(st => st.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  res.json(s);
});

// Create student
app.post('/students', (req, res) => {
  const { name, grades } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const students = loadData();
  const newStudent = { id: uuidv4(), name, grades: Array.isArray(grades) ? grades : [] };
  students.push(newStudent);
  saveData(students);
  res.status(201).json(newStudent);
});

// Update student
app.put('/students/:id', (req, res) => {
  const { name, grades } = req.body;
  const students = loadData();
  const idx = students.findIndex(st => st.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Student not found' });
  if (name !== undefined) students[idx].name = name;
  if (grades !== undefined) students[idx].grades = Array.isArray(grades) ? grades : students[idx].grades;
  saveData(students);
  res.json(students[idx]);
});

// Delete student
app.delete('/students/:id', (req, res) => {
  let students = loadData();
  const originalLen = students.length;
  students = students.filter(st => st.id !== req.params.id);
  if (students.length === originalLen) return res.status(404).json({ error: 'Student not found' });
  saveData(students);
  res.status(204).send();
});

// Student average
app.get('/students/:id/average', (req, res) => {
  const students = loadData();
  const s = students.find(st => st.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const grades = s.grades || [];
  if (grades.length === 0) return res.json({ average: null });
  const avg = grades.reduce((a,b)=>a+b,0) / grades.length;
  res.json({ average });
});

// Class average
app.get('/grades/average', (req, res) => {
  const students = loadData();
  const allGrades = students.flatMap(s => s.grades || []);
  if (allGrades.length === 0) return res.json({ average: null });
  const avg = allGrades.reduce((a,b)=>a+b,0) / allGrades.length;
  res.json({ average: avg });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Student Grading System running on http://localhost:${PORT}`);
});
