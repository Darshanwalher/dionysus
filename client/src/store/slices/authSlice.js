import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("token", data.data.token);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Registration failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.data.token);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/auth/me");
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch user");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ name, email, avatar }, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/auth/profile", { name, email, avatar });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Profile update failed");
    }
  }
);

export const updateUserPassword = createAsyncThunk(
  "auth/updatePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/auth/password", { currentPassword, newPassword });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Password update failed");
    }
  }
);

export const disconnectGithubAccount = createAsyncThunk(
  "auth/disconnectGithub",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.delete("/auth/github");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to disconnect GitHub");
    }
  }
);

export const fetchGithubRepos = createAsyncThunk(
  "auth/fetchGithubRepos",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/github/user-repos");
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch repos");
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  user: null,
  token: localStorage.getItem("token") || null,
  isLoading: false,
  isUpdating: false,
  error: null,
  githubRepos: [],
  reposLoading: false,
  reposError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.githubRepos = [];
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    },
    setTokenFromCallback: (state, action) => {
      state.token = action.payload;
      localStorage.setItem("token", action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      // Login
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      // Get Me
      .addCase(getMe.pending, (state) => { state.isLoading = true; })
      .addCase(getMe.fulfilled, (state, action) => { state.isLoading = false; state.user = action.payload; })
      .addCase(getMe.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
      })

      // Update Profile
      .addCase(updateUserProfile.pending, (state) => { state.isUpdating = true; state.error = null; })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => { state.isUpdating = false; state.error = action.payload; })

      // Update Password
      .addCase(updateUserPassword.pending, (state) => { state.isUpdating = true; state.error = null; })
      .addCase(updateUserPassword.fulfilled, (state) => { state.isUpdating = false; })
      .addCase(updateUserPassword.rejected, (state, action) => { state.isUpdating = false; state.error = action.payload; })

      // Disconnect GitHub
      .addCase(disconnectGithubAccount.pending, (state) => { state.isUpdating = true; })
      .addCase(disconnectGithubAccount.fulfilled, (state) => {
        state.isUpdating = false;
        if (state.user) {
          state.user.githubId = null;
          state.user.githubUsername = '';
          state.user.githubAvatar = '';
          state.user.githubConnectedAt = null;
        }
        state.githubRepos = [];
      })
      .addCase(disconnectGithubAccount.rejected, (state, action) => { state.isUpdating = false; state.error = action.payload; })

      // Fetch GitHub Repos
      .addCase(fetchGithubRepos.pending, (state) => { state.reposLoading = true; state.reposError = null; })
      .addCase(fetchGithubRepos.fulfilled, (state, action) => {
        state.reposLoading = false;
        state.githubRepos = action.payload;
      })
      .addCase(fetchGithubRepos.rejected, (state, action) => {
        state.reposLoading = false;
        state.reposError = action.payload;
      });
  },
});

export const { logout, clearError, setTokenFromCallback } = authSlice.actions;
export default authSlice.reducer;
