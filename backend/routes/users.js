const express = require('express');
const { prisma } = require('../config/database');
const { authMiddleware } = require('../utils/jwt');

const router = express.Router();

// 获取用户信息
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        openid: false, // 不返回敏感性信息
        nickname: true,
        avatarUrl: true,
        phone: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nickname, avatarUrl } = req.body;

    const updateData = {};
    if (nickname) updateData.nickname = nickname;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        phone: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

// 更新手机号
router.put('/phone', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }

    // 简单的手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { phone },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        phone: true
      }
    });

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('更新手机号错误:', error);
    res.status(500).json({ error: '更新手机号失败' });
  }
});

module.exports = router;