const express = require('express');
const router = express.Router();

const AuthController = {
  login: async (req, res) => {
    const { email, password, orgId } = req.body;
    
    if (!email || !password || !orgId) {
      return res.status(400).json({
        success: false,
        error: 'Email, password and organization ID are required'
      });
    }

    if (email === 'admin@sunrise.edu' && password === 'Admin@123' && parseInt(orgId) === 1) {
      return res.json({
        success: true,
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsIm9yZ0lkIjoxLCJlbWFpbCI6ImFkbWluQHN1bnJpc2UuZWR1Iiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzEwNjQzMjAwLCJleHAiOjE3MTEyNDgwMDB9.mock',
          user: {
            id: 1,
            email: 'admin@sunrise.edu',
            firstName: 'Admin',
            lastName: 'User',
            role: 'super_admin',
            organization: 'Sunrise Public School'
          }
        }
      });
    }
    if (email === 'staff@sunrise.edu' && password === 'Staff@123' && parseInt(orgId) === 1) {
      return res.json({
        success: true,
        data: {
          token: 'mock-jwt-token-staff',
          user: {
            id: 2,
            email: 'staff@sunrise.edu',
            firstName: 'Staff',
            lastName: 'User',
            role: 'staff',
            organization: 'Sunrise Public School'
          }
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Please check your email and password.'
    });
  },
  
  getProfile: async (req, res) => {
    res.json({
      success: true,
      data: {
        id: 1,
        email: 'admin@sunrise.edu',
        firstName: 'Admin',
        lastName: 'User',
        role: 'super_admin',
        organization: 'Sunrise Public School'
      }
    });
  },
  
  updateProfile: async (req, res) => {
    const { firstName, lastName } = req.body;
    res.json({
      success: true,
      data: {
        id: 1,
        firstName: firstName || 'Admin',
        lastName: lastName || 'User',
        updated: true
      }
    });
  },
  
  logout: async (req, res) => {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

router.post('/login', AuthController.login.bind(AuthController));
router.get('/profile', AuthController.getProfile.bind(AuthController));
router.put('/profile', AuthController.updateProfile.bind(AuthController));
router.post('/logout', AuthController.logout.bind(AuthController));

module.exports = router;