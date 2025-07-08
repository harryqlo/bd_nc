const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Predefined users with bcrypt hashed passwords
const users = [
  {
    id: '1',
    username: 'admin',
    role: 'Administrador del Sistema',
    passwordHash: '$2b$12$1Y8JVWp3W3MIK4iR7rmytOvvRWbG0/V7TjStJ8ENwzNNbW3fqoH.W'
  },
  {
    id: '2',
    username: 'gestor',
    role: 'Gestor de Bodega',
    passwordHash: '$2b$12$SK/Sg3LNfxHBuTqE.8RMbut1/gTwfu..gVnYA/biOnbamKeR0nQ/O'
  },
  {
    id: '3',
    username: 'operador',
    role: 'Operador de Bodega',
    passwordHash: '$2b$12$JCjKx.2/FzYpUMZqIe2HqeA3GXlGzNqOubQ4VVG0/LB/TeD9ANeLy'
  }
];

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.user = decoded;
    next();
  });
}

app.get('/api/validate', authenticate, (req, res) => {
  res.json({ valid: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const documentRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');

const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
