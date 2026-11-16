/**
 * "or" divider + "Continue with GitHub" button, shared by the sign-in and sign-up pages.
 * Place at: client/src/components/auth/GithubAuth.jsx
 *
 *   import GithubButton, { AuthDivider } from "@/components/auth/GithubAuth";
 *   <AuthDivider />
 *   <GithubButton disabled={isLoading} />                      // sign in
 *   <GithubButton label="Sign up with GitHub" />               // sign up
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/ui/github-icon";
import { Magnetic } from "@/components/layout/AuthLayout";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* A rule with a word in the middle. data-auth-item lets the page's entrance animation include it. */
export function AuthDivider({ children = "or" }) {
  return (
    <div data-auth-item role="separator" aria-label={children} className="flex items-center gap-4 py-0.5">
      <span className="h-px flex-1 bg-[#DDD5C9]" />
      <span className="text-xs font-medium text-[#7F8C89]">{children}</span>
      <span className="h-px flex-1 bg-[#DDD5C9]" />
    </div>
  );
}

export default function GithubButton({ label = "Continue with GitHub", disabled = false }) {
  const [loading, setLoading] = useState(false);

  // If the user comes back with the browser's back button, the page is restored as it was left
  useEffect(() => {
    const reset = () => setLoading(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const go = () => {
    setLoading(true);
    window.location.href = `${API_BASE}/auth/github`;
  };

  return (
    <Magnetic strength={0.2}>
      <Button
        type="button"
        variant="outline"
        onClick={go}
        disabled={disabled || loading}
        isLoading={loading}
        className="group h-12 w-full gap-2.5 rounded-full border-[#DDD5C9] bg-[#FFFDFA] text-sm font-semibold text-[#10211F] transition-colors duration-300 hover:border-[#10211F] hover:bg-[#10211F] hover:text-[#FAF7F2]"
      >
        <GithubIcon className="h-[18px] w-[18px]" />
        {label}
      </Button>
    </Magnetic>
  );
}