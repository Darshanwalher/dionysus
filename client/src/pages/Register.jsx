import { useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { registerUser, clearError } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import PasswordField from "@/components/ui/password-field";
import AuthLayout, { AuthError, AuthField, Magnetic } from "@/components/layout/AuthLayout";
import { Mail, UserIcon, ArrowRight } from "lucide-react";

const LEVELS = [
  { label: "Too short", color: "#C62A3B", width: 10 },
  { label: "Weak", color: "#C62A3B", width: 25 },
  { label: "Fair", color: "#E07B22", width: 50 },
  { label: "Good", color: "#B7791F", width: 75 },
  { label: "Strong", color: "#17645F", width: 100 },
];

function getLevel(pw) {
  if (!pw) return null;
  if (pw.length < 6) return 0;
  let score = 1;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

/** Bar under the password field: width and colour animate as you type. */
function PasswordStrength({ password }) {
  const bar = useRef(null);
  const level = getLevel(password);
  const info = level === null ? null : LEVELS[level];

  useLayoutEffect(() => {
    if (!bar.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { width: `${info ? info.width : 0}%`, backgroundColor: info ? info.color : "#DDD5C9" };
    if (reduced) gsap.set(bar.current, target);
    else gsap.to(bar.current, { ...target, duration: 0.5, ease: "power3.out" });
  }, [info]);

  return (
    <div className="-mt-2 space-y-1.5" aria-live="polite">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6DFD3]">
        <div ref={bar} className="h-full rounded-full" style={{ width: 0 }} />
      </div>
      <p className="h-4 text-xs text-[#5B6B68]">{info ? info.label : "Use at least 6 characters."}</p>
    </div>
  );
}

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser({ name, email, password }));
    if (result.meta.requestStatus === "fulfilled") {
      navigate("/");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start collaborating around code, architecture and meeting insights."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#17645F] underline underline-offset-4 decoration-[#FF6845] hover:text-[#10211F]"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthError message={error} />

        <AuthField
          id="name"
          label="Full name"
          icon={UserIcon}
          type="text"
          placeholder="Darshan Walher"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            dispatch(clearError());
          }}
          required
          autoComplete="name"
        />

        <AuthField
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            dispatch(clearError());
          }}
          required
          autoComplete="email"
        />

        <div data-auth-item className="space-y-3">
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              dispatch(clearError());
            }}
            minLength={6}
            required
          />
          <PasswordStrength password={password} />
        </div>

        <Magnetic className="pt-1">
          <Button
            type="submit"
            isLoading={isLoading}
            className="group h-12 w-full rounded-full bg-[#FF6845] text-sm font-bold text-[#10211F] shadow-[0_10px_30px_-10px_rgba(255,104,69,0.7)] transition-colors hover:bg-[#17645F] hover:text-[#FAF7F2]"
          >
            Create account
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </Magnetic>
      </form>
    </AuthLayout>
  );
}