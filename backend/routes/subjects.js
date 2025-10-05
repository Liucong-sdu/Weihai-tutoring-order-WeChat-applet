const express = require('express');
const { prisma, redis } = require('../config/database');

const router = express.Router();

// 获取所有科目列表
router.get('/', async (req, res) => {
  try {
    // 尝试从Redis缓存获取
    const cacheKey = 'subjects:all';
    const cached = await redis.get(cacheKey);

    if (cached) {
      const subjects = JSON.parse(cached);
      return res.json({ success: true, data: subjects });
    }

    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true
      }
    });

    // 缓存结果,5分钟过期
    await redis.setex(cacheKey, 300, JSON.stringify(subjects));

    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('获取科目列表错误:', error);
    res.status(500).json({ error: '获取科目列表失败' });
  }
});

// 获取所有年级列表
router.get('/grades', async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true
      }
    });

    res.json({ success: true, data: grades });
  } catch (error) {
    console.error('获取年级列表错误:', error);
    res.status(500).json({ error: '获取年级列表失败' });
  }
});

// 管理员：添加科目
router.post('/', async (req, res) => {
  try {
    const { name, sortOrder = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: '科目名称不能为空' });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        sortOrder
      }
    });

    // 清除缓存
    await redis.del('subjects:all');

    res.json({
      success: true,
      subject
    });
  } catch (error) {
    console.error('添加科目错误:', error);
    res.status(500).json({ error: '添加科目失败' });
  }
});

// 管理员：更新科目
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, sortOrder } = req.body;

    const subject = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    });

    // 清除缓存
    await redis.del('subjects:all');

    res.json({
      success: true,
      subject
    });
  } catch (error) {
    console.error('更新科目错误:', error);
    res.status(500).json({ error: '更新科目失败' });
  }
});

// 管理员：删除科目
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否有关联的需求或价格配置
    const [demandCount, priceCount] = await Promise.all([
      prisma.demand.count({ where: { subjectId: parseInt(id) } }),
      prisma.priceSetting.count({ where: { subjectId: parseInt(id) } })
    ]);

    if (demandCount > 0 || priceCount > 0) {
      return res.status(400).json({ error: '该科目已被使用，无法删除' });
    }

    await prisma.subject.delete({
      where: { id: parseInt(id) }
    });

    // 清除缓存
    await redis.del('subjects:all');

    res.json({
      success: true,
      message: '科目删除成功'
    });
  } catch (error) {
    console.error('删除科目错误:', error);
    res.status(500).json({ error: '删除科目失败' });
  }
});

module.exports = router;