# Putting the app online: Render (backend) + Vercel (website)

Do the steps in this order, because the website needs the backend's address.

## 1. Backend on Render (free)
1. In Render: **New > Blueprint**, pick this GitHub repository and the branch you want to deploy. Render reads `render.yaml`.
2. When asked for values, enter:
   - `ANTHROPIC_API_KEY`: your Anthropic key. Type it only into Render's page. Never put it in GitHub or in chat.
   - `ALLOWED_ORIGINS`: leave empty for now (you will fill it in at step 3).
3. Wait for the first deploy. Render shows the service address, like `https://invest-detroit-underwriter-api.onrender.com`.
4. Open `<that address>/api/status` in a browser. You should see `"llm_available": true`.

## 2. Website on Vercel
1. In Vercel: **Add New > Project**, import this repository, same branch. Vercel reads `vercel.json`; keep the defaults.
2. Under **Environment Variables** add `VITE_API_BASE` = the Render address from step 1.3 (no slash at the end).
3. Deploy. Vercel shows the website address, like `https://your-app.vercel.app`.

## 3. Lock the backend to your website
In Render, open the service > **Environment**, set `ALLOWED_ORIGINS` to the Vercel address from step 2.3 and save.

## Good to know
- Render's free plan sleeps after 15 idle minutes. The first visit afterwards takes about a minute; the Analyze page says so.
- Uploaded files and drafts live on a temporary disk. They vanish when the server restarts or after 24 hours.
- This is a demo: use fictional documents only.
- If you change `VITE_API_BASE`, redeploy the Vercel project so the change takes effect.
