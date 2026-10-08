# NatureLens

**Touch grass. Notice more.**

NatureLens is a mobile-first Progressive Web App (PWA) and desktop
companion for outdoor exploration. Instead of using AI to keep people on
a screen, NatureLens uses a local multimodal open-weight model to turn a
walk into an interactive field mission.

Point the camera at a plant, leaf, flower, tree, insect, rock, or
another interesting object. NatureLens sends the captured image to a
**local Ollama server running Gemma 4 E4B**, receives an observation,
explains what the model noticed, and gives the user a "look closer"
challenge.

The intended experience is simple:

> **Look → Observe → Learn → Look closer → Put the phone away.**

------------------------------------------------------------------------

## Why NatureLens?

Most AI applications try to increase screen time.

NatureLens tries to reduce it.

The app makes the phone useful for only the few seconds required to
capture and understand an observation. The AI then gives the user
another reason to look at the real world.

The open/local AI architecture is central to this idea:

-   Images can be analyzed on hardware controlled by the user.
-   The default inference path does not require a commercial AI API.
-   The model can be replaced or experimented with.
-   Prompts and AI behavior can be changed by the developer.
-   Local inference avoids per-image cloud API charges.
-   The complete application and inference flow can be inspected and
    modified.

------------------------------------------------------------------------

# Features

## Outdoor exploration

-   Mobile-first exploration interface
-   Rear-camera capture
-   Image upload fallback
-   GPS/location capture
-   15, 30, and 60 minute exploration sessions
-   Everything, Plants, and Wildlife focus modes
-   Easy, Explorer, and Expert difficulty levels
-   AI-generated four-step observation quests
-   Mystery Mode
-   Observation progress tracking
-   "Look closer" prompts
-   "Observe again" follow-up analysis
-   Evidence guidance when an image is insufficient
-   Confidence-aware identification
-   Discovery saving
-   Exploration timer with pause/end controls

## Local multimodal AI

NatureLens uses:

-   Ollama
-   Gemma 4 E4B
-   Local image-to-text/multimodal analysis
-   Structured AI observations
-   Confidence levels
-   Evidence and follow-up guidance
-   Local-AI fallback behavior when Ollama is unavailable

The default AI path is:

``` text
Camera
   ↓
NatureLens
   ↓
Next.js API
   ↓
Ollama
   ↓
Gemma 4 E4B
   ↓
Structured observation
   ↓
NatureLens UI
```

## Desktop companion

The desktop experience is designed for reviewing an exploration rather
than performing it.

It includes:

-   Explorer dashboard
-   Discovery statistics
-   Explorer level
-   Walk history
-   Discovery map
-   Saved observations
-   Badges/progression
-   Field journal
-   Local AI status
-   Local vault synchronization

## Local-first storage

NatureLens uses:

-   IndexedDB
-   Dexie
-   Browser-local discovery storage
-   Local exploration state
-   Optional local vault synchronization

The optional local vault is stored on the laptop at:

``` text
.naturelens/local-vault.json
```

It is not a hosted cloud database.

## PWA

NatureLens can be installed on a compatible phone as a Progressive Web
App.

The production build includes the service worker used for the
installable/offline-friendly experience.

------------------------------------------------------------------------

# Technology Stack

  Layer                Technology
  -------------------- -------------------------
  Frontend             Next.js 16
  UI                   React 19
  Language             TypeScript
  Styling              Tailwind CSS 4
  Icons                Lucide React
  Local database       Dexie + IndexedDB
  Maps                 Leaflet
  Map data             OpenStreetMap
  Local AI runtime     Ollama
  Multimodal model     Gemma 4 E4B
  Mobile delivery      PWA
  Development tunnel   Cloudflare Quick Tunnel

Next.js currently requires Node.js 20.9 or later; this project is
intended to run with Node.js 20+ and Node.js 22 is recommended.

------------------------------------------------------------------------

# System Architecture

## Laptop-only development

``` text
┌─────────────────────────────┐
│        Web Browser          │
│       localhost:3000        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Next.js 16            │
│        NatureLens            │
└──────────────┬──────────────┘
               │
               │ HTTP localhost
               ▼
┌─────────────────────────────┐
│          Ollama              │
│       localhost:11434        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       Gemma 4 E4B            │
│      Local multimodal AI     │
└─────────────────────────────┘
```

## Phone demonstration

