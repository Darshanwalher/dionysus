import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, clearError } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordField from "@/components/ui/password-field";
import AuthLayout from "@/components/layout/AuthLayout";
import { Mail, UserIcon, ArrowRight } from "lucide-react";

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
      description="Start collaborating around code, architecture, and meeting insights."
      footer={
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="rounded border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-foreground">
            Full Name
          </Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Darshan Walher"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                dispatch(clearError());
              }}
              className="h-9 pl-9 text-xs sm:text-sm"
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                dispatch(clearError());
              }}
              className="h-9 pl-9 text-xs sm:text-sm"
              required
              autoComplete="email"
            />
          </div>
        </div>

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

        <Button
          type="submit"
          className="w-full h-9 text-xs font-semibold mt-1"
          isLoading={isLoading}
        >
          Create Account
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </form>
    </AuthLayout>
  );
}
