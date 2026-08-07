const express = require('express');
const router = express.Router();

const users = [
  {
    id: 1,
    email: 'admin@hrms.com',
    password: 'password123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: 2,
    email: 'employee@hrms.com',
    password: 'password123',
    name: 'Employee User',
    role: 'employee'
  }
];

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: { code: 'VALIDATION_FAILED', message: 'Email and password are required' }
    });
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password' }
    });
  }

  res.json({
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: 'fake-jwt-token-12345'
    },
    meta: { message: 'Login successful' }
  });
});

module.exports = router;