``` text
┌─────────────────────────────┐
│           Phone             │
│ Camera + GPS + PWA          │
└──────────────┬──────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────┐
│     Cloudflare Tunnel       │
│      trycloudflare.com      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Laptop               │
│       Next.js :3000         │
└──────────────┬──────────────┘
               │
               │ localhost
               ▼
┌─────────────────────────────┐
│          Ollama             │
│       Gemma 4 E4B           │
└─────────────────────────────┘
```

### Important privacy detail

The phone does **not** connect directly to Ollama.

Port `11434` stays on the laptop in the default configuration. The
public HTTPS endpoint exposes the NatureLens web application, while the
Next.js server communicates with Ollama locally.

------------------------------------------------------------------------

# Requirements

For the complete PC + phone setup you need:

### Laptop / PC

-   Windows 10/11, macOS, or Linux
-   Node.js 20.9+
-   npm
-   Git
-   Ollama
-   Gemma 4 E4B
-   A modern browser
-   Internet connection for installing dependencies/model and for the
    phone tunnel
-   Sufficient RAM/storage for the selected local model

### Phone

-   Android or another modern mobile browser
-   Chrome or another Chromium-based browser recommended
-   Camera
-   Location services
-   Internet access to reach the laptop tunnel
-   HTTPS access to the NatureLens URL

------------------------------------------------------------------------

# Complete Windows Setup

The following instructions assume Windows and PowerShell/Command Prompt.

## 1. Install Git

Install Git for Windows if it is not already installed.

Verify:

``` powershell
git --version
```

------------------------------------------------------------------------

## 2. Install Node.js

Install Node.js 20.9 or newer.

Verify:

``` powershell
node --version
npm --version
```

Recommended:

``` text
Node.js 22.x
```

If you use NVM for Windows, select Node 22 before starting NatureLens.

Example:

``` powershell
nvm install 22
nvm use 22
node --version
```

------------------------------------------------------------------------

## 3. Clone the repository

Open a terminal and choose a project directory.

Example:

``` powershell
cd "C:\D DRIVE\WEB DEV\PROJECTS"
```

Clone:

``` powershell
git clone https://github.com/YOUR_USERNAME/naturelens.git
```

Enter the project:

``` powershell
cd naturelens
```

If you downloaded the project as a ZIP, extract it and open the folder
containing `package.json`.

Verify:

``` powershell
dir
```

You should see files/folders such as:

``` text
app
components
lib
public
package.json
package-lock.json
.env.example
```

------------------------------------------------------------------------

# 4. Install Node dependencies

Run:

``` powershell
npm install
```

Do not run `npm audit fix --force` just because npm reports
vulnerabilities. Review dependency warnings first; forced upgrades can
introduce breaking changes.

------------------------------------------------------------------------

# 5. Configure Ollama

Install Ollama for your operating system.

Verify:

``` powershell
ollama --version
```

Check installed models:

``` powershell
ollama list
```

If Gemma 4 E4B is not installed:

``` powershell
ollama pull gemma4:e4b
```

Verify:

``` powershell
ollama list
```

You should see:

``` text
gemma4:e4b
```

------------------------------------------------------------------------

# 6. Test Gemma independently

Before starting NatureLens, test Ollama:

``` powershell
ollama run gemma4:e4b
```

When the prompt appears, type something simple such as:

``` text
Describe a green leaf in three sentences.
```

If Gemma responds, local inference is working.

Leave Ollama running while testing NatureLens.

To exit the model session:

``` text
Ctrl+C
```

You can also use Ollama as a background service depending on your
operating-system installation.

------------------------------------------------------------------------

# 7. Create `.env.local`

In the NatureLens project root, create:

``` text
.env.local
```

Do not edit `.env.example` for your local configuration.

Put this in `.env.local`:

``` env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma4:e4b
```

Your project should contain:

``` text
.env.example     ← safe to commit
.env.local       ← local only, never commit
```

The repository `.gitignore` should contain:

``` gitignore
node_modules/
.next/
.env*
!.env.example
.naturelens/
```

------------------------------------------------------------------------

# 8. Start NatureLens on the PC

Open a second terminal.

From the project root:

``` powershell
npm run dev
```

Next.js should start on:

``` text
http://localhost:3000
```

Open that address in your browser.

------------------------------------------------------------------------

# 9. Test the PC version

Test the complete flow:

``` text
Explore
  ↓
Start exploration
  ↓
Select duration
  ↓
Select focus
  ↓
Select difficulty
  ↓
Start
  ↓
Capture
  ↓
Gemma analysis
  ↓
Save discovery
```

For the first test, point the camera at a leaf or plant.

You should receive:

