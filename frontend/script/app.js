// 全局变量
let socket = null;
let currentUser = null;
let currentRoom = null;
let authToken = null;

// DOM元素
const authSection = document.getElementById('auth-section');
const chatSection = document.getElementById('chat-section');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserElement = document.getElementById('currentUser');
const newRoomName = document.getElementById('newRoomName');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomCode = document.getElementById('joinRoomCode');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomList = document.getElementById('roomList');
const currentRoomElement = document.getElementById('currentRoom');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查本地存储的token
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        // 验证token是否有效
        validateToken();
    }
    
    // 绑定事件监听器
    bindEventListeners();
});

// 绑定事件监听器
function bindEventListeners() {
    // 认证相关
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    showRegister.addEventListener('click', showRegisterForm);
    showLogin.addEventListener('click', showLoginForm);
    logoutBtn.addEventListener('click', handleLogout);
    
    // 房间相关
    createRoomBtn.addEventListener('click', handleCreateRoom);
    joinRoomBtn.addEventListener('click', handleJoinRoom);
    leaveRoomBtn.addEventListener('click', handleLeaveRoom);
    // 消息相关
    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
}

// 显示注册表单
function showRegisterForm(e) {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

// 显示登录表单
function showLoginForm(e) {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.code === 200) {
            authToken = data.token;
            currentUser = username;
            localStorage.setItem('authToken', authToken);
            showChatInterface();
            initializeSocket();
            loadRooms();
        } else {
            alert('登录失败：' + data.message);
        }
    } catch (error) {
        console.error('登录错误：', error);
        alert('登录失败，请检查网络连接');
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.code === 201) {
            authToken = data.token;
            currentUser = username;
            localStorage.setItem('authToken', authToken);
            showChatInterface();
            initializeSocket();
            loadRooms();
        } else {
            alert('注册失败：' + data.message);
        }
    } catch (error) {
        console.error('注册错误：', error);
        alert('注册失败，请检查网络连接');
    }
}

// 处理退出登录
function handleLogout() {
    authToken = null;
    currentUser = null;
    currentRoom = null;
    localStorage.removeItem('authToken');
    
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    showAuthInterface();
}

// 显示认证界面
function showAuthInterface() {
    authSection.style.display = 'flex';
    chatSection.style.display = 'none';
}

// 显示聊天界面
function showChatInterface() {
    authSection.style.display = 'none';
    chatSection.style.display = 'flex';
    currentUserElement.textContent = currentUser;
}

// 解析JWT token获取用户信息
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

// 验证token
async function validateToken() {
    try {
        // 先从token中解析用户名
        const payload = parseJWT(authToken);
        if (payload && payload.username) {
            currentUser = payload.username;
        }
        
        const response = await fetch('/api/rooms/list', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200) {
                showChatInterface();
                initializeSocket();
                loadRooms();
            }
        } else {
            localStorage.removeItem('authToken');
            authToken = null;
        }
    } catch (error) {
        console.error('Token验证失败：', error);
        localStorage.removeItem('authToken');
        authToken = null;
    }
}

// 初始化Socket连接
function initializeSocket() {
    if (socket) {
        socket.disconnect();
    }
    
    socket = io('/', {
        auth: {
            token: authToken
        }
    });
    
    // Socket事件监听
    socket.on('connect', () => {
        console.log('Socket连接成功');
    });
    
    socket.on('disconnect', () => {
        console.log('Socket连接断开');
    });
    
    socket.on('error', (error) => {
        console.error('Socket错误：', error);
        alert('连接错误：' + error.message);
    });
    
    socket.on('room_joined', (data) => {
        currentRoom = data.roomCode;
        currentRoomElement.textContent = data.roomName;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        addSystemMessage(data.message);
    });
    
    socket.on('user_joined', (data) => {
        addSystemMessage(data.message);
    });
    
    socket.on('user_left', (data) => {
        addSystemMessage(data.message);
    });
    
    socket.on('new_message', (data) => {
        addMessage(data.username, data.message, data.timestamp, data.username === currentUser);
    });
}

