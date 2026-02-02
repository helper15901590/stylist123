<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ruGMpuGWgViGq7xkDn-cKuauobsWQNIR

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `DASHSCOPE_API_KEY` in [.env](.env) to your Alibaba DashScope API key
3. Run the app:
   `npm run dev` (Frontend)
   `node server/index.js` (Backend Proxy)

## Deployment

This project is ready for server deployment using Docker.

1. Build the image:
   `docker build -t ai-virtual-stylist .`
2. Run the container:
   `docker run -d -p 5000:5000 --env-file .env ai-virtual-stylist`

