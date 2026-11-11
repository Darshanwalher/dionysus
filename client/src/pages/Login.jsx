import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearError } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import PasswordField from "@/components/ui/password-field";
import AuthLayout, { AuthError, AuthField, Magnetic } from "@/components/layout/AuthLayout";
import { Mail, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (result.meta.requestStatus === "fulfilled") {
      navigate("/");
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to pick up where your team left off."
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-[#17645F] underline underline-offset-4 decoration-[#FF6845] hover:text-[#10211F]"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthError message={error} />

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

        <div data-auth-item>
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              dispatch(clearError());
            }}
            required
          />
        </div>

        <Magnetic className="pt-1">
          <Button
            type="submit"
            isLoading={isLoading}
            className="group h-12 w-full rounded-full bg-[#FF6845] text-sm font-bold text-[#10211F] shadow-[0_10px_30px_-10px_rgba(255,104,69,0.7)] transition-colors hover:bg-[#17645F] hover:text-[#FAF7F2]"
          >
            Sign in
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </Magnetic>
      </form>
    </AuthLayout>
  );
}