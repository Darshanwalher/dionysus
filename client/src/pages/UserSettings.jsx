import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  updateUserProfile,
  updateUserPassword,
  disconnectGithubAccount,
  getMe,
} from "../store/slices/authSlice";
import { useImageKitUpload } from "@/hooks/useImageKitUpload";
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
  Camera,
  ShieldCheck,
  Link2Off,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Tab Definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "profile",  label: "Profile",             icon: User       },
  { id: "github",   label: "GitHub",               icon: GithubIcon },
  { id: "security", label: "Password & Security",  icon: Lock       },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const strength =
    password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? 4
    : 3;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
  const textColors = ["", "text-red-500", "text-orange-400", "text-yellow-500", "text-emerald-500"];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500 ease-out",
              i <= strength ? colors[strength] : "bg-border"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium transition-colors duration-300", textColors[strength])}>
        {labels[strength]}
      </p>
    </div>
  );
}

// ─── Field Row wrapper ────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Card({ children, className }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserSettings() {
  const dispatch  = useDispatch();
  const { user, isUpdating } = useSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef(null);

  // ImageKit
  const { upload: uploadToImageKit, uploading: avatarUploading, progress: avatarProgress } =
    useImageKitUpload();

  // Profile state
  const [name,  setName]  = useState(user?.name  || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");

  // Password state
  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");

  // GitHub disconnect confirmation
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // Sync user → form
  useEffect(() => {
    if (user) {
      setName(user.name   || "");
      setEmail(user.email || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  // GitHub callback params
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
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    const result = await dispatch(updateUserPassword({ currentPassword, newPassword }));
    if (result.meta.requestStatus === "fulfilled") {
      toast.success("Password updated successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      toast.error(result.payload || "Password update failed");
    }
  };

  const handleConnectGitHub = () => {
    const token = localStorage.getItem("token");
    window.location.href = `${API_BASE}/auth/github?link_token=${token}`;
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const url = await uploadToImageKit(file);
      setAvatar(url);
      toast.success("Photo uploaded — click Save Profile to apply.");
    } catch (err) {
      toast.error(err.message || "Upload failed. Please try again.");
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!confirmDisconnect) { setConfirmDisconnect(true); return; }
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

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page-entry animation via inline keyframe */}
      <style>{`
        @keyframes settingsFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes tabSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes avatarPop {
          0%   { transform: scale(0.92); opacity: 0; }
          60%  { transform: scale(1.04); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes progressFill {
          from { width: 0%; }
        }
        .settings-page  { animation: settingsFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .tab-panel      { animation: tabSlide 0.25s cubic-bezier(0.16,1,0.3,1) both; }
        .avatar-pop     { animation: avatarPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <div className="settings-page mx-auto max-w-xl px-4 py-10">

        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, GitHub connection, and security.
          </p>
        </div>

        {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] font-medium transition-all duration-200",
                  active
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/40"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className={cn("h-3.5 w-3.5 shrink-0", active && "text-primary")} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB: PROFILE
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="tab-panel">
            <form onSubmit={handleProfileSave} className="space-y-5">

              {/* Avatar Card */}
              <Card>
                <div className="p-5">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Profile Photo
                  </p>

                  <div className="flex items-center gap-5">
                    {/* Avatar + camera overlay */}
                    <div className="relative shrink-0">
                      <div className="avatar-pop">
                        {(avatar || user?.githubAvatar) ? (
                          <img
                            key={avatar || user?.githubAvatar}
                            src={avatar || user?.githubAvatar}
                            alt={name}
                            className="h-20 w-20 rounded-full object-cover ring-2 ring-border ring-offset-2 ring-offset-background transition-all duration-300"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary ring-2 ring-border ring-offset-2 ring-offset-background">
                            {name?.[0]?.toUpperCase() || <User className="h-7 w-7" />}
                          </div>
                        )}
                      </div>

                      {/* Camera button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className={cn(
                          "absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background shadow-md transition-all duration-200",
                          avatarUploading
                            ? "cursor-not-allowed bg-muted text-muted-foreground"
                            : "cursor-pointer bg-primary text-primary-foreground hover:scale-110 hover:bg-primary/90 active:scale-95"
                        )}
                        title="Upload profile photo"
                      >
                        {avatarUploading
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Camera className="h-3.5 w-3.5" />
                        }
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                        disabled={avatarUploading}
                      />
                    </div>

                    {/* Meta + upload cta */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>

                      {user?.githubUsername && (
                        <a
                          href={`https://github.com/${user.githubUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                        >
                          <GithubIcon className="h-3 w-3" />
                          @{user.githubUsername}
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      )}

                      {/* Upload progress */}
                      {avatarUploading ? (
                        <div className="pt-1 space-y-1">
                          <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                              style={{ width: `${avatarProgress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-primary animate-pulse">
                            Uploading… {avatarProgress}%
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border/60 transition-all duration-150 hover:bg-secondary hover:text-foreground"
                        >
                          <Camera className="h-3 w-3" />
                          Upload photo
                          <span className="ml-0.5 text-[10px] opacity-60">· JPG PNG WebP · 5 MB</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Name + Email Card */}
              <Card>
                <div className="p-5 space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Personal Info
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Display Name">
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="h-9 text-sm"
                      />
                    </Field>
                    <Field label="Email Address">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-9 text-sm"
                      />
                    </Field>
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
                  <p className="text-[11px] text-muted-foreground">
                    Changes apply immediately after saving.
                  </p>
                  <Button type="submit" size="sm" disabled={isUpdating} className="gap-2 h-8 px-4 text-xs">
                    {isUpdating
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <CheckCircle2 className="h-3.5 w-3.5" />
                    }
                    Save Profile
                  </Button>
                </div>
              </Card>

            </form>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: GITHUB
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "github" && (
          <div className="tab-panel">
            <Card>
              {user?.githubId ? (
                /* ── Connected ─────────────────────────────────────────────── */
                <>
                  <div className="p-5">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Connected Account
                    </p>

                    <div className="flex items-center gap-4">
                      <img
                        src={user.githubAvatar || `https://avatars.githubusercontent.com/${user.githubUsername}`}
                        alt={user.githubUsername}
                        className="h-14 w-14 rounded-full ring-2 ring-border ring-offset-2 ring-offset-background"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">
                            @{user.githubUsername}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Connected
                          </span>
                        </div>
                        {user.githubConnectedAt && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Since {new Date(user.githubConnectedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </p>
                        )}
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

                    {/* Feature chips */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Public repos", "Private repos", "1-click import", "Branch detection"].map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/60 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div className="border-t border-border/60 p-5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Danger Zone
                    </p>

                    {confirmDisconnect ? (
                      <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <p className="text-[12px] leading-relaxed text-destructive/90">
                            This will remove GitHub access from your account. Ensure you have a
                            password set before disconnecting to avoid being locked out.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isUpdating}
                            onClick={handleDisconnectGitHub}
                            className="gap-1.5 h-8 px-3 text-xs"
                          >
                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                            <Link2Off className="h-3 w-3" />
                            Yes, Disconnect
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDisconnect(false)}
                            className="h-8 px-3 text-xs"
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
                        className="gap-2 h-8 px-3 text-xs text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5 hover:text-destructive transition-all duration-200"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Disconnect GitHub
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                /* ── Not connected ──────────────────────────────────────────── */
                <div className="p-8 text-center space-y-5">
                  {/* Animated icon ring */}
                  <div className="relative mx-auto h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-border animate-spin" style={{ animationDuration: "8s" }} />
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary">
                      <GithubIcon className="h-7 w-7 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Connect your GitHub account
                    </p>
                    <p className="text-[12px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      Browse and import public and private repositories directly into Dionysus projects with one click.
                    </p>
                  </div>

                  <ul className="inline-flex flex-col gap-2 text-left">
                    {[
                      "Access public & private repos",
                      "1-click import & analysis",
                      "Auto-detect branches",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    onClick={handleConnectGitHub}
                    className="gap-2 mt-1 h-9 px-5 text-sm"
                  >
                    <GithubIcon className="h-4 w-4" />
                    Connect GitHub Account
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: SECURITY
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "security" && (
          <div className="tab-panel">
            <form onSubmit={handlePasswordSave}>
              <Card>
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {!user?.hasPassword ? "Set a Password" : "Change Password"}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {!user?.hasPassword
                          ? "You signed in via GitHub. Set a password to also enable email login."
                          : "Use a strong password with uppercase letters, numbers, and symbols."}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-border/60" />

                  {/* Current password (only if has one) */}
                  {user?.hasPassword && (
                    <Field label="Current Password">
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="h-9 text-sm"
                      />
                    </Field>
                  )}

                  <Field label="New Password">
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="h-9 text-sm"
                    />
                    <PasswordStrength password={newPassword} />
                  </Field>

                  <Field label="Confirm New Password">
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={cn(
                        "h-9 text-sm transition-all duration-200",
                        confirmPassword && newPassword !== confirmPassword
                          ? "border-destructive ring-destructive/20 ring-1"
                          : ""
                      )}
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                        <XCircle className="h-3 w-3" /> Passwords do not match
                      </p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && newPassword && (
                      <p className="text-[11px] text-emerald-500 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3" /> Passwords match
                      </p>
                    )}
                  </Field>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
                  <p className="text-[11px] text-muted-foreground">
                    You'll remain logged in after updating.
                  </p>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUpdating || !newPassword || newPassword !== confirmPassword}
                    className="gap-2 h-8 px-4 text-xs"
                  >
                    {isUpdating
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <ShieldCheck className="h-3.5 w-3.5" />
                    }
                    {!user?.hasPassword ? "Set Password" : "Update Password"}
                  </Button>
                </div>
              </Card>
            </form>
          </div>
        )}

      </div>
    </>
  );
}
