# 家教中间商交易平台 (MVP)

## 项目概述

这是家教需求撮合平台的MVP版本，包含微信小程序端和Web管理后台。家长可以通过小程序快速发布家教需求，管理员通过后台系统管理需求和配置价格。

## 技术架构

### 后端 (Node.js)
- **框架**: Express.js + TypeScript
- **数据库**: MySQL 8.0 + Redis
- **ORM**: Prisma
- **认证**: JWT + 微信登录
- **实时通信**: Socket.io

### 前端
- **微信小程序**: 原生小程序开发
- **管理后台**: React + Ant Design + Vite

## 项目结构

```
miniprogram-1/
├── backend/                 # 后端服务
│   ├── config/             # 配置文件
│   ├── routes/             # API路由
│   ├── utils/              # 工具类
│   ├── prisma/             # 数据库模型
│   ├── scripts/            # 种子数据
│   └── server.js           # 入口文件
├── pages/                  # 小程序页面
│   ├── index/              # 首页
│   ├── demand/             # 需求相关页面
│   └── logs/               # 日志页面
├── admin/                  # 管理后台 (待开发)
├── utils/                  # 小程序工具类
└── images/                 # 静态资源
```

## 核心功能

### 微信小程序端
1. **用户认证**: 微信授权登录
2. **需求发布**:
   - 填写家庭地址
   - 选择孩子年级（高一/高二/高三/其他）
   - 选择补习科目（动态获取）
   - 实时显示课时费价格
3. **个人中心**:
   - 查看历史需求列表
   - 实时状态更新通知

### Web管理后台
1. **管理员认证**: 用户名密码登录
2. **需求管理**:
   - 查看所有需求列表
   - 更新需求状态（待处理/跟进中/已匹配/已关闭）
3. **价格管理**:
   - 配置年级-科目对应价格
   - 实时生效价格调整

## 开发环境搭建

### 1. 数据库环境
```bash
# 安装 MySQL 8.0
# 安装 Redis post6379
# 创建数据库: tutor_platform
```

### 2. 后端环境
```bash
cd backend
npm install

# 配置环境变量 (.env)
DATABASE_URL="mysql://root:password@localhost:3306/tutor_platform"
JWT_SECRET="your-super-secret-jwt-key"
WX_APP_ID="your-wechat-app-id"
WX_APP_SECRET="your-wechat-app-secret"

# 初始化数据库
npm run db:generate
npm run db:migrate
npm run db:seed

# 启动后端服务
npm run dev
```

### 3. 小程序开发
1. 使用微信开发者工具打开项目
2. 在 `app.js` 中配置API地址
3. 预览和调试

### 4. 管理后台开发
```bash
cd admin
npm install
npm run dev
```

## API接口文档

### 认证相关
- `POST /api/auth/wechat-login` - 微信登录
- `POST /api/auth/update-phone` - 更新手机号

### 需求管理
- `GET /api/subjects` - 获取科目列表
- `GET /api/price/grades` - 获取年级列表
- `GET /api/price/config/:gradeId/:subjectId` - 获取价格配置
- `POST /api/demands` - 提交需求
- `GET /api/demands/my` - 获取我的需求列表

### 管理后台
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/demands` - 获取需求列表
- `PUT /api/admin/demands/:id/status` - 更新需求状态
- `GET /api/admin/price-config` - 获取价格配置
- `PUT /api/admin/price-config` - 更新价格配置

## 数据库设计

### 核心表结构

1. **users** - 用户表
2. **grades** - 年级表
3. **subjects** - 科目表
4. **price_settings** - 价格配置表
5. **demands** - 需求表
6. **demand_status_logs** - 状态变更日志表
7. **admins** - 管理员表

详细的表结构见 `backend/prisma/schema.prisma`

## 部署说明

### 后端部署
1. 服务器安装 Node.js 16+, MySQL 8.0, Redis
2. 配置生产环境变量
3. 使用 PM2 进程管理
4. 配置 Nginx 反向代理

### 小程序发布
1. 在微信公众平台注册小程序
2. 配置服务器域名白名单
3. 上传代码并提交审核

### 管理后台部署
1. 构建生产版本: `npm run build`
2. 部署到静态服务器或CDN

## 开发规范

1. 后端API遵循RESTful设计
2. 统一返回格式: `{ success: boolean, data: any, error?: string }`
3. 小程序代码遵循微信官方规范
4. 使用ESLint和Prettier保持代码风格统一

## 默认账户

管理员账户:
- 用户名: `admin`
- 密码: `admin123`

## 开发排期

- **Week 1**: 基础架构搭建 (7天)
- **Week 2-3**: 核心功能开发 (12天)
- **Week 4**: 集成测试与上线 (7天)

## 联系方式

如有问题请联系开发团队。

## License

MIT License