# FFWeeklyRecap 🏈📰

> **Weekly Commissioner Gazette, Matchup Sit-Reps, and Guillotine Survivor Eliminator for Sleeper Fantasy Football Leagues.**

[![Build and Publish Docker Image to GHCR](https://github.com/TheGreatMate/ffweeklyrecap/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/TheGreatMate/ffweeklyrecap/actions/workflows/docker-publish.yml)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fthegreatmate%2Fffweeklyrecap-blue?logo=docker)](https://github.com/TheGreatMate/ffweeklyrecap/pkgs/container/ffweeklyrecap)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

**FFWeeklyRecap** connects directly to the public **Sleeper Fantasy Football API** to transform weekly league results into a publication-ready, 3-page vintage newspaper ("The Weekly Gazette"), savage commissioner roast notes, side pot desk tracking, and Guillotine survivor cut reports.

Companion app engineered to run alongside the **Fantasy Football War Room** on **Unraid**, **Docker**, or any home-server environment.

---

## ✨ Features

- 📰 **The 3-Page Commissioner Gazette**:
  - **Page 1: Front Page** — Historic lead story headline, Matchup of the Week, Blowout of the Week ("The Woodchipper"), and The Heartbreaker ("Tough Luck Club").
  - **Page 2: The Honor Roll & The Shame Chamber** — High Roller, Slacker Award, Overachiever, and Bench Blunder.
  - **Page 3: League Ledger & Side Pots** — Standings, scoring streaks, playoff bubble tracker, side pot desk payouts, and waiver wire dump.
  - **One-Click Export**: Print to PDF, capture high-res PNGs, or copy raw markdown to paste into Sleeper/Discord.

- 🪓 **Chopped / Guillotine Survivor Eliminator Mode**:
  - Live cut-line visualizer.
  - Identifies the lowest-scoring team on the chopping block each week.
  - Generates death warrant obituaries and rosters about to be dumped onto the waiver wire.

- 🎭 **Multi-Tone Commissioner AI & Analytical Engine**:
  - **Savage Roast**: Pours salt in wounds and mocks benching decisions.
  - **ESPN SportsCenter**: Crisp professional broadcast journalism.
  - **The Grim Reaper**: Dark comedy celebrating eliminations and cellar-dwellers.
  - **Caesar Flickerman**: Flamboyant *Hunger Games* style survival recaps.
  - **Benevolent Commish**: Diplomatic, encouraging commissioner prose.
  - **100% Offline Capable**: Works straight out of the box with the built-in analytical engine. Optional Google Gemini integration if a key is provided.

- 💰 **Side Pot Desk**:
  - High score of the week payouts.
  - Bad beat bounties and longest bench-warmer jackpots.
  - Cumulative season totals and pending payout balance tracker.

- 🚀 **Zero-Config Sleeper Integration**:
  - Enter any Sleeper League ID or Commissioner Username to auto-discover leagues.
  - Pulls real team names, owner avatars, starter rosters, bench stashes, and real-time matchup points.

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
  <Icon>https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/newspaper.png</Icon>
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