-   Possible identification
-   Confidence
-   What the AI noticed
-   Look closer guidance
-   Next challenge
-   Evidence guidance when necessary

------------------------------------------------------------------------

# PC Development: Recommended Three-Terminal Setup

For development, use three terminals.

### Terminal 1 --- Ollama

``` powershell
ollama run gemma4:e4b
```

### Terminal 2 --- NatureLens

``` powershell
npm run dev
```

### Terminal 3 --- Phone tunnel

Only needed when testing on the phone:

``` powershell
cloudflared tunnel --url http://localhost:3000
```

Keep all required terminals running.

------------------------------------------------------------------------

# Complete Phone Setup

The phone requires HTTPS for reliable browser camera and geolocation
behavior.

The easiest development/demo method is a Cloudflare Quick Tunnel.

## 1. Install cloudflared on Windows

Install `cloudflared` for Windows.

Verify:

``` powershell
cloudflared --version
```

If Windows says:

``` text
'cloudflared' is not recognized
```

install it and reopen your terminal so the updated PATH is available.

------------------------------------------------------------------------

# 2. Start Ollama

On the laptop:

``` powershell
ollama run gemma4:e4b
```

Leave it running.

------------------------------------------------------------------------

# 3. Start NatureLens

In another terminal:

``` powershell
npm run dev
```

Confirm that:

``` text
http://localhost:3000
```

works on the laptop.

------------------------------------------------------------------------

# 4. Start the HTTPS tunnel

Open a third terminal:

``` powershell
cloudflared tunnel --url http://localhost:3000
```

Cloudflare will display a temporary address similar to:

``` text
https://random-words.trycloudflare.com
```

Copy the HTTPS URL.

Quick Tunnels do not require a Cloudflare account and are intended for
development/testing. The generated hostname is temporary and stops
working when the `cloudflared` process stops.

------------------------------------------------------------------------

# 5. Open NatureLens on the phone

On your phone:

1.  Open Chrome.
2.  Enter the `https://...trycloudflare.com` URL from the laptop.
3.  Wait for NatureLens to load.
4.  Allow camera permission.
5.  Allow location permission.

Do **not** use:

``` text
http://localhost:3000
```

on the phone.

Do **not** use:

``` text
http://192.168.x.x:3000
```

for the recommended setup.

Use the HTTPS Cloudflare URL.

------------------------------------------------------------------------

# 6. Install NatureLens on Android

After the NatureLens HTTPS site loads:

1.  Open the Chrome menu.
2.  Select **Install app** or **Add to Home screen**.
3.  Confirm the installation.
4.  Launch NatureLens from the phone home screen.

The exact wording can vary between Android and browser versions.

------------------------------------------------------------------------

# 7. Perform a real outdoor test

Take the phone outside.

Recommended first test:

``` text
Explore
  ↓
30 minutes
  ↓
Everything
  ↓
Explorer
  ↓
Mystery Mode
  ↓
Start exploration
```

Then:

1.  Allow location.
2.  Walk outside.
3.  Point the camera outward.
4.  Find a natural object.
5.  Capture it.
6.  Wait for Gemma's local analysis.
7.  Read the observation.
8.  Follow the "Look closer" instruction.
9.  Capture another observation if requested.
10. Save the discovery.
11. Complete the quest.
12. Continue exploring.
13. End the walk.

------------------------------------------------------------------------

# Phone + Desktop Workflow

NatureLens is designed around two complementary views.

## Phone = Field Instrument

Use the phone for:

-   Camera
-   GPS
-   Exploration timer
-   Outdoor quests
-   Observations
-   Mystery Mode
-   Discovery capture

## Desktop = Field Journal

Use the desktop for:

-   Dashboard
-   Discovery map
-   Walk statistics
-   Explorer level
-   Badges
-   Saved discoveries
-   Field journal
-   Reviewing the exploration

The design principle is:

> **The phone is for noticing. The desktop is for remembering.**

------------------------------------------------------------------------

# Local Data and Vault

Browser IndexedDB storage is device-specific.

A phone browser and a laptop browser do not automatically share the same
IndexedDB database.

NatureLens therefore includes an optional local vault mechanism.

The local vault is stored on the laptop at:

``` text
.naturelens/local-vault.json
```

The `.naturelens/` directory is intentionally ignored by Git because it
can contain local user data.

For a demo, use the phone for the walk and the laptop for reviewing the
resulting data through the application's local vault workflow.

------------------------------------------------------------------------

# Production Build

Development mode:

``` powershell
npm run dev
```

Production-style build:

``` powershell
npm run build
```

