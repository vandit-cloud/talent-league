import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./index.css";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./context/ThemeContext";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "22477426707-hhsppqldbs2mta6f6bvdjliggmun9773.apps.googleusercontent.com";

createRoot(rootEl).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
