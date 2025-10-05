const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
});

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// 测试数据库连接
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }

  try {
    await redis.ping();
    console.log('✅ Redis 连接成功');
  } catch (error) {
    console.error('❌ Redis 连接失败:', error);
  }
}

module.exports = { prisma, redis, testConnection };