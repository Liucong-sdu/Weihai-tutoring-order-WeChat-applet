const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initSystemConfig() {
    try {
        console.log('开始初始化系统配置...');

        // 客服热线
        await prisma.systemConfig.upsert({
            where: { key: 'customer_hotline' },
            update: {},
            create: {
                key: 'customer_hotline',
                value: '400-123-4567',
                description: '客服热线电话'
            }
        });

        // 工作时间
        await prisma.systemConfig.upsert({
            where: { key: 'work_hours' },
            update: {},
            create: {
                key: 'work_hours',
                value: '9:00-18:00',
                description: '工作时间'
            }
        });

        // 平台名称
        await prisma.systemConfig.upsert({
            where: { key: 'platform_name' },
            update: {},
            create: {
                key: 'platform_name',
                value: '家教平台',
                description: '平台名称'
            }
        });

        console.log('✅ 系统配置初始化完成！');
    } catch (error) {
        console.error('❌ 初始化系统配置失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

initSystemConfig();
