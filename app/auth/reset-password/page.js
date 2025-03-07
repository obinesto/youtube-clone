"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useUserStore from "@/hooks/useStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [submitLoader, setSubmitLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { resetPassword } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setSuccessMessage("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoader(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await resetPassword(email);
      setSuccessMessage(
        "Password reset email sent. Please check your inbox (including spam folder)."
      );
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.message || "Failed to send reset email");
      setSuccessMessage("");
    } finally {
      setSubmitLoader(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 pt-16 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-4xl font-semibold hover:text-gray-700"
          >
            YouTube Clone
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Reset your password
            </CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset
              your password
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="bg-green-50 text-green-700 border-green-200">
                  <AlertDescription className="flex items-center gap-2">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-customRed hover:bg-customRed/90"
                disabled={submitLoader}
              >
                {submitLoader ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending reset link...
                  </span>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </CardContent>
          </form>

          <CardFooter>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => router.push("/auth")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