Start the production server:

``` powershell
npm run start
```

The production server normally runs on:

``` text
http://localhost:3000
```

You can expose it through HTTPS for phone testing:

``` powershell
cloudflared tunnel --url http://localhost:3000
```

The production build is recommended when testing the PWA/service-worker
behavior.

------------------------------------------------------------------------

# PWA and Offline Behavior

NatureLens is an installable PWA.

The application stores important local state in IndexedDB and uses a
service worker in the production build.

However, **do not interpret this as "the entire application is always
fully offline."**

There are three different concepts:

### Local AI

Gemma inference runs locally through Ollama.

### Local storage

Discoveries and application state can be stored locally in the browser.

### Network-dependent features

Some features can still require connectivity, including:

-   Cloudflare Tunnel access from the phone
-   OpenStreetMap map tiles
-   Installing/updating the application
-   Accessing the laptop from a phone over the internet

The strongest accurate description is:

> **NatureLens is local-first and uses local open-weight AI inference.**

------------------------------------------------------------------------

# Cloudflare Quick Tunnel Security

Quick Tunnels are intended for testing and development.

Anyone who has the generated URL can access the exposed web application
while the tunnel is running.

Do not use a Quick Tunnel as a production deployment.

For a production deployment, use a properly configured Cloudflare Tunnel
with a stable hostname and appropriate access controls.

For a private demo, Cloudflare also supports email-restricted Quick
Tunnels with the `--allowed-mail` option on current versions:

``` powershell
cloudflared tunnel --url http://localhost:3000 --allowed-mail your@email.com
```

------------------------------------------------------------------------

# Troubleshooting

## `npm install` fails with dependency resolution errors

First make sure you are using the project's package-lock file.

Try:

``` powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
```

Only remove `package-lock.json` if the project instructions or
dependency state require regenerating it.

If the repository already contains a valid lockfile, prefer:

``` powershell
npm ci
```

after confirming `package.json` and `package-lock.json` are
synchronized.

------------------------------------------------------------------------

## `Ollama is not connected`

Check:

``` powershell
ollama --version
ollama list
```

Then:

``` powershell
ollama run gemma4:e4b
```

Check the local Ollama endpoint:

``` powershell
curl http://127.0.0.1:11434/api/tags
```

You should receive JSON containing the installed model.

Verify `.env.local`:

``` env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma4:e4b
```

Restart Next.js after changing `.env.local`:

``` powershell
Ctrl+C
npm run dev
```

------------------------------------------------------------------------

## `cloudflared` is not recognized

Run:

``` powershell
cloudflared --version
```

If it is not recognized:

1.  Install `cloudflared`.
2.  Close the terminal.
3.  Open a new terminal.
4.  Run `cloudflared --version` again.

Then:

``` powershell
cloudflared tunnel --url http://localhost:3000
```

------------------------------------------------------------------------

## Phone page does not open

First confirm the laptop can open:

``` text
http://localhost:3000
```

Then confirm the tunnel terminal shows a generated:

``` text
https://....trycloudflare.com
```

Use that exact HTTPS address on the phone.

Keep the tunnel terminal running.

------------------------------------------------------------------------

## Camera does not open

Check:

-   The phone is using the HTTPS URL.
-   Browser camera permission is enabled.
-   The browser is not in a restricted/private mode.
-   Another application is not currently using the camera.
-   The page has been refreshed after granting permission.

------------------------------------------------------------------------

## GPS does not work

Check:

-   Location services are enabled.
-   Browser location permission is allowed.
-   NatureLens is opened through HTTPS.
-   The phone has a location fix.
-   Retry the location control in Explore.

------------------------------------------------------------------------

## AI analysis is slow

Local multimodal inference can be slower than hosted AI APIs.

This is expected.

The application intentionally uses local inference rather than a
commercial hosted inference endpoint.

Performance depends on:

-   CPU
-   GPU
-   RAM
-   Model size
-   Image resolution
-   Current system load

------------------------------------------------------------------------

## Map errors

NatureLens uses Leaflet and OpenStreetMap.

If the map does not render:

1.  Refresh the page.
2.  Confirm network access.
3.  Check the browser console.
4.  Confirm the Leaflet container has a valid size.
5.  Test the production build if the problem only occurs in development.

------------------------------------------------------------------------

# Safety and AI Limitations

NatureLens is an exploration and observation aid.

AI identifications are **hypotheses**, not definitive scientific
identifications.

The model can be wrong.

Do not use NatureLens to determine whether an unknown plant is edible,
poisonous, medicinal, or safe to touch.

