const express = require('express');
const { prisma, redis } = require('../config/database');

const router = express.Router();

// 获取公开配置（无需认证）
router.get('/public', async (req, res) => {
    try {
        // 尝试从Redis缓存获取
        const cacheKey = 'config:public';
        const cached = await redis.get(cacheKey);

        if (cached) {
            console.log('📦 从缓存返回配置');
            return res.json(JSON.parse(cached));
        }

        console.log('🔍 从数据库查询配置');

        // 从数据库获取公开配置
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: {
                    in: ['customer_hotline', 'work_hours', 'platform_name']
                }
            }
        });

        // 转换为键值对
        const result = {};
        configs.forEach(config => {
            result[config.key] = config.value;
        });

        // 设置默认值
        if (!result.customer_hotline) {
            result.customer_hotline = '400-123-4567';
        }
        if (!result.work_hours) {
            result.work_hours = '9:00-18:00';
        }
        if (!result.platform_name) {
            result.platform_name = '家教平台';
        }

        console.log('📞 返回配置:', result);

        const response = { success: true, data: result };

        // 缓存5分钟
        await redis.setex(cacheKey, 300, JSON.stringify(response));

        res.json(response);
    } catch (error) {
        console.error('获取配置错误:', error);
        res.status(500).json({ error: '获取配置失败' });
    }
});

module.exports = router;
