# NatureLens on your phone

## Fastest demo

Keep the laptop and Ollama running.

### Terminal 1 — Ollama

```powershell
ollama run gemma4:e4b
```

### Terminal 2 — NatureLens

```powershell
npm run dev
```

### Terminal 3 — HTTPS tunnel

```powershell
cloudflared tunnel --url http://localhost:3000
```

Open the printed `https://....trycloudflare.com` URL on your phone.

Allow camera and location permissions.

Then use:

```text
Explore → 30 min → Everything → Explorer → Start
```

Use Mystery Mode for the full demo experience.

## Why the phone can use local Gemma

```text
Phone
  ↓ HTTPS
Next.js server on laptop
  ↓ http://127.0.0.1:11434
Ollama
  ↓
Gemma 4 E4B
```

The phone never needs to connect directly to port 11434.

## Desktop companion

Open the same HTTPS URL on your laptop. The app uses the laptop's local vault at `.naturelens/local-vault.json` so the phone's saved discoveries can appear in the desktop dashboard without a hosted database.

## For installable offline-PWA testing

Build first:

```powershell
npm run build
npm run start
```

Then expose the running server again:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Open the HTTPS URL on Android Chrome and choose **Install app** / **Add to Home screen** when offered.

## Security note

A Quick Tunnel creates a temporary public `trycloudflare.com` URL. Anyone who has the URL can access the service until the tunnel process is stopped. Use it for demos, not production. Cloudflare also supports email-restricted Quick Tunnels with `--allowed-mail`.
