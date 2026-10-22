# Product Return Predictor

Starter full-stack application using your existing `model_data.joblib` artifact.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Pydantic + scikit-learn + joblib
- Model: your trained `model_data.joblib`

## Project structure

```text
return-predictor-app/
├── backend/
│   ├── artifacts/
│   │   └── model_data.joblib   # copy your downloaded artifact here
│   ├── main.py
│   ├── model.py
│   ├── schemas.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── styles.css
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## 1. Add your trained model

Copy the `model_data.joblib` downloaded from Colab into:

`backend/artifacts/model_data.joblib`

The file is not included in this ZIP because it was not attached to this conversation.

## 2. Run the backend locally

From the project directory:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

macOS/Linux:
```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend URLs:
- API: http://127.0.0.1:8000
- Interactive API docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

## 3. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will show the local frontend URL (usually http://localhost:5173).

The frontend uses `VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:8000`.
To override it, create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 4. Important model compatibility note

The API fields mirror the raw columns used by the notebook, excluding `order_id` and the target `returned`. The model code recreates `total_support_contacts` and `log_price` before scaling/encoding.

Before relying on predictions, test at least one known row from the held-out test set and confirm the API probability matches the notebook probability (within rounding). Also confirm that all input fields are available at the time you want to predict a return; post-shipment information can cause data leakage.

## 5. Deployment outline

- Deploy `backend/` as a Python web service (e.g. Render). Add the artifact at `backend/artifacts/model_data.joblib`, install `requirements.txt`, and use:
  `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Deploy `frontend/` to Vercel. Set `VITE_API_BASE_URL` to the public backend URL, without a trailing slash.
- Set `FRONTEND_ORIGINS` on the backend to the exact deployed frontend origin, e.g. `https://your-app.vercel.app`.

Do not deploy until the local API can load the artifact and return a prediction successfully.
