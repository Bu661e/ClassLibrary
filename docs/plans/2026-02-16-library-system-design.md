# 班级图书共享管理系统 - 设计方案

## 项目简介

班级图书共享管理系统是一个面向班级内部的轻量级图书借阅平台。管理员可管理图书和用户信息，普通用户可以浏览、搜索、借阅和归还图书。

## 技术栈

- **后端**: Python 3.10+ + Flask + SQLite (SQLAlchemy ORM)
- **前端**: Vue 3 (Composition API) + Element Plus (CDN 引入)
- **认证**: Flask-Login + Session
- **部署**: 单命令启动 `python app.py`

## 架构设计

### 目录结构

```
图书管理系统/
├── app.py                 # Flask 入口
├── config.py              # 配置
├── models.py              # SQLAlchemy 模型
├── routes/                # API 路由
│   ├── auth.py
│   ├── books.py
│   ├── borrow.py
│   └── admin.py
├── services/              # 业务逻辑
├── static/                # 静态资源
│   └── js/
│       ├── app.js         # Vue 应用入口
│       ├── components/    # Vue 组件
│       └── pages/         # 页面组件
├── templates/
│   └── index.html         # 单页应用模板
└── requirements.txt
```

## 数据模型

### 用户表 (User)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| student_id | String | 学号，唯一 |
| name | String | 姓名 |
| password_hash | String | 密码哈希 |
| is_admin | Boolean | 是否管理员 |
| created_at | DateTime | 创建时间 |

### 图书表 (Book)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| title | String | 书名 |
| author | String | 作者 |
| publisher | String | 出版社 |
| isbn | String | ISBN |
| tags | String | 标签，逗号分隔 |
| source | String | 来源：class(班级购买)/donated(个人捐赠) |
| donor_id | Integer | 捐赠者ID（外键，可为空） |
| status | String | 状态：available/pending_borrow/borrowed/pending_return/unavailable |
| created_at | DateTime | 创建时间 |

**Book.status 生命周期：**
- `available` - 在库，可借阅
- `pending_borrow` - 借阅审核中（已被申请，等待管理员处理）
- `borrowed` - 借出（在学生手中）
- `pending_return` - 归还审核中（学生已申请归还，等待管理员确认收书）
- `unavailable` - 不可用（破损、丢失、下架）

### 借阅记录表 (BorrowRecord)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| book_id | Integer | 图书ID（外键） |
| borrower_id | Integer | 借阅者ID（外键） |
| status | String | 状态：pending/donor_pending/approved/return_pending/completed/rejected |
| request_at | DateTime | 申请时间 |
| approve_at | DateTime | 通过时间 |
| return_at | DateTime | 归还时间 |

**BorrowRecord.status 流程：**
- `pending` - 待管理员审核
- `donor_pending` - 待捐赠者确认（仅捐赠图书有此状态）
- `approved` - 已通过，书已借出
- `return_pending` - 待归还确认
- `completed` - 已完成
- `rejected` - 已拒绝

### 捐赠者确认表 (DonorConfirm)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| borrow_record_id | Integer | 借阅记录ID（外键） |
| donor_id | Integer | 捐赠者ID（外键） |
| status | String | 状态：pending/approved/rejected |
| confirmed_at | DateTime | 确认时间 |

### 系统配置表 (Setting)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| key | String | 配置键 |
| value | String | 配置值 |

**配置项：**
- `max_borrow_days` - 最大借阅天数
- `max_books_per_user` - 单人最大持书量

## API 设计

### 认证相关
```
POST /api/auth/login              # 登录
POST /api/auth/logout             # 登出
GET  /api/auth/me                 # 获取当前用户信息
```

### 图书相关
```
GET    /api/books                 # 列表（支持搜索：title, author, tag）
GET    /api/books/:id             # 详情
POST   /api/books                 # 入库（管理员）
PUT    /api/books/:id             # 修改（管理员）
PUT    /api/books/:id/status      # 修改状态（管理员）
```

### 借阅相关
```
GET    /api/borrows               # 我的借阅历史
POST   /api/borrows               # 申请借阅
PUT    /api/borrows/:id/return    # 申请归还
```

