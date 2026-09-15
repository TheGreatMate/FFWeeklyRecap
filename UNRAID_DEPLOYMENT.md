# Deploying Sleeper League Gazette to Unraid via GitHub Container Registry (GHCR)

This guide walks you through packaging this application into a Docker container, publishing it to GitHub Container Registry (GHCR), and running it on your Unraid server.

---

## 1. Export or Push this Code to GitHub

1. If you are in Google AI Studio, click the **Settings** / **Export** menu in the top right to export this app to a new repository on your GitHub account (e.g. `https://github.com/<YOUR-USERNAME>/sleeper-league-gazette`).
2. Alternatively, download the ZIP archive, initialize git locally, and push it to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Sleeper League Gazette"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/sleeper-league-gazette.git
   git push -u origin main
   ```

---

## 2. Automatic Docker Build via GitHub Actions

A pre-configured GitHub Actions workflow is located at `.github/workflows/docker-publish.yml`.

1. As soon as you push your code to GitHub, open the **Actions** tab in your GitHub repository.
2. You will see the **"Build and Publish Docker Image to GHCR"** workflow running.
3. Once completed (usually 2–3 minutes), the Docker image will be published to your GitHub Container Registry:
   ```text
   ghcr.io/<YOUR-USERNAME>/sleeper-league-gazette:latest
   ```
4. **Make the image public (Recommended for easy Unraid pull):**
   - On GitHub, go to your repository's main page.
   - On the right sidebar, click on **Packages** (or go to your GitHub profile -> **Packages** -> `sleeper-league-gazette`).
   - Click **Package settings** -> scroll down to **Danger Zone** -> click **Change visibility** -> select **Public**.
   *(If kept private, you would need to run `docker login ghcr.io` in the Unraid terminal once).*

---

## 3. Install on Unraid (3 Methods)

### Method A: Standard Unraid Docker GUI (Easiest)

1. Open your **Unraid WebGUI** and navigate to the **Docker** tab.
2. Scroll to the bottom and click **Add Container**.
3. Fill in the following fields:
   - **Name**: `sleeper-league-gazette`
   - **Repository**: `ghcr.io/<YOUR-USERNAME>/sleeper-league-gazette:latest` *(lowercase username)*
   - **WebUI**: `http://[IP]:[PORT:3000]/`
   - **Icon URL**: `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/newspaper.png`
4. Add the Web Port:
   - Click **+ Add another Path, Port, Variable, label or device**.
   - **Config Type**: `Port`
   - **Name**: `Web UI Port`
   - **Container Port**: `3000`
   - **Host Port**: `3000` *(or choose an unused port on your server like `3080`)*
   - **Connection Type**: `TCP`
   - Click **Add**.
5. (Optional) Add Gemini API Key for AI Commissioner Notes:
   - Click **+ Add another Path, Port, Variable, label or device**.
   - **Config Type**: `Variable`
   - **Name**: `Gemini API Key`
   - **Key**: `GEMINI_API_KEY`
   - **Value**: *(your Gemini API key, or leave blank — the app works fully with rule-based notes without it)*
   - Click **Add**.
6. Click **Apply** at the bottom. Unraid will pull the image from GHCR and start the container.
7. Click the container icon and select **WebUI** to open your Sleeper League Gazette!

---

### Method B: Using the Unraid XML Template

1. Copy the included `unraid-template.xml` file to your Unraid flash drive:
   ```text
   /boot/config/plugins/dockerMan/templates-user/my-sleeper-league-gazette.xml
   ```
2. Replace `YOUR_GITHUB_USERNAME` inside that file with your actual GitHub username.
3. In Unraid, go to **Docker** -> **Add Container**.
4. In the **Template** dropdown at the top, select `sleeper-league-gazette`.
5. All ports, icons, and settings will auto-populate. Click **Apply**.

---

### Method C: Docker Compose on Unraid

If you have the **Docker Compose Manager** plugin installed from Unraid Community Applications:

1. Go to **Docker** -> **Compose**.
2. Add a new stack named `sleeper-gazette`.
3. Paste the contents of `docker-compose.yml`:
   ```yaml
   services:
     sleeper-league-gazette:
       image: ghcr.io/<YOUR-USERNAME>/sleeper-league-gazette:latest
       container_name: sleeper-league-gazette
       restart: unless-stopped
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - GEMINI_API_KEY=
   ```
4. Click **Update Stack** and **Start Stack**.

---

## 4. Keeping Your Container Updated on Unraid

Whenever you push changes or new features to your GitHub repository:
- GitHub Actions automatically builds and tags the new `:latest` image.
- In Unraid, go to the **Docker** tab and click **Check for Updates**, or click the container icon and select **Update**.
