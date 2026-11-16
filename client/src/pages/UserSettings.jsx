import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  updateUserProfile,
  updateUserPassword,
  disconnectGithubAccount,
  getMe,
} from "../store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Tab Definitions ─────────────────────────────────────────────────────────
const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "github", label: "GitHub", icon: GithubIcon },
  { id: "security", label: "Password & Security", icon: Lock },
];

// ─── Avatar Preview ───────────────────────────────────────────────────────────
function AvatarPreview({ src, name, size = "lg" }) {
  const dim = size === "lg" ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm";
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover ring-2 ring-border", dim)}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <div className={cn("flex items-center justify-center rounded-full bg-primary/10 font-bold text-primary ring-2 ring-border", dim)}>
      {name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
    </div>
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? 4
    : 3;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full transition-all duration-300",
              i <= strength ? colors[strength] : "bg-border"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", strength <= 1 ? "text-red-500" : strength === 2 ? "text-orange-400" : strength === 3 ? "text-yellow-500" : "text-emerald-500")}>
        {labels[strength]}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserSettings() {
  const dispatch = useDispatch();
  const { user, isUpdating } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile tab state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // GitHub disconnect confirmation
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // Sync user to form when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  // Handle GitHub callback params
  useEffect(() => {
    const github = searchParams.get("github");
    if (github === "linked") {
      toast.success("GitHub account connected successfully!");
      dispatch(getMe());
      setActiveTab("github");
      setSearchParams({});
    } else if (github === "error") {
      toast.error("GitHub connection failed. Please try again.");
      setSearchParams({});
    }
  }, [searchParams, dispatch, setSearchParams]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateUserProfile({ name, email, avatar }));
    if (result.meta.requestStatus === "fulfilled") {
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.payload || "Profile update failed");
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    const result = await dispatch(updateUserPassword({ currentPassword, newPassword }));
    if (result.meta.requestStatus === "fulfilled") {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.payload || "Password update failed");
    }
  };

  const handleConnectGitHub = () => {
    const token = localStorage.getItem("token");
    window.location.href = `${API_BASE}/auth/github?link_token=${token}`;
  };

  const handleDisconnectGitHub = async () => {
    if (!confirmDisconnect) {
      setConfirmDisconnect(true);
      return;
    }
    const result = await dispatch(disconnectGithubAccount());
    if (result.meta.requestStatus === "fulfilled") {
      toast.success("GitHub account disconnected");
      dispatch(getMe());
      setConfirmDisconnect(false);
    } else {
      toast.error(result.payload || "Failed to disconnect GitHub");
      setConfirmDisconnect(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, GitHub integration, and security settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Profile ─────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSave} className="space-y-6 rounded-xl border border-border bg-card p-6">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <AvatarPreview src={avatar || user?.githubAvatar} name={name || user?.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-foreground">{user?.name}</p>
              <p className="text-[12px] text-muted-foreground">{user?.email}</p>
              {user?.githubUsername && (
                <a
                  href={`https://github.com/${user.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <GithubIcon className="h-3 w-3" />
                  @{user.githubUsername}
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                </a>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avatar" className="text-xs font-medium">Avatar URL</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://avatars.githubusercontent.com/…"
              className="h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Paste any public image URL — or leave blank to use your initials.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isUpdating} className="gap-2">
              {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Profile
            </Button>
          </div>
        </form>
      )}

      {/* ── Tab: GitHub ──────────────────────────────────────────────────── */}
      {activeTab === "github" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          {user?.githubId ? (
            <>
              {/* Connected state */}
              <div className="flex items-start gap-4">
                <img
                  src={user.githubAvatar || `https://avatars.githubusercontent.com/${user.githubUsername}`}
                  alt={user.githubUsername}
                  className="h-12 w-12 rounded-full ring-2 ring-border"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">@{user.githubUsername}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Connected
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Connected{" "}
                    {user.githubConnectedAt
                      ? new Date(user.githubConnectedAt).toLocaleDateString()
                      : ""}
                  </p>
                  <a
                    href={`https://github.com/${user.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    View on GitHub <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-[12px] text-muted-foreground">
                <p className="font-medium text-foreground">GitHub Integration Active</p>
                <p className="mt-1">
                  You can now browse and import your public and private repositories directly into Dionysus projects.
                </p>
              </div>

              {/* Disconnect */}
              <div className="border-t border-border pt-4">
                {confirmDisconnect ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <p className="text-[12px] text-destructive">
                        This will remove GitHub access from your account. Make sure you have a password set
                        to avoid being locked out.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={isUpdating}
                        onClick={handleDisconnectGitHub}
                        className="gap-1.5"
                      >
                        {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                        Yes, Disconnect
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDisconnect(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDisconnect(true)}
                    className="gap-2 text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Disconnect GitHub
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Not connected state */}
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border bg-card">
                  <GithubIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Connect your GitHub account</p>
                  <p className="mt-1 text-[12px] text-muted-foreground max-w-xs mx-auto">
                    Browse and import your public and private repositories directly into Dionysus projects.
                  </p>
                </div>
                <ul className="inline-flex flex-col gap-1.5 text-left">
                  {["Access public & private repos", "1-click import & analysis", "Auto-detect branches"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button type="button" onClick={handleConnectGitHub} className="gap-2 mt-2">
                  <GithubIcon className="h-4 w-4" />
                  Connect GitHub Account
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Security ────────────────────────────────────────────────── */}
      {activeTab === "security" && (
        <form onSubmit={handlePasswordSave} className="space-y-5 rounded-xl border border-border bg-card p-6">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {!user?.hasPassword ? "Set a Password" : "Change Password"}
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {!user?.hasPassword
                ? "You signed in via GitHub. Set a password to also enable email login."
                : "Use a strong password with uppercase, numbers, and symbols."}
            </p>
          </div>

          {/* Only show current password if user already has one */}
          {user?.hasPassword && (
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-xs font-medium">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-9 text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-xs font-medium">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="h-9 text-sm"
            />
            <PasswordStrength password={newPassword} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className={cn("h-9 text-sm", confirmPassword && newPassword !== confirmPassword && "border-destructive")}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-destructive">Passwords do not match</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isUpdating || !newPassword || newPassword !== confirmPassword}
              className="gap-2"
            >
              {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {!user?.hasPassword ? "Set Password" : "Update Password"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
