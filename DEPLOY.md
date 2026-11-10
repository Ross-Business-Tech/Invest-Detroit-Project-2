# Putting the app online: everything on Render

Render hosts two things from this repository, both described in `render.yaml`:
the **backend** (Python, reads the documents) and the **website** (the pages people see).
The website needs the backend's address, so you fill it in after the first deploy.

## 1. Create both on Render
1. In Render: **New > Blueprint**, pick this GitHub repository and the branch `main`.
2. When asked for values, enter:
   - `ANTHROPIC_API_KEY` (backend): your Anthropic key. Type it only into Render's page. Never put it in GitHub or in chat.
   - `ALLOWED_ORIGINS` (backend): leave empty for now.
   - `VITE_API_BASE` (website): leave empty for now.
3. Click **Apply**. Render builds both. The backend finishes first.
4. Copy the backend's address (service `invest-detroit-underwriter-api`), like `https://invest-detroit-underwriter-api.onrender.com`.
   Open it with `/api/status` on the end. You should see `"llm_available": true`.

## 2. Point the website at the backend
1. Open the **website** service (`invest-detroit-underwriter`) > **Environment**.
2. Set `VITE_API_BASE` to the backend address from 1.4, with no slash at the end. Save.
3. Choose **Manual Deploy > Deploy latest commit** so the website is rebuilt with it.
4. Copy the website's address, like `https://invest-detroit-underwriter.onrender.com`.

## 3. Lock the backend to your website
Open the backend service > **Environment**, set `ALLOWED_ORIGINS` to the website address from 2.4, and save.

## Good to know
- The free backend sleeps after 15 idle minutes. The first visit afterwards takes about a minute; the Analyze page says so. The website itself is static and always opens fast.
- Uploaded files and drafts live on a temporary disk. They vanish when the backend restarts or after 24 hours.
- This is a demo: use fictional documents only.
- Any change to `VITE_API_BASE` needs a redeploy of the website.
