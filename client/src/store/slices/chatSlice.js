import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

// Fetch latest messages (initial load)
export const fetchInitialMessages = createAsyncThunk(
  "chat/fetchInitialMessages",
  async ({ projectId, limit = 40 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/chat/messages`, {
        params: { limit },
      });
      return data.data; // { messages, nextCursor, hasMore }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch chat history"
      );
    }
  }
);

// Fetch older messages (pagination on scroll up)
export const fetchOlderMessages = createAsyncThunk(
  "chat/fetchOlderMessages",
  async ({ projectId, before, limit = 30 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/chat/messages`, {
        params: { before, limit },
      });
      return data.data; // { messages, nextCursor, hasMore }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load earlier messages"
      );
    }
  }
);

// Fetch project files for `#` autocomplete
export const fetchChatFiles = createAsyncThunk(
  "chat/fetchChatFiles",
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/chat/files`);
      const payload = data.data;
      if (Array.isArray(payload)) return payload;
      return payload?.files || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load files"
      );
    }
  }
);

// REST fallback for sending messages
export const sendChatMessageFallback = createAsyncThunk(
  "chat/sendChatMessageFallback",
  async ({ projectId, content, taggedFiles, replyTo }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/chat/messages`, {
        content,
        taggedFiles,
        replyTo,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send message"
      );
    }
  }
);

// REST fallback for toggling reactions
export const toggleReactionThunk = createAsyncThunk(
  "chat/toggleReactionThunk",
  async ({ projectId, messageId, emoji }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        `/projects/${projectId}/chat/messages/${messageId}/reactions`,
        { emoji }
      );
      return { messageId, reactions: data.data.reactions };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle reaction"
      );
    }
  }
);

const initialState = {
  messages: [],
  nextCursor: null,
  hasMore: false,
  isLoadingMessages: false,
  isLoadingMore: false,
  isSending: false,
  activeUsers: [],
  typingUsers: [],
  replyingTo: null,
  chatFiles: [],
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const newMsg = action.payload;
      if (!newMsg || !newMsg._id) return;
      const exists = state.messages.some((m) => m._id === newMsg._id);
      if (!exists) {
        state.messages.push(newMsg);
      }
    },
    updateMessageReactions: (state, action) => {
      const { messageId, reactions } = action.payload;
      const target = state.messages.find((m) => m._id === messageId);
      if (target) {
        target.reactions = reactions;
      }
    },
    setTypingUser: (state, action) => {
      const { userId, userName, isTyping } = action.payload;
      if (isTyping) {
        if (!state.typingUsers.some((u) => u.userId === userId)) {
          state.typingUsers.push({ userId, userName: userName || "Someone" });
        }
      } else {
        state.typingUsers = state.typingUsers.filter((u) => u.userId !== userId);
      }
    },
    setActiveUsers: (state, action) => {
      state.activeUsers = action.payload || [];
    },
    setReplyingTo: (state, action) => {
      state.replyingTo = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
      state.nextCursor = null;
      state.hasMore = false;
      state.typingUsers = [];
      state.replyingTo = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchInitialMessages
    builder
      .addCase(fetchInitialMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchInitialMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        const p = action.payload;
        if (Array.isArray(p)) {
          state.messages = p;
          state.nextCursor = p.length > 0 ? p[0].createdAt : null;
          state.hasMore = false;
        } else {
          state.messages = p?.messages || [];
          state.nextCursor = p?.nextCursor || null;
          state.hasMore = Boolean(p?.hasMore);
        }
      })
      .addCase(fetchInitialMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload;
      });

    // fetchOlderMessages
    builder
      .addCase(fetchOlderMessages.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchOlderMessages.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        const p = action.payload;
        const older = Array.isArray(p) ? p : (p?.messages || []);
        // Prepend older messages while avoiding duplicates
        const existingIds = new Set(state.messages.map((m) => m._id));
        const filteredOlder = older.filter((m) => !existingIds.has(m._id));
        state.messages = [...filteredOlder, ...state.messages];
        state.nextCursor = Array.isArray(p) ? (older[0]?.createdAt || null) : (p?.nextCursor || null);
        state.hasMore = Array.isArray(p) ? false : Boolean(p?.hasMore);
      })
      .addCase(fetchOlderMessages.rejected, (state) => {
        state.isLoadingMore = false;
      });

    // fetchChatFiles
    builder.addCase(fetchChatFiles.fulfilled, (state, action) => {
      state.chatFiles = action.payload;
    });

    // sendChatMessageFallback
    builder
      .addCase(sendChatMessageFallback.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendChatMessageFallback.fulfilled, (state, action) => {
        state.isSending = false;
        const msg = action.payload?.data || action.payload;
        if (msg && msg._id) {
          const exists = state.messages.some((m) => m._id === msg._id);
          if (!exists) {
            state.messages.push(msg);
          }
        }
        state.replyingTo = null;
      })
      .addCase(sendChatMessageFallback.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload;
      });

    // toggleReactionThunk
    builder.addCase(toggleReactionThunk.fulfilled, (state, action) => {
      const { messageId, reactions } = action.payload;
      const target = state.messages.find((m) => m._id === messageId);
      if (target) {
        target.reactions = reactions;
      }
    });
  },
});

export const {
  addMessage,
  updateMessageReactions,
  setTypingUser,
  setActiveUsers,
  setReplyingTo,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
