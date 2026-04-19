# Resonance Platform: Deployment Guide

This guide provides step-by-step instructions to host the Resonance platform in a production-ready environment.

---

## 1. Backend: AWS Lambda Deployment

We have configured the FastAPI backend to run as an AWS Lambda function using the `Mangum` adapter.

### Step A: Prepare the Deployment Package
1. **Open a terminal** in the `backend` directory.
2. **Install dependencies locally**:
   ```bash
   pip install -r requirements.txt -t .
   ```
3. **Zip the contents**:
   - Select all files in the `backend` folder (except `__pycache__` and `app.log`) and zip them into `backend_lambda.zip`.
   - **Important**: The zip root must contain `main.py`.

### Step B: Create the Lambda Function
1. Go to the [AWS Management Console](https://console.aws.amazon.com/lambda).
2. Click **Create function**.
3. **Function name**: `Resonance-Backend-API`.
4. **Runtime**: `Python 3.12` (or your current version).
5. **Permissions**: Create a new role with basic Lambda permissions.
6. Upload the `backend_lambda.zip` file.

### Step C: Configure Function URL & Env Vars
1. Click **Configuration** -> **Function URL** -> **Create Function URL**.
   - **Auth Type**: `NONE` (for public API access - ensure CORS is strictly configured in code).
2. Click **Configuration** -> **Environment variables**. Add:
   - `GEMINI_API_KEY`: [Your Google Gemini API Key]
   - `AWS_REGION`: `eu-central-1` (or your preferred region)
3. **IAM Permissions**: Attach `AmazonS3FullAccess` and `AmazonTranscribeFullAccess` to the Lambda's execution role so it can interact with your bucket and transcription jobs.

---

## 2. Frontend: Vercel Deployment

Vercel is the recommended platform for hosting Vite-based React applications.

### Step A: Push to GitHub
1. Create a private repository on GitHub.
2. Push your project to the repository:
   ```bash
   git init
   git add .
   git commit -m "Prepare for hosting"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

### Step B: Deploy on Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
2. Import your GitHub repository.
3. **Environment Variables**: Add the following:
   - `VITE_BACKEND_URL`: [Your AWS Lambda Function URL from Part 1]
4. Click **Deploy**.

---

## 3. S3 Integration (Final Step)

Now, update your S3 event trigger to point to the new hosted backend.

1. **Upload the S3 Trigger Lambda**:
   - Zip `backend/lambda_function.py`.
   - Create a Lambda named `Resonance-S3-Trigger`.
   - Add Environment Variable: `BACKEND_API_URL` = [Your AWS Lambda Function URL].
2. **Configure S3 Event**:
   - Go to your S3 bucket `resonance-audio-uploads-...`.
   - **Properties** -> **Event notifications** -> **Create event notification**.
   - **Event types**: `All object create events`.
   - **Destination**: `Lambda Function` -> `Resonance-S3-Trigger`.

---

## Summary of URLs

| Component | Variable Name in Config | URL Example |
| :--- | :--- | :--- |
| **Backend API** | `VITE_BACKEND_URL` | `https://random-id.lambda-url.eu-central-1.on.aws/` |
| **S3 Trigger** | `BACKEND_API_URL` | Same as above |
