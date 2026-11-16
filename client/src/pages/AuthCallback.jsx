import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setTokenFromCallback, getMe } from "../store/slices/authSlice";
import { Zap } from "lucide-react";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      dispatch(setTokenFromCallback(token));
      dispatch(getMe()).then(() => {
        navigate("/", { replace: true });
      });
    } else {
      navigate("/login", { replace: true });
    }
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-primary shadow-lg">
          <Zap className="h-6 w-6 text-primary-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Authenticating with GitHub…</p>
      </div>
    </div>
  );
}
