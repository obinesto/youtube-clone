"use client";
import { Component } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";
import { Home, RefreshCcw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex pt-16">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle className="text-center">
              Something went wrong!
            </AlertTitle>
            <AlertDescription className="mt-2 text-center">
              An unexpected error occurred
            </AlertDescription>
            <div className="flex gap-16 mt-4 items-center justify-center">
              <Button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                variant="default"
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh Page
              </Button>
              <Button
                variant="default"
                className="gap-2"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = "/";
                }}
              >
                <Home className="h-4 w-4" />
                Return Home
              </Button>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
