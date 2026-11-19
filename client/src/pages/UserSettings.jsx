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
import PageHeader from "@/components/layout/PageHeader";
import { FadeIn, Pop, Unfold } from "@/components/motion";
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
  Settings,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TABS = [
  { id: "profile", label: "Profile", hint: "Photo, name and email", icon: User },
  { id: "github", label: "GitHub", hint: "Connect your repositories", icon: GithubIcon },
  { id: "security", label: "Password & security", hint: "Sign-in and password", icon: Lock },
];

/* ── Building blocks ─────────────────────────────────────────────────────── */

/** A settings section: title + description on top, content, optional footer bar. */
function Section({ title, description, children, footer, tone }) {
  return (
    <section className={cn("rounded-2xl border bg-card", tone === "danger" ? "border-destructive/30" : "border-border")}>
      <div className="px-6 pb-1 pt-5">
        <h2 className={cn("text-[15px] font-bold tracking-tight", tone === "danger" ? "text-destructive" : "text-foreground")}>{title}</h2>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/30 px-6 py-3 rounded-b-2xl">{footer}</div>}
    </section>
  );
}

function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-foreground">
        {label}
      </Label>
      {children}
      {hint}
    </div>
  );
}

/** Password input with a show / hide toggle. */
function PasswordInput({ id, value, onChange, placeholder, autoComplete, className }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn("h-10 pr-10 text-sm", className)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PasswordStrength({ password }) {
  const strength =
    password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? 4
    : 3;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const bars = ["", "bg-destructive", "bg-accent-amber", "bg-primary", "bg-accent-emerald"];
  const texts = ["", "text-destructive", "text-accent-amber", "text-primary", "text-accent-emerald"];

  if (!password) return null;
  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i <= strength ? bars[strength] : "bg-border")} />
        ))}
      </div>
      <span className={cn("w-12 text-right text-[11px] font-semibold transition-colors duration-300", texts[strength])}>{labels[strength]}</span>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function UserSettings() {
  const dispatch = useDispatch();
  const { user, isUpdating } = useSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef(null);

  // ImageKit
  const { upload: uploadToImageKit, uploading: avatarUploading, progress: avatarProgress } = useImageKitUpload();

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [justSaved, setJustSaved] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // GitHub disconnect confirmation
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // Sync user → form
  useEffect(() => {
    if (user) {
      setName(user.name || "");
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

  const profileDirty = name !== (user?.name || "") || email !== (user?.email || "") || avatar !== (user?.avatar || "");
  const passwordsMatch = newPassword && newPassword === confirmPassword;

  // ─── Handlers (unchanged) ───────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateUserProfile({ name, email, avatar }));
    if (result.meta.requestStatus === "fulfilled") {
      toast.success("Profile updated successfully");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
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

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const url = await uploadToImageKit(file);
      setAvatar(url);
      toast.success("Photo uploaded. Click Save changes to apply.");
    } catch (err) {
      toast.error(err.message || "Upload failed. Please try again.");
    }
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

  const shownAvatar = avatar || user?.githubAvatar;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader icon={Settings} title="Account settings" description="Manage your profile, GitHub connection and security." />

      <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        {/* ── Navigation ─────────────────────────────────────────────────── */}
        <nav aria-label="Settings sections" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-none lg:sticky lg:top-16 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const linked = tab.id === "github" && user?.githubId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors duration-200 lg:w-full",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-r-full bg-highlight transition-opacity duration-200", active ? "opacity-100" : "opacity-0")}
                />
                <tab.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-[13px] font-semibold leading-tight">{tab.label}</span>
                  <span className="mt-0.5 hidden truncate text-[11px] font-normal text-text-muted lg:block">{tab.hint}</span>
                </span>
                {linked && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent-emerald" title="Connected" />}
              </button>
            );
          })}
        </nav>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="min-w-0">
          <FadeIn key={activeTab} className="space-y-5">
            {/* ═══ Profile ═══ */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSave} className="space-y-5">
                <Section title="Profile photo" description="Shown next to your name across Dionysus.">
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      {shownAvatar ? (
                        <Pop key={shownAvatar} className="block">
                          <img
                            src={shownAvatar}
                            alt={name}
                            className="h-20 w-20 rounded-full object-cover ring-2 ring-border ring-offset-2 ring-offset-card"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </Pop>
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-border ring-offset-2 ring-offset-card">
                          {name?.[0]?.toUpperCase() || <User className="h-7 w-7" />}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        title="Upload profile photo"
                        aria-label="Upload profile photo"
                        className={cn(
                          "absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card shadow-sm transition-transform duration-200",
                          avatarUploading ? "cursor-not-allowed bg-muted text-muted-foreground" : "cursor-pointer bg-primary text-primary-foreground hover:scale-110 active:scale-95"
                        )}
                      >
                        {avatarUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
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

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>

                      {avatarUploading ? (
                        <div className="max-w-[220px] space-y-1 pt-1">
                          <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                            <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${avatarProgress}%` }} />
                          </div>
                          <p className="text-[11px] text-primary">Uploading… {avatarProgress}%</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
                          <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-8 gap-1.5 text-xs">
                            <Camera className="h-3.5 w-3.5" />
                            Upload photo
                          </Button>
                          <span className="text-[11px] text-text-muted">JPG, PNG or WebP · up to 5 MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Section>

                <Section
                  title="Personal information"
                  description="Your name and the email you sign in with."
                  footer={
                    <>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {profileDirty ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-highlight animate-pulse-dot" />
                            Unsaved changes
                          </>
                        ) : justSaved ? (
                          <Pop className="gap-1.5 text-accent-emerald">
                            <Check className="h-3.5 w-3.5" /> Saved
                          </Pop>
                        ) : (
                          "Changes apply as soon as you save."
                        )}
                      </span>
                      <Button type="submit" size="sm" disabled={isUpdating || !profileDirty} className="h-8 gap-2 px-4 text-xs font-semibold">
                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Save changes
                      </Button>
                    </>
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Display name" htmlFor="settings-name">
                      <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="h-10 text-sm" />
                    </Field>
                    <Field label="Email address" htmlFor="settings-email">
                      <Input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="h-10 text-sm" />
                    </Field>
                  </div>
                </Section>
              </form>
            )}

            {/* ═══ GitHub ═══ */}
            {activeTab === "github" &&
              (user?.githubId ? (
                <>
                  <Section title="Connected account" description="Used to browse and import your repositories.">
                    <div className="flex items-center gap-4">
                      <img
                        src={user.githubAvatar || `https://avatars.githubusercontent.com/${user.githubUsername}`}
                        alt={user.githubUsername}
                        className="h-14 w-14 rounded-full ring-2 ring-border ring-offset-2 ring-offset-card"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">@{user.githubUsername}</p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent-emerald/10 px-2 py-0.5 text-[11px] font-semibold text-accent-emerald ring-1 ring-accent-emerald/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                          </span>
                        </div>
                        {user.githubConnectedAt && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Since {new Date(user.githubConnectedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                        <a
                          href={`https://github.com/${user.githubUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          View on GitHub <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {["Public repos", "Private repos", "1-click import", "Branch detection"].map((f) => (
                        <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-accent-emerald" />
                          {f}
                        </span>
                      ))}
                    </div>
                  </Section>

                  <Section
                    tone="danger"
                    title="Disconnect GitHub"
                    description="Removes GitHub access from your account. Your projects stay as they are."
                  >
                    {confirmDisconnect ? (
                      <Unfold>
                        <div className="space-y-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                            <p className="text-xs leading-relaxed text-destructive/90">
                              Make sure you have a password set before disconnecting, or you may be locked out of your account.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="destructive" disabled={isUpdating} onClick={handleDisconnectGitHub} className="h-8 gap-1.5 px-3 text-xs">
                              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
                              Yes, disconnect
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setConfirmDisconnect(false)} className="h-8 px-3 text-xs">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </Unfold>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDisconnect(true)}
                        className="h-8 gap-2 border-destructive/30 px-3 text-xs text-destructive transition-colors hover:border-destructive/60 hover:bg-destructive/5 hover:text-destructive"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Disconnect GitHub
                      </Button>
                    )}
                  </Section>
                </>
              ) : (
                <Section title="Connect your GitHub account" description="Import public and private repositories into Dionysus projects.">
                  <div className="flex flex-col items-center gap-5 py-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary">
                      <GithubIcon className="h-7 w-7 text-muted-foreground" />
                    </div>

                    <ul className="space-y-2 text-left">
                      {["Access public and private repos", "1-click import and analysis", "Auto-detect branches"].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-emerald" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button type="button" onClick={handleConnectGitHub} className="h-10 gap-2 px-5 text-sm font-semibold">
                      <GithubIcon className="h-4 w-4" />
                      Connect GitHub account
                    </Button>
                  </div>
                </Section>
              ))}

            {/* ═══ Security ═══ */}
            {activeTab === "security" && (
              <form onSubmit={handlePasswordSave}>
                <Section
                  title={!user?.hasPassword ? "Set a password" : "Change password"}
                  description={
                    !user?.hasPassword
                      ? "You signed in with GitHub. Set a password to also sign in with your email."
                      : "Use a strong password with uppercase letters, numbers and symbols."
                  }
                  footer={
                    <>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        You'll stay signed in after updating.
                      </span>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isUpdating || !newPassword || newPassword !== confirmPassword || (user?.hasPassword && !currentPassword)}
                        className="h-8 gap-2 px-4 text-xs font-semibold"
                      >
                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {!user?.hasPassword ? "Set password" : "Update password"}
                      </Button>
                    </>
                  }
                >
                  <div className="max-w-md space-y-4">
                    {user?.hasPassword && (
                      <Field label="Current password" htmlFor="settings-current">
                        <PasswordInput id="settings-current" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" autoComplete="current-password" />
                      </Field>
                    )}

                    <Field label="New password" htmlFor="settings-new" hint={<PasswordStrength password={newPassword} />}>
                      <PasswordInput id="settings-new" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" />
                    </Field>

                    <Field
                      label="Confirm new password"
                      htmlFor="settings-confirm"
                      hint={
                        confirmPassword && (
                          <p className={cn("mt-1 flex items-center gap-1 text-xs", passwordsMatch ? "text-accent-emerald" : "text-destructive")}>
                            {passwordsMatch ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                          </p>
                        )
                      }
                    >
                      <PasswordInput
                        id="settings-confirm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        className={confirmPassword && !passwordsMatch ? "border-destructive" : ""}
                      />
                    </Field>
                  </div>
                </Section>
              </form>
            )}
          </FadeIn>
        </div>
      </div>
    </div>
  );
}