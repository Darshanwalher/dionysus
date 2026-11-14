const ChatMessage = require('../models/ChatMessage');
const Project = require('../models/Project');
const { isCopilotMentioned, cleanCopilotPrompt, answerWithCopilot } = require('../services/copilot.service');
const { broadcastToRoom } = require('../websocket/chat.gateway');
const { parseGithubUrl, getRepoMetadata, fetchRepoTree, shouldProcessFile } = require('../services/github.service');

// @desc    Get paginated chat messages for a project
// @route   GET /api/projects/:id/chat/messages
const getChatMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;

    const query = { project: id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 100))
      .populate('replyTo', 'content sender')
      .populate('sender.user', 'name email avatar')
      .lean();

    // Return in chronological order
    const chronological = messages.reverse();
    const nextCursor = chronological.length > 0 ? chronological[0].createdAt : null;

    return res.status(200).json({
      success: true,
      data: {
        messages: chronological,
        nextCursor,
        hasMore: messages.length === parseInt(limit, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send chat message via REST fallback
// @route   POST /api/projects/:id/chat/messages
const sendChatMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, taggedFiles = [], replyTo = null } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const user = req.user;
    const messageDoc = await ChatMessage.create({
      project: id,
      sender: {
        type: 'user',
        user: user._id,
        name: user.name || user.email.split('@')[0],
        avatar: user.avatar || '',
      },
      content: content.trim(),
      taggedFiles,
      replyTo: replyTo || null,
    });

    const populated = await ChatMessage.findById(messageDoc._id)
      .populate('replyTo', 'content sender')
      .lean();

    // Broadcast through WebSocket room
    broadcastToRoom(id, 'message:new', { message: populated });

    // If @dionysus is mentioned, trigger AI co-pilot asynchronously
    if (isCopilotMentioned(content)) {
      (async () => {
        try {
          broadcastToRoom(id, 'typing:update', {
            userId: 'ai_copilot',
            userName: 'Dionysus AI',
            name: 'Dionysus AI',
            isTyping: true,
          });

          const cleanPrompt = cleanCopilotPrompt(content);
          const copilotResult = await answerWithCopilot({
            projectId: id,
            userPrompt: cleanPrompt,
            taggedFiles,
            recentMessages: [populated],
          });

          const aiDoc = await ChatMessage.create({
            project: id,
            sender: {
              type: 'ai',
              name: 'Dionysus AI',
              avatar: 'ai',
            },
            content: copilotResult.content,
            taggedFiles: copilotResult.taggedFiles,
            replyTo: messageDoc._id,
          });

          const populatedAi = await ChatMessage.findById(aiDoc._id)
            .populate('replyTo', 'content sender')
            .lean();

          broadcastToRoom(id, 'typing:update', {
            userId: 'ai_copilot',
            userName: 'Dionysus AI',
            name: 'Dionysus AI',
            isTyping: false,
          });

          broadcastToRoom(id, 'message:new', { message: populatedAi });
        } catch (err) {
          console.error(`[REST Copilot Error] ${err.message}`);
          broadcastToRoom(id, 'typing:update', {
            userId: 'ai_copilot',
            userName: 'Dionysus AI',
            name: 'Dionysus AI',
            isTyping: false,
          });
        }
      })();
    }

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle emoji reaction on a message
// @route   POST /api/projects/:id/chat/messages/:messageId/reactions
const toggleReaction = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const existingIdx = message.reactions.findIndex(
      (r) => String(r.user) === String(userId) && r.emoji === emoji
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    broadcastToRoom(message.project, 'reaction:update', {
      messageId: message._id,
      reactions: message.reactions,
    });

    return res.status(200).json({
      success: true,
      data: message.reactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get repository files list for # autocomplete
// @route   GET /api/projects/:id/chat/files
const getProjectFilesForChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).select('githubUrl').lean();

    if (!project || !project.githubUrl) {
      return res.status(200).json({ success: true, data: [] });
    }

    const parsed = parseGithubUrl(project.githubUrl);
    if (!parsed) {
      return res.status(200).json({ success: true, data: [] });
    }

    const repoMetadata = await getRepoMetadata(parsed.owner, parsed.repo);
    const tree = await fetchRepoTree(parsed.owner, parsed.repo, repoMetadata.defaultBranch);

    const files = tree
      .map((item) => item.path)
      .filter((p) => shouldProcessFile(p))
      .slice(0, 150);

    return res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.warn(`[Chat Files Fetch Warning] ${error.message}`);
    // Non-blocking fallback
    return res.status(200).json({ success: true, data: [] });
  }
};

module.exports = {
  getChatMessages,
  sendChatMessage,
  toggleReaction,
  getProjectFilesForChat,
};
