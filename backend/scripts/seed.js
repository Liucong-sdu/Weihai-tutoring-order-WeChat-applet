const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 创建年级数据
  const grades = await Promise.all([
    prisma.grade.create({ data: { name: '高一', sortOrder: 1 } }),
    prisma.grade.create({ data: { name: '高二', sortOrder: 2 } }),
    prisma.grade.create({ data: { name: '高三', sortOrder: 3 } }),
    prisma.grade.create({ data: { name: '其他', sortOrder: 4 } })
  ]);
  console.log('✅ 年级数据创建完成');

  // 创建科目数据
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: '数学', sortOrder: 1 } }),
    prisma.subject.create({ data: { name: '语文', sortOrder: 2 } }),
    prisma.subject.create({ data: { name: '英语', sortOrder: 3 } }),
    prisma.subject.create({ data: { name: '物理', sortOrder: 4 } }),
    prisma.subject.create({ data: { name: '化学', sortOrder: 5 } }),
    prisma.subject.create({ data: { name: '生物', sortOrder: 6 } }),
    prisma.subject.create({ data: { name: '历史', sortOrder: 7 } }),
    prisma.subject.create({ data: { name: '地理', sortOrder: 8 } }),
    prisma.subject.create({ data: { name: '政治', sortOrder: 9 } })
  ]);
  console.log('✅ 科目数据创建完成');

  // 创建价格配置
  const priceSettings = [];
  for (const grade of grades) {
    for (const subject of subjects) {
      const basePrice = 100;
      const gradeMultiplier = grade.sortOrder <= 3 ? { 1: 1.2, 2: 1.3, 3: 1.5 }[grade.sortOrder] : 1.0;
      const subjectMultiplier = ['数学', '物理', '化学'].includes(subject.name) ? 1.2 : 1.0;

      priceSettings.push({
        gradeId: grade.id,
        subjectId: subject.id,
        hourlyPrice: Math.round(basePrice * gradeMultiplier * subjectMultiplier)
      });
    }
  }

  await prisma.priceSetting.createMany({ data: priceSettings });
  console.log('✅ 价格配置创建完成');

  // 创建默认管理员
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      name: '超级管理员'
    }
  });
  console.log('✅ 默认管理员创建完成 (用户名: admin, 密码: admin123)');

  console.log('数据库初始化完成！');
}

main()
  .catch((e) => {
    console.error('数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });