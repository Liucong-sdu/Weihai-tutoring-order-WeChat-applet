const express = require('express');
const { prisma, redis } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

const router = express.Router();

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin || !await bcrypt.compare(password, admin.passwordHash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: '账户已被禁用' });
    }

    const token = generateToken({
      userId: admin.id,
      username: admin.username,
      type: 'admin'
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    const [totalDemands, pendingDemands, matchedDemands, totalUsers] = await Promise.all([
      prisma.demand.count(),
      prisma.demand.count({ where: { status: 'PENDING' } }),
      prisma.demand.count({ where: { status: 'MATCHED' } }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalDemands,
        pendingDemands,
        matchedDemands,
        totalUsers,
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 获取需求列表
router.get('/demands', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { user: { phone: { contains: search } } },
        { user: { nickname: { contains: search } } },
        { locationAddress: { contains: search } },
        { grade: { name: { contains: search } } },
        { subject: { name: { contains: search } } }
      ];
    }

    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              nickname: true,
              avatarUrl: true
            }
          },
          grade: {
            select: { name: true }
          },
          subject: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.demand.count({ where })
    ]);

    res.json({
      success: true,
      data: demands,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取需求列表错误:', error);
    res.status(500).json({ error: '获取需求列表失败' });
  }
});

// 更新需求状态
router.put('/demands/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    if (!['PENDING', 'FOLLOWING_UP', 'MATCHED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    const demand = await prisma.demand.findUnique({
      where: { id: parseInt(id) }
    });

    if (!demand) {
      return res.status(404).json({ error: '需求不存在' });
    }

    const oldStatus = demand.status;

    await prisma.demand.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // 记录状态变更日志
    await prisma.demandStatusLog.create({
      data: {
        demandId: parseInt(id),
        oldStatus,
        newStatus: status,
        operatorId: null, // 实际应用中应该从JWT获取管理员ID
        remark: remark || ''
      }
    });

    // 实时通知用户
    const io = req.app.get('io');
    io.to(`user-${demand.userId}`).emit('demand-status-update', {
      demandId: parseInt(id),
      oldStatus,
      newStatus: status
    });

    res.json({
      success: true,
      message: '状态更新成功'
    });
  } catch (error) {
    console.error('更新需求状态错误:', error);
    res.status(500).json({ error: '更新需求状态失败' });
  }
});

// 获取价格配置管理
router.get('/price-config', async (req, res) => {
  try {
    const [grades, subjects, priceSettings] = await Promise.all([
      prisma.grade.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.priceSetting.findMany({
        include: {
          grade: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } }
        }
      })
    ]);

    // 构建价格配置矩阵
    const priceMatrix = {};
    grades.forEach(grade => {
      priceMatrix[grade.id] = {
        gradeName: grade.name,
        prices: {}
      };
      subjects.forEach(subject => {
        const priceSet = priceSettings.find(
          ps => ps.gradeId === grade.id && ps.subjectId === subject.id
        );
        priceMatrix[grade.id].prices[subject.id] = {
          subjectName: subject.name,
          hourlyPrice: priceSet?.hourlyPrice || 0
        };
      });
    });

    res.json({
      success: true,
      data: priceSettings
    });
  } catch (error) {
    console.error('获取价格配置错误:', error);
    res.status(500).json({ error: '获取价格配置失败' });
  }
});

// 批量更新价格配置
router.put('/price-config', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: '配置格式错误' });
    }

    const updateOperations = settings.map(setting =>
      prisma.priceSetting.upsert({
        where: {
          gradeId_subjectId: {
            gradeId: setting.gradeId,
            subjectId: setting.subjectId
          }
        },
        update: {
          hourlyPrice: parseFloat(setting.hourlyPrice),
          updatedBy: null // 实际应用中应该从JWT获取管理员ID
        },
        create: {
          gradeId: setting.gradeId,
          subjectId: setting.subjectId,
          hourlyPrice: parseFloat(setting.hourlyPrice)
        }
      })
    );

    await prisma.$transaction(updateOperations);

    res.json({
      success: true,
      message: '价格配置更新成功'
    });
  } catch (error) {
    console.error('更新价格配置错误:', error);
    res.status(500).json({ error: '更新价格配置失败' });
  }
});

// 创建默认管理员（仅在开发环境使用）
router.post('/create-default', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: '生产环境禁止操作' });
  }

  try {
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const admin = await prisma.admin.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        passwordHash: hashedPassword,
        name: '超级管理员'
      }
    });

    res.json({
      success: true,
      message: '默认管理员创建成功',
      admin: {
        username: admin.username,
        password: defaultPassword
      }
    });
  } catch (error) {
    console.error('创建默认管理员错误:', error);
    res.status(500).json({ error: '创建默认管理员失败' });
  }
});

// 获取用户列表
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { nickname: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
          phone: true,
          createdAt: true,
          _count: {
            select: { demands: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 获取用户详情（包括其所有需求）
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        phone: true,
        createdAt: true,
        demands: {
          include: {
            grade: { select: { name: true } },
            subject: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

// 获取系统配置
router.get('/system-config', async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' }
    });

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取系统配置错误:', error);
    res.status(500).json({ error: '获取系统配置失败' });
  }
});

// 更新系统配置
router.put('/system-config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    console.log(`更新系统配置: ${key} = ${value}`);

    if (!value) {
      return res.status(400).json({ error: '配置值不能为空' });
    }

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value,
        description: description || undefined
      },
      create: {
        key,
        value,
        description: description || null
      }
    });

    // 清除缓存
    await redis.del('config:public');
    console.log(`✅ 已更新配置 ${key} 并清除缓存`);

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('更新系统配置错误:', error);
    res.status(500).json({ error: '更新系统配置失败' });
  }
});

module.exports = router;