# Render Setup Guide: Resonance Platform

This guide covers how to deploy your project to Render using the `render.yaml` Blueprint.

---

## 1. Environment Variable Requirements

You will need to set these variables in the Render Dashboard after you create the project.

### Backend (Web Service)
| Variable | Description | Source |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini AI Key | [Google AI Studio](https://aistudio.google.com/) |
| `AWS_ACCESS_KEY_ID` | Part of your AWS credentials | Your `.env` file |
| `AWS_SECRET_ACCESS_KEY` | Part of your AWS credentials | Your `.env` file |
| `AWS_REGION` | Usually `eu-central-1` | Your `.env` file |

### Frontend (Static Site)
| Variable | Description | Value |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | The URL of your Render backend | Generated automatically by Render |

---

## 2. Deployment Steps

### Step A: Push to GitHub
If you haven't already, push your code to a GitHub repository:
```bash
git init
git add .
git commit -m "Add Render configuration"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step B: Launch the Blueprint
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **Blueprint** in the top navigation.
3. Click **New Blueprint Instance**.
4. Connect your GitHub repository.
5. Render will detect the `render.yaml` file and show the services to be created.
6. Click **Apply**.

### Step C: Configure Secrets
1. Once the services are created (they might fail to build the first time), go to the **resonance-backend** service.
2. Go to **Environment** tab.
3. Input the variables listed in the table above.
4. Click **Save Changes**.
5. Manually trigger a **Deploy** for both the backend and frontend.

---

## 3. Updating the S3 Trigger

Since your audio files are still stored on S3, you must update the AWS Lambda trigger:

1. Go to the [AWS Lambda Console](https://console.aws.amazon.com/lambda).
2. Open your `Resonance-S3-Trigger` function.
3. Go to **Configuration** -> **Environment variables**.
4. Update `BACKEND_API_URL` to your new Render Backend URL (e.g., `https://resonance-backend.onrender.com`).
