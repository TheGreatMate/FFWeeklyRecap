# Deploying FFWeeklyRecap (`ffweeklyrecap`) to Unraid

**FFWeeklyRecap** is the weekly situational report, commissioner gazette, and matchup recap generator for Sleeper fantasy leagues.

All ports (`3085:3000`), persistent storage paths (`/mnt/user/appdata/ffweeklyrecap`), icons, and environment variables are **pre-configured and baked in** so you do not have to manually click "Add Port" or "Add Variable" in Unraid.

---

## 1. Export Code to Your GitHub Account

1. In Google AI Studio, click **Settings / Export** (top right) -> **Export to GitHub**.
2. Name the repository:
   ```text
   ffweeklyrecap
   ```
   (Full URL will be: `https://github.com/TheGreatMate/ffweeklyrecap`)

---

## 2. Automatic Build via GitHub Actions

A pre-configured GitHub Actions workflow (`.github/workflows/docker-publish.yml`) will automatically trigger when code is pushed.

1. Go to your GitHub repository -> **Actions** tab.
2. Watch the **"Build and Publish Docker Image to GHCR"** run.
3. When it finishes (~2 minutes), your image will be published at:
   ```text
   ghcr.io/thegreatmate/ffweeklyrecap:latest
   ```
4. **Make the package public (one-time setting):**
   - In GitHub, go to your profile -> **Packages** -> select **`ffweeklyrecap`**.
   - Click **Package settings** on the right side.
   - Scroll down to **Danger Zone** -> click **Change visibility** -> select **Public**.
   *(Making it public allows your Unraid server to pull it without needing Docker login credentials).*

---

## 3. Install on Unraid (Zero-Manual-Config Methods)

### Method 1: Drop-In User Template (Recommended — 100% Baked In)

Every Unraid server has a user template folder on the USB flash drive. Placing the included template here makes all ports, paths, and settings auto-fill with zero typing:

#### Option A: Quick Command in Unraid Web Terminal
Click the terminal icon (`>_`) in Unraid and run:
```bash
cat << 'EOF' > /boot/config/plugins/dockerMan/templates-user/my-ffweeklyrecap.xml
<?xml version="1.0"?>
<Container version="2">
  <Name>FFWeeklyRecap</Name>
  <Repository>ghcr.io/thegreatmate/ffweeklyrecap:latest</Repository>
  <Registry>https://ghcr.io</Registry>
  <Network>bridge</Network>
  <MyIP/>
  <Shell>sh</Shell>
  <Privileged>false</Privileged>
  <Support>https://github.com/TheGreatMate/ffweeklyrecap/issues</Support>
  <Project>https://github.com/TheGreatMate/ffweeklyrecap</Project>
  <Overview>FFWeeklyRecap — Weekly Fantasy Football Commissioner Gazette and Situational Report for Sleeper leagues.</Overview>
  <Category>Tools: MediaApp:Other Status:Stable</Category>
  <WebUI>http://[IP]:[PORT:3085]/</WebUI>
  <Icon>https://raw.githubusercontent.com/TheGreatMate/ffweeklyrecap/main/public/icon.svg</Icon>
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
    <Variable>
      <Value/>
      <Name>GEMINI_API_KEY</Name>
      <Mode/>
    </Variable>
  </Environment>
  <Config Name="WebUI Port" Target="3000" Default="3085" Mode="tcp" Description="Web interface port for FFWeeklyRecap" Type="Port" Display="always" Required="true" Mask="false">3085</Config>
  <Config Name="Appdata Storage Path" Target="/config" Default="/mnt/user/appdata/ffweeklyrecap" Mode="rw" Description="Persistent storage directory on Unraid" Type="Path" Display="always" Required="false" Mask="false">/mnt/user/appdata/ffweeklyrecap</Config>
  <Config Name="Gemini API Key" Target="GEMINI_API_KEY" Default="" Mode="" Description="Optional: Leave blank to use built-in offline engine" Type="Variable" Display="always" Required="false" Mask="true"/>
  <Config Name="Node Environment" Target="NODE_ENV" Default="production" Mode="" Description="Runtime environment mode" Type="Variable" Display="advanced" Required="false" Mask="false">production</Config>
</Container>
EOF
```

