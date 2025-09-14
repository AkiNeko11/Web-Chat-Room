# 网络聊天室 💬
一个基于 `Node.js` + `Socket.io` 的实时聊天室应用，支持多房间聊天、用户认证、实时消息等功能。

## ✨ 功能特性

### 🔐 用户系统
- 用户注册和登录
- JWT token 身份验证
- 密码加密存储（bcrypt）
- 自动登录状态保持

### 🏠 房间管理
- 创建聊天房间
- 加入/离开房间
- 房间列表显示
- 多房间支持

### 💬 实时聊天
- 基于 WebSocket 的实时通信
- 消息即时发送和接收
- 用户进入/离开房间提醒
- 消息持久化存储

### 🎨 界面设计
- 现代化 UI 设计
- 响应式布局
- 渐变背景和动画效果
- 美观的消息气泡

## 🛠️ 技术栈

### 后端
- **`Node.js`** - 运行环境
- **`Express.js`** - Web 框架
- **`Socket.io`** - 实时通信
- **`MySQL`** - 数据库
- **`JWT`** - 身份验证
- **`bcrypt`** - 密码加密

### 前端
- **`HTML5`** - 页面结构
- **`CSS3`** - 样式设计
- **`JavaScript`** - 交互逻辑
- **`Socket.io Client`** - 实时通信客户端

## 📁 项目结构

```
Web-Chat-Room/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   │   ├── database.js # 数据库配置
│   │   │   └── env.js      # 环境变量
│   │   ├── controllers/    # 控制器
│   │   │   ├── auth.controller.js
│   │   │   └── room.controller.js
│   │   ├── middlewares/    # 中间件
│   │   │   └── auth.js     # 认证中间件
│   │   ├── routes/         # 路由
│   │   │   ├── auth.routes.js
│   │   │   └── room.routes.js
│   │   ├── app.js          # Express 应用配置
│   │   ├── server.js       # 服务器启动文件
│   │   └── socketHandlers.js # Socket.io 事件处理
│   ├── package.json
│   └── package-lock.json
├── frontend/               # 前端代码
│   ├── html/
│   │   └── index.html      # 主页面
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── script/
│       └── app.js          # 前端逻辑
├── LICENSE
└── README.md
```

## 🚀 快速开始

### 环境配置
- Node.js 
- MySQL 
- npm 

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/AkiNeko11/Web-Chat-Room.git
   cd Web-Chat-Room
   ```

2. **安装依赖**
   ```bash
   cd backend
   npm install
   ```

3. **配置数据库**

   (具体参照sql目录下的chatroom.sql文件)
   创建数据库和表：
   ```sql
   -- 创建数据库
   CREATE DATABASE chatroom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE chatroom;
   
   -- 创建用户表
   CREATE TABLE users (
       id INT PRIMARY KEY AUTO_INCREMENT,
       username VARCHAR(50) UNIQUE NOT NULL,
       password VARCHAR(255) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   
   -- 创建房间表
   CREATE TABLE rooms (
       id INT PRIMARY KEY AUTO_INCREMENT,
       room_name VARCHAR(100) NOT NULL,
       room_code VARCHAR(20) UNIQUE NOT NULL,
       created_by INT NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       is_active BOOLEAN DEFAULT TRUE,
       FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   
   -- 创建消息表
   CREATE TABLE messages (
       id INT PRIMARY KEY AUTO_INCREMENT,
       room_id INT NOT NULL,
       user_id INT NOT NULL,
       message TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

4. **配置环境变量**
   
   在 `backend` 目录下创建 `.env` 文件：
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_DATABASE=chatroom
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   ```

5. **启动服务器**
   ```bash
   npm start
   # 或者开发模式
   npm run dev
   ```

6. **访问应用**
   
   打开浏览器访问：`http://localhost:3000`

## 📖 使用说明

### 用户操作
1. **注册账号**：首次使用需要注册新账号
2. **登录系统**：使用用户名和密码登录
3. **创建房间**：输入房间名称创建新的聊天房间
4. **加入房间**：输入房间号或点击房间列表中的房间
5. **发送消息**：在消息输入框中输入消息并发送
6. **离开房间**：点击离开房间按钮退出当前房间

### API 接口

#### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

#### 房间相关
- `POST /api/rooms/create` - 创建房间
- `GET /api/rooms/list` - 获取房间列表
- `GET /api/rooms/:roomCode` - 获取房间信息

### Socket\.io 事件

#### 客户端发送
- `join_room` - 加入房间
- `leave_room` - 离开房间
- `send_message` - 发送消息

#### 服务端发送
- `room_joined` - 房间加入成功
- `user_joined` - 用户加入房间
- `user_left` - 用户离开房间
- `new_message` - 新消息
- `error` - 错误信息

## 🔧 配置说明

### 数据库配置
在 `backend/src/config/database.js` 中配置 MySQL 连接信息。

### 环境变量
- `PORT`: 服务器端口（默认 3003）
- `DB_HOST`: 数据库主机（默认 localhost）
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `DB_DATABASE`: 数据库名称
- `JWT_SECRET`: JWT 签名密钥

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 📧 提交建议

如有问题或建议，欢迎提交issues来共同改进这个项目！

- Issues: [GitHub Issues](https://github.com/AkiNeko11/Web-Chat-Room/issues)

---

⭐ 如果这个项目对你有帮助，请给一个**star**支持！
