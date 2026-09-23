# FFWeeklyRecap 🏈📰

> **Weekly Commissioner Gazette, Matchup Sit-Reps, and Guillotine Survivor Eliminator for Sleeper Fantasy Football Leagues.**

[![Build and Publish Docker Image to GHCR](https://github.com/TheGreatMate/ffweeklyrecap/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/TheGreatMate/ffweeklyrecap/actions/workflows/docker-publish.yml)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fthegreatmate%2Fffweeklyrecap-blue?logo=docker)](https://github.com/TheGreatMate/ffweeklyrecap/pkgs/container/ffweeklyrecap)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

**FFWeeklyRecap** connects directly to the public **Sleeper Fantasy Football API** to transform weekly league results into a publication-ready, 3-page vintage newspaper ("The Weekly Gazette"), savage commissioner roast notes, side pot desk tracking, and Guillotine survivor cut reports.

Companion app engineered to run alongside the **Fantasy Football War Room** on **Unraid**, **Docker**, or any home-server environment.

---

## ✨ Features

- 📰 **The 3-Page Commissioner Gazette** (Head-to-Head leagues):
  - **Page 1: Front Page** — Masthead, lead headline and story, press photo, Blowout of the Week, GM of the Week, Galaxy Brain Move, standings, and the Unlucky Bastard Club (highest losing score).
  - **Page 2: The Week Ledger** — Matchup ledger, final points leaderboard, and the Side Pot Desk.
  - **Page 3: Rankings & Notebook** — Hindsight 20/20 bench regrets, power rankings, and the Commissioner's Notebook (Fraud Watch, Hot Seat, Waiver Wire, Game of the Week).
  - **Export**: Save a full-bleed dark-mode PDF, print, save a standalone HTML file, or copy/download Markdown to paste into Sleeper or Discord.

- 🪓 **Chopped / Guillotine Survivor Mode**:
  - Identifies the lowest-scoring team chopped each week, plus the Apex Survivor, Narrow Escape, and Danger Zone.
  - Hall of the Fallen tracks every prior week's eliminated team.
  - Highlights the top players from the chopped roster heading to waivers.

- 🎭 **Multi-Tone Commissioner Notes**:
  - Head-to-Head: Savage Roast, ESPN SportsCenter Anchor, Benevolent Commish, Gladiatorial Hype, RNG Conspiracy Theorist.
  - Chopped: The Executioner / Grim Reaper, Hunger Games Announcer, plus Roast, SportsCenter, and Commish variants.
  - **Works offline**: The built-in engine needs no API key. Add a Google Gemini key (server env var or in the app) for AI-written notes.

- 💰 **Side Pot Desk**:
  - Configurable entry fee and pot size.
  - Weekly high-score and biggest-blowout bounties.

- 🚀 **Zero-Config Sleeper Integration**:
  - Enter a Sleeper username or League ID to find leagues for the 2024–2026 seasons.
  - Pulls real team names, owner avatars, starters, benches, and matchup points.
  - Not ready to connect? Hit **Try a Demo** on the landing page.

---

## 🐳 Quick Start with Docker

Run directly with Docker CLI:

```bash
docker run -d \
  --name=FFWeeklyRecap \
  --net=bridge \
  -p 3085:3000 \
  -v /mnt/user/appdata/ffweeklyrecap:/config \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --restart=unless-stopped \
  ghcr.io/thegreatmate/ffweeklyrecap:latest
```

Open your browser to:
```text
http://<YOUR-SERVER-IP>:3085
```

---

## 🎛️ Unraid Installation

### Method 1: Drop-In Template (Recommended)

1. Open your Unraid **Web Terminal** (`>_` in the top right of Unraid WebGUI).
2. Paste this command and hit Enter:

```bash
cat << 'EOF' > /boot/config/plugins/dockerMan/templates-user/my-ffweeklyrecap.xml
<?xml version="1.0"?>
<Container version="2">
  <Name>FFWeeklyRecap</Name>
  <Repository>ghcr.io/thegreatmate/ffweeklyrecap:latest</Repository>
  <Registry>https://ghcr.io</Registry>
  <Network>bridge</Network>
  <Shell>sh</Shell>
  <Privileged>false</Privileged>
  <Overview>FFWeeklyRecap — Weekly Fantasy Football Commissioner Gazette and Situational Report for Sleeper leagues.</Overview>
  <Category>Tools: MediaApp:Other Status:Stable</Category>
  <WebUI>http://[IP]:[PORT:3085]/</WebUI>
  <Icon>https://raw.githubusercontent.com/TheGreatMate/ffweeklyrecap/main/public/icon.png</Icon>
  <Networking>
    <Mode>bridge</Mode>
    <Publish>
      <Port>
        <HostPort>3085</HostPort>
        <ContainerPort>3000</ContainerPort>
        <Protocol>tcp</Protocol>
      </Port>
    </Publish>
  </Networking>
  <Data>
    <Volume>
      <HostDir>/mnt/user/appdata/ffweeklyrecap</HostDir>
      <ContainerDir>/config</ContainerDir>
      <Mode>rw</Mode>
    </Volume>
  </Data>
  <Environment>
    <Variable>
      <Value>production</Value>
      <Name>NODE_ENV</Name>
      <Mode/>
    </Variable>
    <Variable>
      <Value>3000</Value>
      <Name>PORT</Name>
      <Mode/>
    </Variable>
  </Environment>
  <Config Name="WebUI Port" Target="3000" Default="3085" Mode="tcp" Description="Web interface port" Type="Port" Display="always" Required="true" Mask="false">3085</Config>
  <Config Name="Appdata Storage Path" Target="/config" Default="/mnt/user/appdata/ffweeklyrecap" Mode="rw" Description="Persistent storage directory on Unraid" Type="Path" Display="always" Required="false" Mask="false">/mnt/user/appdata/ffweeklyrecap</Config>
  <Config Name="Gemini API Key" Target="GEMINI_API_KEY" Default="" Mode="" Description="Optional: Leave blank to use built-in engine" Type="Variable" Display="always" Required="false" Mask="true"/>
  <Config Name="Node Environment" Target="NODE_ENV" Default="production" Mode="" Description="Runtime environment mode" Type="Variable" Display="advanced" Required="false" Mask="false">production</Config>
</Container>
EOF
```

3. In Unraid, go to **Docker** -> **Add Container**.
4. In the **Template** dropdown, choose **`my-ffweeklyrecap`**.
5. All ports (`3085`), paths (`/mnt/user/appdata/ffweeklyrecap`), and icons auto-populate. Click **Apply**!

---

### Method 2: Docker Compose

If using the Unraid Docker Compose Manager:

```yaml
services:
  ffweeklyrecap:
    image: ghcr.io/thegreatmate/ffweeklyrecap:latest
    container_name: ffweeklyrecap
    restart: unless-stopped
    ports:
      - "3085:3000"
    volumes:
      - /mnt/user/appdata/ffweeklyrecap:/config
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY= # Optional
```

---

## ⚙️ Configuration & Environment Variables

| Variable | Required? | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `3000` | Internal server port (mapped to host `3085`). |
| `NODE_ENV` | No | `production` | Node execution environment. |
| `GEMINI_API_KEY` | **Optional** | *(empty)* | Optional Gemini API key. If omitted, the app uses its built-in analytical engine with zero external API calls. |
| `DATA_DIR` | No | `/config` | Where the Sleeper player dictionary is cached (refreshed every 24h). Falls back to `/config`, then the system temp folder, if not writable. |

### Persistent storage

The app caches Sleeper's NFL player dictionary (about 1 MB) in `/config` so it survives container restarts. The container runs as a non-root user (UID `1001`), so the host folder must be writable by that user:

```bash
chown -R 1001:1001 /mnt/user/appdata/ffweeklyrecap
```

If the folder isn't writable, the app still works. It logs a warning, caches to the container's temp folder instead, and downloads the dictionary again after each restart.

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/TheGreatMate/ffweeklyrecap.git
cd ffweeklyrecap

# Install dependencies
npm install

# Start the development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 📄 License

MIT © [TheGreatMate](https://github.com/TheGreatMate)
