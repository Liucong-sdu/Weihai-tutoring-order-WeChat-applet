const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

const adminAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.type !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }

    // 验证管理员是否仍然存在且激活
    const { prisma } = require('../config/database');
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, isActive: true }
    });

    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: '管理员账户已被禁用' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  adminAuthMiddleware
};