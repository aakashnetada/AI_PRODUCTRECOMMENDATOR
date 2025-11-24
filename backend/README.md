Backend proxy for Product Recommendation demo

Setup
1. Copy `.env.example` to `.env` in the `backend` folder and add your `GEMINI_KEY` if you have one.
2. Install dependencies and start the backend:

```powershell
cd backend
npm install
npm start
```

The backend listens on port defined in `.env` or 5000 and exposes `POST /api/recommend`.

If no `GEMINI_KEY` is set the backend uses a simple local filter.