Do not:

-   Eat unknown plants.
-   Taste unknown plants.
-   Handle unknown insects or animals.
-   Approach wildlife for a better photograph.
-   Feed wildlife.
-   Disturb nests or habitats.
-   Enter restricted areas.
-   Ignore local trail or environmental rules.

The safest interaction with wildlife is observation from an appropriate
distance.

------------------------------------------------------------------------

# Privacy

In the default local-AI configuration:

-   Images are sent to the local NatureLens server.
-   The NatureLens server sends images to Ollama on the same laptop.
-   Ollama runs Gemma locally.
-   No commercial cloud AI API is required for image analysis.
-   Discoveries can remain in browser-local storage.
-   The optional vault remains on the user's laptop.
-   Ollama's default local endpoint is not directly exposed to the
    phone.
-   Map tiles may be fetched from OpenStreetMap when the map is
    displayed.

When using a Cloudflare Quick Tunnel, the NatureLens web application
itself is temporarily reachable through Cloudflare's network. The Quick
Tunnel is therefore a development/demo transport mechanism, not an
offline connection.

------------------------------------------------------------------------

# Development Commands

Install dependencies:

``` powershell
npm install
```

Start development:

``` powershell
npm run dev
```

Build:

``` powershell
npm run build
```

Start production:

``` powershell
npm run start
```

Run lint if configured:

``` powershell
npm run lint
```

Check Ollama:

``` powershell
ollama list
```

Run Gemma:

``` powershell
ollama run gemma4:e4b
```

Run phone tunnel:

``` powershell
cloudflared tunnel --url http://localhost:3000
```

------------------------------------------------------------------------

# Recommended Demo Setup

For a hackathon demonstration, use this exact setup.

### Laptop

Terminal 1:

``` powershell
ollama run gemma4:e4b
```

Terminal 2:

``` powershell
npm run dev
```

Terminal 3:

``` powershell
cloudflared tunnel --url http://localhost:3000
```

### Phone

Open the generated HTTPS URL.

Then:

``` text
Start exploration
      ↓
30 minutes
      ↓
Everything
      ↓
Explorer
      ↓
Mystery Mode
      ↓
Go outside
      ↓
Observe
      ↓
Capture
      ↓
Local Gemma analysis
      ↓
Look closer
      ↓
Save discovery
      ↓
Complete quest
```

### After the walk

Open the desktop NatureLens dashboard and show:

-   Discoveries
-   Exploration statistics
-   Map
-   Badges
-   Field journal

------------------------------------------------------------------------

# Touch Grass Demo Story

NatureLens was built for a simple reason:

**AI should sometimes help us look away from the screen.**

Instead of asking an AI endless questions from a desk, NatureLens turns
a walk into an observation mission.

The user sees something.

They capture it.

Local Gemma explains what it can see.

NatureLens gives them another clue.

The user puts the phone down.

They look closer.

That is the product.

------------------------------------------------------------------------

# Project Structure

``` text
naturelens/
│
├── app/
│   ├── api/
│   ├── explore/
│   ├── discoveries/
│   ├── journal/
│   └── dashboard/
│
├── components/
│   ├── camera/
│   ├── exploration/
│   ├── map/
│   └── ui/
│
├── lib/
│   ├── db.ts
│   ├── seed.ts
│   ├── store.ts
│   └── types.ts
│
├── public/
│
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── package-lock.json
└── README.md
```

------------------------------------------------------------------------

# Environment Variables

Create `.env.local` locally:

``` env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma4:e4b
```

Never commit:

``` text
.env.local
```

The repository should contain:

``` text
.env.example
```

but not your local environment file.

------------------------------------------------------------------------

# Open-Source / Public Repository Notes

Before pushing the project to GitHub, verify:

``` powershell
git status
```

Make sure these are not staged:

``` text
.env.local
.naturelens/
node_modules/
.next/
```

A suitable `.gitignore` includes:

``` gitignore
node_modules/
.next/
.env*
!.env.example
.naturelens/
```

Do not commit:

-   API keys
-   passwords
-   Cloudflare tunnel credentials
-   personal location data
-   personal photos
-   local vault data
-   private certificates

------------------------------------------------------------------------

# License

MIT License

See `LICENSE` for details.

------------------------------------------------------------------------

# Credits

NatureLens uses open-source and open technologies including:

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   Dexie
-   Leaflet
-   OpenStreetMap
-   Ollama
-   Gemma 4

NatureLens is an independent project built around local-first
exploration and open-weight AI.