### 管理员相关
```
GET    /api/admin/borrows         # 所有借阅申请（待处理列表）
PUT    /api/admin/borrows/:id/approve      # 通过借阅
PUT    /api/admin/borrows/:id/reject       # 拒绝借阅
PUT    /api/admin/borrows/:id/confirm-return  # 确认归还

GET    /api/admin/users           # 用户列表
POST   /api/admin/users           # 新增用户
DELETE /api/admin/users/:id       # 删除用户

GET    /api/admin/dashboard       # 数据看板（统计、排行榜）
GET    /api/admin/settings        # 获取配置
PUT    /api/admin/settings        # 修改配置
```

### 捐赠者确认相关
```
GET    /api/donor/confirms        # 待我确认的借阅
PUT    /api/donor/confirms/:id/approve     # 捐赠者同意
PUT    /api/donor/confirms/:id/reject      # 捐赠者拒绝
```

## 前端页面结构

| 路径 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录页 | 学号/姓名/密码输入 |
| `/` | 首页（图书列表）| 搜索、筛选、图书卡片展示 |
| `/books/:id` | 图书详情 | 基本信息、借阅按钮、借阅历史 |
| `/my-borrows` | 我的借阅 | 当前借阅、历史记录、归还按钮 |
| `/donor-confirms` | 待确认列表 | 捐赠者确认（仅对捐赠者显示）|
| `/admin` | 管理后台 | 侧边栏导航 |
| `/admin/books` | 图书管理 | 入库、编辑、状态修改 |
| `/admin/borrows` | 借还审核 | 待处理申请列表 |
| `/admin/users` | 用户管理 | 新增、删除用户 |
| `/admin/dashboard` | 数据看板 | 统计数字、排行榜 |

## 核心交互流程

### 学生借书流程
1. 图书列表 → 点击"申请借阅"
2. 如果书是捐赠的 → 等待捐赠者确认
3. 管理员审核
4. 学生拿到书，状态变为"借出"

### 学生还书流程
1. 我的借阅 → 点击"申请归还"
2. 管理员确认收书
3. 状态变为"已完成"，图书回到"在库"

### 管理员入库流程
1. 图书管理 → 点击"新增图书"
2. 输入书名、作者、出版社、ISBN（全部手动录入）
3. 选择来源（班级购买/个人捐赠）
4. 保存

## 错误处理与边界情况

| 场景 | 处理方式 |
|------|----------|
| 同一本书被多人同时申请 | 第一个申请创建后，Book.status 变为 `pending_borrow`，其他人不能再申请 |
| 学生已达到最大借阅数量 | 申请时检查 `current_borrow_count >= max_books_per_user`，返回错误提示 |
| 图书逾期 | 数据看板显示逾期列表，标记为红色 |
| 捐赠者拒绝借阅 | BorrowRecord 状态变为 `rejected`，Book.status 恢复为 `available` |
| 管理员删除有借阅记录的用户 | 提示"该用户有未还图书，无法删除" |

## MVP 功能边界

**包含：**
- ✅ 用户登录（学号+姓名+密码）
- ✅ 图书入库、编辑、状态管理（ISBN 手动录入）
- ✅ 借阅申请、归还申请
- ✅ 捐赠者确认机制
- ✅ 管理员审核（借阅/归还）
- ✅ 数据看板（基础统计 + 排行榜）
- ✅ 管理员新增/删除用户
- ✅ 系统配置（最大借阅天数、最大持书量）

**不包含（预留扩展）：**
- ❌ ISBN 自动查询
- ❌ 批量入库
- ❌ 逾期自动提醒（只显示逾期列表）
- ❌ 图书评价/书评
- ❌ 心愿单

## 决策记录

| 决策 | 说明 |
|------|------|
| 前后端同仓库 | 单仓库管理，Flask 托管静态文件，部署简单 |
| Vue 3 CDN 引入 | 无需构建步骤，现代化 SPA 体验 |
| SQLite | 班级规模小，SQLite 足够，零配置 |
| 先核心后扩展 | MVP 聚焦借还流程，其他功能后续迭代 |