// 加载房间列表
async function loadRooms() {
    try {
        const response = await fetch('/api/rooms/list', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.code === 200) {
            displayRooms(data.data);
        }
    } catch (error) {
        console.error('加载房间列表失败：', error);
    }
}

// 显示房间列表
function displayRooms(rooms) {
    roomList.innerHTML = '';
    
    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = 'room-item';
        roomElement.innerHTML = `
            <div><strong>${room.room_name}</strong></div>
            <div>房间号: ${room.room_code}</div>
            <div>创建者: ${room.creator_name}</div>
        `;
        
        roomElement.addEventListener('click', () => {
            joinRoomCode.value = room.room_code;
            handleJoinRoom();
        });
        
        roomList.appendChild(roomElement);
    });
}

// 处理创建房间
async function handleCreateRoom() {
    const roomName = newRoomName.value.trim();
    
    if (!roomName) {
        alert('请输入房间名称');
        return;
    }
    
    try {
        const response = await fetch('/api/rooms/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ roomName })
        });
        
        const data = await response.json();
        
        if (data.code === 201) {
            alert('房间创建成功！房间号：' + data.data.roomCode);
            newRoomName.value = '';
            loadRooms();
        } else {
            alert('创建房间失败：' + data.message);
        }
    } catch (error) {
        console.error('创建房间错误：', error);
        alert('创建房间失败，请检查网络连接');
    }
}

// 处理加入房间
async function handleJoinRoom() {
    const roomCode = joinRoomCode.value.trim();
    
    if (!roomCode) {
        alert('请输入房间号');
        return;
    }
    
    if (!socket) {
        alert('连接未建立，请重新登录');
        return;
    }
    
    // 清空消息容器
    messagesContainer.innerHTML = '';

    // 获取历史消息
    try {
        const response = await fetch('/api/messages/getMessages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ roomCode })
        });
        
        const data = await response.json();
        if (data.code === 200 && data.count > 0) {
            // 显示历史消息
            data.data.forEach(msg => {
                addMessage(msg.username, msg.message, msg.timestamp, msg.isCurrentUser);
            });
            
            // 历史消息分割线
            addSystemMessage(`以上为 ${data.count} 条历史消息`);
        } else if (data.count === 0) {
            addSystemMessage('暂无历史消息');
        }
    } catch (error) {
        console.error('获取历史消息失败:', error);
        addSystemMessage('获取历史消息失败');
    }

    // 发送加入房间事件
    socket.emit('join_room', { roomCode });
}

// 处理离开房间
function handleLeaveRoom() {
    if (!socket || !currentRoom) {
        alert('当前未在任何房间中');
        return;
    }
    
    // 发送离开房间事件
    socket.emit('leave_room');
    
    // 重置界面状态
    currentRoom = null;
    currentRoomElement.textContent = '请选择一个房间';
    messageInput.disabled = true;
    sendBtn.disabled = true;
    
    // 清空消息容器，显示欢迎信息
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <p>欢迎使用聊天室！请先加入一个房间开始聊天。</p>
        </div>
    `;
}

// 处理发送消息
function handleSendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    if (!socket || !currentRoom) {
        alert('请先加入房间');
        return;
    }
    
    // 发送消息事件
    socket.emit('send_message', { message });
    
    // 清空输入框
    messageInput.value = '';
}

// 添加消息到聊天界面
function addMessage(username, content, timestamp, isOwn = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOwn ? 'own' : 'other'}`;
    
    const time = new Date(timestamp).toLocaleString();
    
    messageElement.innerHTML = `
        <div class="username">${username}</div>
        <div class="content">${content}</div>
        <div class="timestamp">${time}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 添加系统消息
function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    messageElement.style.textAlign = 'center';
    messageElement.style.fontStyle = 'italic';
    messageElement.style.color = '#666';
    messageElement.innerHTML = `<div class="content">${message}</div>`;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}