const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const onlineUsers = new Map();
const userSockets = new Map();
const typingTimers = new Map();

class SocketService {
  initialize(io) {
    this.io = io;

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) return next(new Error('Authentication required'));

        const decoded = jwt.verify(token, config.jwtPublicKey, { algorithms: ['RS256'] });
        const user = await User.findById(decoded.id);
        if (!user) return next(new Error('User not found'));

        socket.user = user;
        socket.userId = user._id.toString();
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      const uid = socket.userId;
      console.log(`User connected: ${socket.user.fullName} (socket: ${socket.id})`);

      if (!userSockets.has(uid)) userSockets.set(uid, []);
      userSockets.get(uid).push(socket.id);

      onlineUsers.set(uid, {
        userId: uid,
        fullName: socket.user.fullName,
        avatar: socket.user.avatar,
        status: 'active',
        lastActive: new Date(),
        sockets: userSockets.get(uid).length,
      });

      socket.join(`user:${uid}`);

      if (socket.user.organizationId) {
        socket.join(`org:${socket.user.organizationId}`);
      }

      User.findByIdAndUpdate(uid, { isOnline: true, lastActive: new Date() }).exec();

      if (userSockets.get(uid).length === 1) {
        io.emit('user_online', { userId: uid, fullName: socket.user.fullName, avatar: socket.user.avatar });
      }

      this._emitOnlineUsers();

      socket.on('join_project', (projectId) => {
        socket.join(`project:${projectId}`);
        this._emitProjectUsers(projectId);
      });

      socket.on('leave_project', (projectId) => {
        socket.leave(`project:${projectId}`);
      });

      socket.on('join_org', (orgId) => {
        socket.join(`org:${orgId}`);
      });

      socket.on('leave_org', (orgId) => {
        socket.leave(`org:${orgId}`);
      });

      socket.on('viewing_bug', (data) => {
        socket.to(`project:${data.projectId}`).emit('user_viewing_bug', {
          userId: uid,
          fullName: socket.user.fullName,
          bugId: data.bugId,
        });
      });

      socket.on('typing_start', (data) => {
        socket.to(`project:${data.projectId}`).emit('user_typing', {
          userId: uid,
          fullName: socket.user.fullName,
          bugId: data.bugId,
          isTyping: true,
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(`project:${data.projectId}`).emit('user_typing', {
          userId: uid,
          fullName: socket.user.fullName,
          bugId: data.bugId,
          isTyping: false,
        });
      });

      socket.on('heartbeat', () => {
        const entry = onlineUsers.get(uid);
        if (entry) {
          entry.status = 'active';
          entry.lastActive = new Date();
        }
        User.findByIdAndUpdate(uid, { lastActive: new Date() }).exec();
      });

      socket.on('status_change', (status) => {
        const entry = onlineUsers.get(uid);
        if (entry && ['active', 'idle', 'away', 'dnd'].includes(status)) {
          entry.status = status;
          io.emit('user_status_change', { userId: uid, status });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.fullName} (socket: ${socket.id})`);

        const sockets = userSockets.get(uid);
        if (sockets) {
          const idx = sockets.indexOf(socket.id);
          if (idx !== -1) sockets.splice(idx, 1);
          if (sockets.length === 0) {
            userSockets.delete(uid);
            onlineUsers.delete(uid);
            User.findByIdAndUpdate(uid, { isOnline: false, lastActive: new Date() }).exec();
            io.emit('user_offline', { userId: uid });
          } else {
            const entry = onlineUsers.get(uid);
            if (entry) {
              entry.sockets = sockets.length;
              entry.lastActive = new Date();
            }
          }
        }

        this._emitOnlineUsers();
      });
    });
  }

  _emitOnlineUsers() {
    if (!this.io) return;
    const users = Array.from(onlineUsers.values()).map(u => ({
      userId: u.userId,
      fullName: u.fullName,
      avatar: u.avatar,
      status: u.status,
      lastActive: u.lastActive,
    }));
    this.io.emit('online_users', users);
  }

  _emitProjectUsers(projectId) {
    if (!this.io) return;
    const users = Array.from(onlineUsers.values()).map(u => ({
      userId: u.userId,
      fullName: u.fullName,
      avatar: u.avatar,
      status: u.status,
      lastActive: u.lastActive,
    }));
    this.io.to(`project:${projectId}`).emit('project_users', users);
  }

  emitToProject(projectId, event, data) {
    if (this.io) {
      this.io.to(`project:${projectId}`).emit(event, data);
    }
  }

  emitToOrg(orgId, event, data) {
    if (this.io) {
      this.io.to(`org:${orgId}`).emit(event, data);
    }
  }

  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  getOnlineUsers() {
    return Array.from(onlineUsers.values()).map(u => ({
      userId: u.userId,
      fullName: u.fullName,
      avatar: u.avatar,
      status: u.status,
      lastActive: u.lastActive,
    }));
  }

  isUserOnline(userId) {
    return onlineUsers.has(userId.toString());
  }
}

module.exports = new SocketService();