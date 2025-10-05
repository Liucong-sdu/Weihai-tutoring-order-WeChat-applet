const express = require('express');
const { prisma, redis } = require('../config/database');

const router = express.Router();

// 获取年级列表
router.get('/grades', async (req, res) => {
  try {
    const cacheKey = 'grades:all';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const grades = await prisma.grade.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    await redis.setex(cacheKey, 3600, JSON.stringify(grades));

    res.json(grades);
  } catch (error) {
    console.error('获取年级列表错误:', error);
    res.status(500).json({ error: '获取年级列表失败' });
  }
});

// 获取价格配置
router.get('/config/:gradeId/:subjectId', async (req, res) => {
  try {
    const { gradeId, subjectId } = req.params;

    const priceSetting = await prisma.priceSetting.findUnique({
      where: {
        gradeId_subjectId: {
          gradeId: parseInt(gradeId),
          subjectId: parseInt(subjectId)
        }
      },
      select: {
        hourlyPrice: true
      }
    });

    res.json({
      hourlyPrice: priceSetting?.hourlyPrice || 0
    });
  } catch (error) {
    console.error('获取价格配置错误:', error);
    res.status(500).json({ error: '获取价格配置失败' });
  }
});

// 获取所有价格配置（管理后台用）
router.get('/config', async (req, res) => {
  try {
    const priceSettings = await prisma.priceSetting.findMany({
      include: {
        grade: {
          select: { id: true, name: true }
        },
        subject: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { grade: { sortOrder: 'asc' } },
        { subject: { sortOrder: 'asc' } }
      ]
    });

    res.json(priceSettings);
  } catch (error) {
    console.error('获取价格配置列表错误:', error);
    res.status(500).json({ error: '获取价格配置列表失败' });
  }
});

// 更新价格配置
router.put('/config', async (req, res) => {
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
          hourlyPrice: setting.hourlyPrice
        },
        create: {
          gradeId: setting.gradeId,
          subjectId: setting.subjectId,
          hourlyPrice: setting.hourlyPrice
        }
      })
    );

    await prisma.$transaction(updateOperations);

    // 清除相关缓存
    await redis.flushdb();

    res.json({
      success: true,
      message: '价格配置更新成功'
    });
  } catch (error) {
    console.error('更新价格配置错误:', error);
    res.status(500).json({ error: '更新价格配置失败' });
  }
});

module.exports = router;