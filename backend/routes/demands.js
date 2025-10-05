const express = require('express');
const { prisma } = require('../config/database');
const { authMiddleware } = require('../utils/jwt');

const router = express.Router();

// 提交需求
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { gradeId, subjectId, locationAddress, hourlyPrice } = req.body;
    const userId = req.user.userId;

    // 验证必填字段
    if (!gradeId || !subjectId || !locationAddress || !hourlyPrice) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const demand = await prisma.demand.create({
      data: {
        userId,
        gradeId: parseInt(gradeId),
        subjectId: parseInt(subjectId),
        locationAddress,
        hourlyPrice: parseFloat(hourlyPrice),
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            nickname: true,
            phone: true
          }
        },
        grade: {
          select: {
            name: true
          }
        },
        subject: {
          select: {
            name: true
          }
        }
      }
    });

    // 通知管理员有新需求（可选）
    const io = req.app.get('io');
    io.to('admin-room').emit('new-demand', demand);

    res.json({
      success: true,
      demand
    });
  } catch (error) {
    console.error('提交需求错误:', error);
    res.status(500).json({ error: '提交需求失败' });
  }
});

// 获取我的需求列表
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
        where: { userId },
        include: {
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
      prisma.demand.count({ where: { userId } })
    ]);

    res.json({
      demands,
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

// 获取需求详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const demand = await prisma.demand.findFirst({
      where: {
        id: parseInt(id),
        userId // 确保只能查看自己的需求
      },
      include: {
        grade: {
          select: { name: true }
        },
        subject: {
          select: { name: true }
        },
        statusLogs: {
          include: {
            demand: false // 避免循环引用
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!demand) {
      return res.status(404).json({ error: '需求不存在' });
    }

    res.json(demand);
  } catch (error) {
    console.error('获取需求详情错误:', error);
    res.status(500).json({ error: '获取需求详情失败' });
  }
});

// 更新需求状态（管理员用）
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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
        operatorId: null // 如果有管理员登录，这里填管理员ID
      }
    });

    // 实时通知用户状态变更
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

module.exports = router;