#### Option B: Via Network Share
Open `\\YOUR-UNRAID-IP\flash\config\plugins\dockerMan\templates-user\` and copy `ffweeklyrecap.xml` inside it as `my-ffweeklyrecap.xml`.

1. In the Unraid WebGUI, go to the **Docker** tab and click **Add Container**.
2. In the **Template** dropdown at the top, select **`my-ffweeklyrecap`**.
3. **Notice that EVERYTHING is already filled in for you:**
   - **Name**: `FFWeeklyRecap`
   - **Repository**: `ghcr.io/thegreatmate/ffweeklyrecap:latest`
   - **Icon**: Pre-filled Lucide newspaper badge
   - **WebUI**: `http://[IP]:[PORT:3085]/`
   - **Port**: Host `3085` -> Container `3000` *(prevents port conflicts)*
   - **Appdata Path**: `/mnt/user/appdata/ffweeklyrecap` -> `/config`
   - **Variables**: `NODE_ENV=production`, `PORT=3000`, and `GEMINI_API_KEY` (masked, optional)
4. Click **Apply**. Unraid pulls the image and launches your container!

---

### Method 2: Docker Compose Manager on Unraid

If you use the **Docker Compose Manager** plugin from the Unraid Community Apps store:

1. Go to **Docker** -> **Compose** -> **Add New Stack** (Name: `ffweeklyrecap`).
2. Paste the contents of `docker-compose.yml`:
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
         - GEMINI_API_KEY=
   ```
3. Click **Save** -> **Update Stack** -> **Start Stack**.
   Ports and paths are automatically mapped.

---

### Method 3: One-Line Terminal Run (Direct Docker CLI)

If you don't want to use templates at all, run this in the Unraid terminal:

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

---

## 4. Baked-in Defaults Reference

| Setting | Default Value | Notes |
| :--- | :--- | :--- |
| **Container Name** | `FFWeeklyRecap` | Paired alongside `ffwarrm` |
| **Host Web Port** | `3085` | Kept on 3085 to avoid conflicting with War Room on 3000 |
| **Container Port** | `3000` | Internal Node/Express app port |
| **Appdata Storage** | `/mnt/user/appdata/ffweeklyrecap` | Host storage mapped to container `/config` |
| **WebUI URL** | `http://[IP]:[PORT:3085]/` | Direct clickable WebUI button from the Unraid Docker dashboard |
| **Health Check** | `/api/health` | Monitored by Docker every 30s |
| **Gemini API Key** | *(Optional)* | Not required. Built-in analytical engine runs 100% offline. |

---

## 5. Do You Need a Gemini API Key?

**No, you do NOT need a Gemini API Key.**

The application is engineered with a complete **two-tier architecture**:

1. **Built-in Algorithmic Engine (100% Offline & Self-Contained)**:
   - All Sleeper API roster and matchup statistics, player resolution, weekly honors (High Roller, The Woodchipper blowout, Tough Luck Bad Beat), survivor cut lines, waiver wire dumps, side pot desk, and power rankings are calculated directly by the application with zero external AI calls.
   - The Gazette Newspaper and Commissioner Notes are generated instantly using built-in analytical templates matching your selected tone (Roast, ESPN, Grim Reaper, Hunger Games, etc.).
   - No setup, no account, no cost, and zero internet calls to Gemini.

2. **Gemini AI Enhancement (Optional)**:
   - If you provide a `GEMINI_API_KEY`, the app will optionally use Google Gemini to write unique, freeform narrative prose for the commissioner notes and stories.
   - If left blank or if the key is omitted, the app smoothly generates the full report using the built-in engine with zero errors, zero warnings, and zero degradation in data.
