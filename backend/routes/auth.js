const express = require('express');
const { prisma } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const wechatUtils = require('../utils/wechat');

const router = express.Router();

// 微信登录
router.post('/wechat-login', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: '缺少微信登录码' });
    }

    // 获取微信会话信息
    const { openid } = await wechatUtils.getSession(code);

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { openid }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          openid,
          nickname: `用户${Date.now()}`,
        }
      });
    }

    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      openid: user.openid,
      type: 'user'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('微信登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 更新手机号
router.post('/update-phone', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '缺少手机号' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
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