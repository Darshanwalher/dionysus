const { WebSocketServer, WebSocket } = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const ChatMessage = require('../models/ChatMessage');
const { isCopilotMentioned, cleanCopilotPrompt, answerWithCopilot } = require('../services/copilot.service');

// Room multiplexer: Map<projectId, Set<wsClient>>
const rooms = new Map();

/**
 * Broadcast event to all connected clients in a project room
 */
const broadcastToRoom = (projectId, event, data, excludeWs = null) => {
  const room = rooms.get(String(projectId));
  if (!room) return;

  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  room.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

/**
 * Get active user list in a room
 */
const getActiveUsersInRoom = (projectId) => {
  const room = rooms.get(String(projectId));
  if (!room) return [];

  const usersMap = new Map();
  room.forEach((client) => {
    if (client.userId && !usersMap.has(client.userId)) {
      usersMap.set(client.userId, {
        id: client.userId,
        name: client.userName || 'Team Member',
        avatar: client.userAvatar || '',
      });
    }
  });

  return Array.from(usersMap.values());
};

/**
 * Initializes the WebSocket server gateway on the given HTTP server instance
 */
const initChatWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  // Handle HTTP upgrade only for /ws/chat
  httpServer.on('upgrade', async (request, socket, head) => {
    const parsedUrl = url.parse(request.url, true);

    if (parsedUrl.pathname !== '/ws/chat') {
      return; // let other handlers or default 404 handle it
    }

    const { projectId, token } = parsedUrl.query;

    if (!projectId || !token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await User.findById(decoded.id || decoded.userId).select('name email avatar').lean();

      if (!user) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Check project membership / existence
      const project = await Project.findById(projectId).select('name members owner').lean();
      if (!project) {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.userId = String(user._id);
        ws.userName = user.name || user.email.split('@')[0];
        ws.userAvatar = user.avatar || '';
        ws.projectId = String(projectId);
        ws.isAlive = true;
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      console.warn(`[WS Auth Failed] ${err.message}`);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  // Handle client connection
  wss.on('connection', (ws) => {
    const { projectId, userId, userName } = ws;

    // Join room
    if (!rooms.has(projectId)) {
      rooms.set(projectId, new Set());
    }
    rooms.get(projectId).add(ws);

    // Heartbeat setup
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Notify room of updated presence
    broadcastToRoom(projectId, 'presence:update', {
      activeUsers: getActiveUsersInRoom(projectId),
    });

    // Send connection ack to the client
    ws.send(
      JSON.stringify({
        event: 'connected',
        data: {
          projectId,
          userId,
          activeUsers: getActiveUsersInRoom(projectId),
        },
      })
    );

    // Handle incoming client messages
    ws.on('message', async (rawMessage) => {
      try {
        const parsed = JSON.parse(rawMessage);
        const eventType = parsed.event || parsed.action || '';
        const data = parsed.data || {};

        if (eventType === 'message:send') {
          const { content, taggedFiles = [], replyTo = null } = data;
          if (!content || !content.trim()) return;

          console.log(`[WS Chat] New message in room ${projectId} from ${userName}: "${content.slice(0, 40)}"`);

          // 1. Save user message to database
          const messageDoc = await ChatMessage.create({
            project: projectId,
            sender: {
              type: 'user',
              user: userId,
              name: userName,
              avatar: ws.userAvatar || '',
            },
            content: content.trim(),
            taggedFiles,
            replyTo: replyTo || null,
          });

          const populatedMessage = await ChatMessage.findById(messageDoc._id)
            .populate('replyTo', 'content sender')
            .lean();

          // 2. Broadcast message to all users in the room
          broadcastToRoom(projectId, 'message:new', { message: populatedMessage });

          // 3. Check for @dionysus AI co-pilot mention
          if (isCopilotMentioned(content)) {
            console.log(`[WS Copilot] Triggered @dionysus in room ${projectId}`);

            // Broadcast AI typing indicator
            broadcastToRoom(projectId, 'typing:update', {
              userId: 'ai_copilot',
              userName: 'Dionysus AI',
              name: 'Dionysus AI',
              isTyping: true,
            });

            // Asynchronously process co-pilot answer
            (async () => {
              try {
                // Fetch recent messages for conversational context
                const recentMessages = await ChatMessage.find({ project: projectId })
                  .sort({ createdAt: -1 })
                  .limit(6)
                  .lean();

                const cleanPrompt = cleanCopilotPrompt(content);
                const copilotResult = await answerWithCopilot({
                  projectId,
                  userPrompt: cleanPrompt,
                  taggedFiles,
                  recentMessages: recentMessages.reverse(),
                });

                // Save AI message to database
                const aiMessageDoc = await ChatMessage.create({
                  project: projectId,
                  sender: {
                    type: 'ai',
                    user: null,
                    name: 'Dionysus AI',
                    avatar: 'ai',
                  },
                  content: copilotResult.content,
                  taggedFiles: copilotResult.taggedFiles,
                  replyTo: messageDoc._id,
                });

                const populatedAiMessage = await ChatMessage.findById(aiMessageDoc._id)
                  .populate('replyTo', 'content sender')
                  .lean();

                // Stop typing & broadcast AI response
                broadcastToRoom(projectId, 'typing:update', {
                  userId: 'ai_copilot',
                  userName: 'Dionysus AI',
                  name: 'Dionysus AI',
                  isTyping: false,
                });

                broadcastToRoom(projectId, 'message:new', { message: populatedAiMessage });
              } catch (aiErr) {
                console.error(`[Copilot Error] ${aiErr.message}`);
                broadcastToRoom(projectId, 'typing:update', {
                  userId: 'ai_copilot',
                  userName: 'Dionysus AI',
                  name: 'Dionysus AI',
                  isTyping: false,
                });

                // Inform room of AI error
                const errorDoc = await ChatMessage.create({
                  project: projectId,
                  sender: {
                    type: 'system',
                    name: 'Dionysus AI',
                    avatar: 'ai',
                  },
                  content: `⚠️ Failed to synthesize response: ${aiErr.message}`,
                  replyTo: messageDoc._id,
                });
                broadcastToRoom(projectId, 'message:new', { message: errorDoc });
              }
            })();
          }
        }

        // Handle typing indicator event
        if (eventType === 'typing' || eventType === 'typing:start' || eventType === 'typing:stop') {
          const isTyping = eventType === 'typing:start' ? true : (eventType === 'typing:stop' ? false : Boolean(data.isTyping));
          broadcastToRoom(
            projectId,
            'typing:update',
            {
              userId,
              userName,
              name: userName,
              isTyping,
            },
            ws // exclude sender
          );
        }

        // Handle emoji reaction toggle
        if (eventType === 'reaction' || eventType === 'reaction:toggle') {
          const { messageId, emoji } = data;
          if (!messageId || !emoji) return;

          const msg = await ChatMessage.findById(messageId);
          if (msg) {
            const existingIdx = msg.reactions.findIndex(
              (r) => String(r.user) === String(userId) && r.emoji === emoji
            );

            if (existingIdx > -1) {
              msg.reactions.splice(existingIdx, 1);
            } else {
              msg.reactions.push({ user: userId, emoji });
            }

            await msg.save();

            broadcastToRoom(projectId, 'reaction:update', {
              messageId,
              reactions: msg.reactions,
            });
          }
        }
      } catch (err) {
        console.warn(`[WS Message Error] ${err.message}`);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      const room = rooms.get(projectId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          rooms.delete(projectId);
        } else {
          broadcastToRoom(projectId, 'presence:update', {
            activeUsers: getActiveUsersInRoom(projectId),
          });
        }
      }
    });

    ws.on('error', (err) => {
      console.warn(`[WS Client Error] ${err.message}`);
    });
  });

  // Heartbeat interval: ping clients every 30s to prune dead sockets
  const heartbeatInterval = setInterval(() => {
    rooms.forEach((room) => {
      room.forEach((ws) => {
        if (!ws.isAlive) {
          ws.terminate();
          room.delete(ws);
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
};

module.exports = {
  initChatWebSocketServer,
  broadcastToRoom,
};
