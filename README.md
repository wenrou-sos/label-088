# 旅行社组团与计调操作平台

基于 React + Node.js + PostgreSQL 的旅行社全流程管理系统。

## 功能模块

### 1. 销售部 - 旅游产品管理
- 创建/编辑/删除旅游产品（线路名称、行程天数、出发城市、目的地）
- 各日行程安排（景点、用餐、住宿）
- 价格设置（双人房、三人房、儿童不占床）
- 创建出团计划（团号、出发/返程日期）

### 2. 收客管理
- 团队列表与状态筛选（收客中/已满员/已截止/已出团）
- 游客信息录入（姓名、身份证号、联系方式、房型、特殊需求）
- 满团自动停止收客
- 身份证号脱敏显示

### 3. 计调操作
- **航空切位**：航班号、座位数、切位单价、自动计算总成本
- **酒店控房**：酒店名称、房型、入住/离店日期、间数、单价、自动计算晚数和总成本
- **地接社确认**：地接社、导游、用车、用餐、费用

### 4. 收入成本分析
- 各团队总收入 vs 各项支出对比
- 毛利估算与毛利率计算
- 所有团队汇总统计
- 成本占比分析

### 5. 出团通知书
- 自动生成完整出团通知书（行程、航班、酒店、每日行程、游客名单、注意事项）
- 支持打印
- 支持群发和单独发送

## 技术栈

- **前端**：React 18 + React Router + Vite + Axios
- **后端**：Node.js + Express
- **数据库**：PostgreSQL
- **样式**：原生 CSS

## 项目结构

```
label-088/
├── client/                # React 前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── styles/        # 全局样式
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                # Express 后端
│   ├── db/                # 数据库相关
│   │   ├── 00_create_database.sql
│   │   ├── 01_schema.sql  # 表结构
│   │   ├── 02_seed_data.sql # 示例数据
│   │   ├── init.js        # 初始化脚本
│   │   └── pool.js        # 数据库连接池
│   ├── routes/            # API 路由
│   │   ├── products.js    # 产品管理
│   │   ├── tourists.js    # 收客管理
│   │   ├── operations.js  # 计调操作
│   │   ├── finance.js     # 财务分析
│   │   └── notices.js     # 出团通知书
│   ├── index.js           # 服务入口
│   └── package.json
└── package.json           # 根目录脚本
```

## 快速开始

### 1. 准备 PostgreSQL

确保已安装并启动 PostgreSQL，然后创建数据库：

```sql
CREATE DATABASE travel_agency;
```

### 2. 配置环境变量

复制 `server/.env.example` 为 `server/.env`，修改数据库连接信息：

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=travel_agency
```

### 3. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 4. 初始化数据库（创建表和示例数据）

```bash
cd server
npm run init-db
```

### 5. 启动项目

**启动后端服务（终端 1）：**
```bash
cd server
npm run dev
```
服务运行在 http://localhost:3001

**启动前端服务（终端 2）：**
```bash
cd client
npm run dev
```
前端运行在 http://localhost:5173

### 6. 访问应用

打开浏览器访问 http://localhost:5173

## 数据库表说明

| 表名 | 说明 |
|------|------|
| tour_products | 旅游产品 |
| daily_itineraries | 各日行程 |
| product_prices | 产品价格 |
| tour_groups | 出团计划/团队 |
| tourists | 游客信息 |
| flight_bookings | 航空切位预订 |
| hotel_bookings | 酒店控房预订 |
| local_agency_bookings | 地接社预订 |
