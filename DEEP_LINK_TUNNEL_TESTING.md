# Cloudflare Tunnel Deep Link Testing

This setup is for Android testing only. It uses two Cloudflare Quick Tunnels per session:

- Backend tunnel -> `http://localhost:5000`
- Frontend tunnel -> `http://localhost:5173`

The app is still opened by the existing custom scheme and Android intent flow. The tunnel URLs are used for the email redirect page, browser fallback, API calls, and the Phase 2 handoff.

## One-time prerequisites

- Install `cloudflared` and make sure `cloudflared` works from PowerShell.
- Install the Android app on the test device.
- Make sure the backend runs locally on port `5000`.
- Make sure the frontend runs locally on port `5173`.

## Recommended test workflow

1. Start your local frontend and backend.
2. Run the helper script from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-deep-link-test.ps1
```

3. The script prints the current tunnel URLs and updates `backend/.env` automatically.
4. Generate a fresh MCQ test email after the script finishes.
5. Open the email on the Android phone and tap the button.

## Expected behavior

- App installed:
  - The email opens the backend redirect page.
  - The redirect page launches the Android app.
  - The app loads MCQ data from the backend tunnel URL.
  - After submission, the app opens Phase 2 on the frontend tunnel URL.
- App not installed:
  - The redirect page shows the browser fallback button.
  - The fallback opens the frontend tunnel URL.

## Important rules

- Generate a new email every time the tunnel URLs change.
- Do not reuse old emails after restarting `cloudflared`.
- Keep the backend, frontend, and both tunnel processes running for the whole test.
- This is a testing-only workflow. It is not a permanent production deep-link solution.

## Optional script parameters

If the backend or frontend is not already running, the helper can open them for you:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-deep-link-test.ps1 `
  -BackendCommand "cd backend; npm run dev" `
  -FrontendCommand "cd frontend; npm run dev"
```

The script still prints the env vars to export before restarting the backend for email generation.
