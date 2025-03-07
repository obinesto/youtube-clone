"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useUserStore from "@/hooks/useStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, User, Loader2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Auth() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: ""
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, error, isAuthenticated } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const clearError = useCallback(() => {
    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (errorMessage) {
      clearError();
    }
  }, [errorMessage, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = () => {
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoader(true);
    setErrorMessage("");

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      setSubmitLoader(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUpWithEmail(formData);
      } else {
        await loginWithEmail(formData.email, formData.password);
      }
      
      if (!error) {
        router.push("/");
      }
    } catch (err) {
      setErrorMessage(err.message || "Authentication failed");
    } finally {
      setSubmitLoader(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 pt-16 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center py-4">
          <Link href="/" className="flex items-center gap-2 text-4xl font-semibold hover:text-gray-700">
            YouTube Clone
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isSignUp ? "Create an account" : "Sign in to your account"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "Enter your details below to create your account"
                : "Enter your email below to login to your account"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              {(errorMessage || error) && (
                <Alert variant="destructive">
                  <AlertDescription className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {errorMessage || error}
                  </AlertDescription>
                </Alert>
              )}

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required={isSignUp}
                      value={formData.username}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="JohnDoe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <Link
                      href="/auth/reset-password"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required={isSignUp}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        handleChange(e);
                        handlePasswordChange();
                      }}
                      className="pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-customRed hover:bg-customRed/90"
                disabled={submitLoader}
              >
                {submitLoader ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </span>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={loginWithGoogle}
              >
                Continue with Google
              </Button>
            </CardContent>
          </form>

          <CardFooter>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  username: ""
                });
                setErrorMessage("");
              }}
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}