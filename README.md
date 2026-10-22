# 📦 Product Return Prediction

A full-stack machine learning application that predicts the probability of an e-commerce order being returned based on product, seller, shipping, and customer interaction features.

🌐 **Live Demo:** [Return Prediction App](https://returnpredictor-two.vercel.app/)

📡 **Backend API:** [Render API](https://return-predictor-fwam.onrender.com/)

📚 **API Documentation:** [Interactive API Docs](https://return-predictor-fwam.onrender.com/docs)

---

## ✨ Features

- **Return Probability Prediction:** Estimates the probability that an order will be returned.
- **Risk Classification:** Categorizes predicted return probability into Low, Medium, and High risk levels.
- **Machine Learning Inference:** Uses a trained Logistic Regression model for predictions.
- **Feature Engineering:** Derives useful features from raw order data.
- **Data Preprocessing:** Applies numerical imputation, feature scaling, and categorical encoding consistent with model training.
- **Model Insights:** Exposes model performance metrics and feature importance through the API.
- **REST API:** Provides endpoints for health checks, model information, and predictions.
- **Full-Stack Deployment:** Frontend hosted on Vercel and backend hosted on Render.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| Machine Learning | scikit-learn, Logistic Regression |
| Data Processing | pandas, NumPy |
| Model Serialization | joblib |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git, GitHub |

## 🧠 Machine Learning

The model was developed in Google Colab using an e-commerce order dataset containing **12,000 records**.

The target variable is `returned`, which indicates whether an order was returned.

### Input features

The model uses information from several categories:

- **Product:** Category, subcategory, brand, rating, review count, and price.
- **Seller:** Seller rating, seller return rate, and defect rate.
- **Order:** Quantity, discount percentage, and shipping distance.
- **Delivery:** Fulfillment type and delayed-delivery status.
- **Customer engagement:** Product page views, wishlist activity, support calls, and chat interactions.
- **Additional signals:** Product, category, and brand return rates; warranty availability; fragile-item status; and payment method.

### Model development pipeline

1. Clean and prepare the dataset.
2. Split the data into stratified training and testing sets.
3. Engineer features such as `log_price` and `total_support_contacts`.
4. Impute missing numerical values and scale numerical features.
5. One-hot encode categorical features.
6. Train and evaluate multiple classification algorithms.
7. Select the best-performing model based on evaluation metrics.
8. Serialize the trained model and preprocessing artifacts using joblib.
9. Integrate the artifacts into the FastAPI inference service.

### Model evaluation

The selected Logistic Regression model achieved the following results on the held-out test set:

| Metric | Score |
|---|---:|
| Accuracy | 85.58% |
| Precision | 71.94% |
| Recall | 86.15% |
| F1-score | 78.40% |

These results reflect the model's evaluation on the test split and do not guarantee the same performance on new production data.

## 🏗️ Architecture

```text
                  User
                   |
                   v
        React + TypeScript Frontend
                   |
             HTTPS Request
                   |
                   v
             FastAPI Backend
                   |
                   v
          Input Preprocessing
                   |
                   v
         Trained Logistic Regression
                   |
                   v
          Return Probability
                   |
                   v
       Risk Level + Prediction Result
                   |
                   v
             Frontend UI
```

### Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Model artifacts:** Serialized training model, scaler, feature columns, training medians, and model metadata.

The frontend communicates with the backend through HTTP API requests. CORS is configured to allow requests from the deployed frontend origin.

## 🔌 API Endpoints

Base URL:

```text
https://return-predictor-fwam.onrender.com
```

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check API health |
| GET | `/model-info` | Retrieve model metrics, metadata, and feature importance |
| POST | `/predict` | Predict the return probability for an order |
| GET | `/docs` | Explore and test the API interactively |

### Example request

`POST /predict`

```json
{
  "product_category": "Electronics",
  "sub_category": "Laptops",
  "brand": "Brand_21",
  "product_price": 1581.93,
  "discount_percent": 30,
  "product_rating": 4.0,
  "review_count": 70,
  "fragile_item": 0,
  "warranty_available": 1,
  "product_return_rate": 0.13,
  "category_return_rate": 0.12,
  "brand_return_rate": 0.13,
  "defect_rate": 0.06,
  "seller_rating": 4.1,
  "seller_return_rate": 0.12,
  "fulfillment_type": "Marketplace Fulfilled",
  "payment_method": "UPI",
  "quantity": 1,
  "shipping_distance_km": 500,
  "delayed_delivery": 0,
  "wishlist_before_purchase": 0,
  "product_page_views": 12,
  "customer_support_calls": 0,
  "chat_interactions": 0
}
```

Use the interactive `/docs` page to verify the exact request schema supported by the deployed API.

### Example response

```json
{
  "return_probability": 0.42,
  "predicted_returned": false,
  "risk_level": "Medium"
}
```

*The response above is illustrative; actual predictions depend on the submitted order and the trained model.*

## 🚀 Run Locally

### Prerequisites

- Python 3.10 or a compatible Python version for your dependencies
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd return-predictor-app
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.venv\Scripts\Activate.ps1
```

**Linux/macOS:**

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Ensure the trained model artifact is available at the path expected by `backend/model.py`:

```text
backend/artifacts/model_data.joblib
```

Start the API:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at `http://127.0.0.1:8000`.

Interactive API documentation: `http://127.0.0.1:8000/docs`.

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Vite will display the local frontend URL, typically `http://localhost:5173`.

**Note:** Vite environment variables are loaded when the development server starts. Restart the server after modifying the environment file.

## 🌍 Production Configuration

For the deployed frontend, configure the following environment variable in Vercel:

```env
VITE_API_BASE_URL=https://return-predictor-fwam.onrender.com
```

Redeploy the frontend after changing production environment variables.

The backend must also have the trained model artifact available at runtime. Keep large model artifacts out of Git if necessary and provide them through an appropriate storage mechanism.

## 📁 Project Structure

```text
return-predictor-app/
├── backend/
│   ├── artifacts/
│   │   └── model_data.joblib
│   ├── main.py
│   ├── model.py
│   ├── schemas.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── .gitignore
└── README.md
```

The actual project structure may vary slightly depending on the deployment configuration.

## 🔮 Future Improvements

- Evaluate additional models and improve generalization.
- Add probability calibration and threshold optimization.
- Improve validation and handling of unseen categorical values.
- Add batch prediction for multiple orders.
- Expand model monitoring and performance reporting.
- Add automated testing for the preprocessing pipeline and API.
- Improve mobile responsiveness and user experience.
- Track model versions and retraining experiments.

## ⚠️ Disclaimer

This project is intended for educational and demonstration purposes. Predictions are estimates based on the training data and learned patterns; they should not be treated as guarantees of customer behavior.

## 👨‍💻 Author

**Hrishikesh Pathak**

B.Tech — Computer Science and Engineering

- GitHub: [hrishikeshpathak1009](https://github.com/hrishikeshpathak1009)

---

If you find this project useful, consider giving the repository a ⭐.
