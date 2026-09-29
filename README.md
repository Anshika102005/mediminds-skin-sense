# 🩺 MediMinds Skin Sense

### AI-Powered Skin Lesion Screening, Explainable AI & Skin Health Awareness Platform

MediMinds Skin Sense is a full-stack AI-powered web platform that combines **deep learning, computer vision, explainable AI, and medical awareness** to assist with preliminary skin lesion screening.

The platform uses an **EfficientNet-based CNN** trained on a 7-class skin lesion dataset and provides prediction probabilities, screening-oriented risk analysis, **Grad-CAM visual explanations**, image-quality validation, educational resources, multilingual support, and patient/dermatologist workflows.

> ⚠️ **Medical Disclaimer:** MediMinds Skin Sense is an AI-assisted screening and educational platform. It does not provide a definitive medical diagnosis and should not replace evaluation by a qualified healthcare professional.

---

## 🌟 What Makes MediMinds Different?

MediMinds is designed as more than a simple image-classification model.

It combines:

```text
                 MEDIMINDS SKIN SENSE
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   AI SCREENING    EXPLAINABLE AI    MEDICAL AWARENESS
        │                │                │
   EfficientNet       Grad-CAM       ABCDE Guide
        │                │            Prevention
   7-Class Model       Heatmaps       Treatment
        │                │          Warning Signs
        └────────────────┼────────────────┘
                         ↓
                  USER EXPERIENCE
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       Patients      Professionals    Chatbot
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                 Screening Guidance
                 + Professional Care
```

The goal is to make the AI result **understandable, safety-oriented, and useful**, rather than simply displaying a predicted class.

---

# 🚀 Key Features

## 🔬 1. AI Skin Lesion Screening

Users can upload a skin lesion image and receive an AI-assisted screening result.

The model predicts among **7 skin lesion categories** and generates class probabilities that are used by the application's screening logic.

### Screening Pipeline

```text
Input Skin Image
       ↓
Image Quality Check
       ↓
Preprocessing
       ↓
Data Augmentation
       ↓
EfficientNet CNN
       ↓
7-Class Prediction
       ↓
Probability Analysis
       ↓
Screening Policy
       ↓
Result + Guidance
```

---

## 🧠 2. EfficientNet Deep Learning Model

The machine learning system uses **EfficientNet** as the CNN backbone with transfer learning.

Instead of training an entire CNN from scratch, the project starts from pretrained visual features and adapts the network to the skin lesion classification task.

### Training Strategy

```text
Pretrained EfficientNet
          ↓
Stage 1
Frozen Backbone
+
Train Classification Head
          ↓
Stage 2
Fine-Tune Upper Layers
          ↓
Validation
          ↓
Threshold Analysis
          ↓
Final Evaluation
```

This two-stage strategy helps the model learn task-specific skin lesion features while leveraging pretrained image representations.

---

# 🔥 3. Explainable AI — Grad-CAM

A major component of MediMinds is **Explainable AI (XAI)**.

Instead of showing only:

```text
Prediction: Lesion Class X
```

the platform can generate a **Grad-CAM heatmap** showing image regions that contributed to the model's prediction.

### Grad-CAM Workflow

```text
Skin Lesion Image
        ↓
EfficientNet
        ↓
Model Prediction
        ↓
Gradient Information
        ↓
Grad-CAM
        ↓
Activation Heatmap
        ↓
Visual Explanation
```

This provides a way to inspect the visual evidence associated with the model prediction.

> Grad-CAM is an interpretability technique and should not be interpreted as proof that a highlighted region represents a medically diagnostic feature.

---

# 🛡️ 4. Image Quality Validation

Before performing screening, the backend performs image-quality checks.

This helps reduce unreliable predictions caused by unsuitable input images.

The workflow is:

```text
Uploaded Image
      ↓
Image Quality Check
      ↓
Valid Image?
   ↙       ↘
 NO         YES
 ↓           ↓
Request     Model
Better      Inference
Image
```

---

# 🎯 5. Risk-Aware Screening Logic

The application does not simply treat the highest class probability as a medical diagnosis.

A dedicated screening policy is used to interpret model outputs according to predefined thresholds and screening rules.

The project includes threshold-analysis utilities for evaluating different operating points.

### Example

```text
Model Probabilities
        ↓
Threshold Analysis
        ↓
Screening Policy
        ↓
User-Facing Result
        ↓
Professional Evaluation Guidance
```

This separates the **ML prediction layer** from the **application screening layer**.

---

# 📊 6. Model Evaluation

The ML pipeline contains a dedicated evaluation system.

It generates:

* Confusion matrices
* Normalized confusion matrices
* Per-class metrics
* ROC curves
* Training curves
* Training history
* Threshold sweeps
* Malignant screening analysis
* Overfitting reports
* Dataset inspection reports
* Test reports

Example evaluation artifacts:

```text
ml/artifacts/
│
├── evaluation/
│   ├── confusion_matrix_test.png
│   ├── confusion_matrix_test_normalized.png
│   ├── per_class_metrics_test.png
│   ├── roc_curves_test.png
│   ├── test_report.json
│   ├── test_referral_t0.35.json
│   ├── val_threshold_sweep.json
│   └── ...
│
├── training_curves.png
├── training_history.json
├── training_log.csv
├── overfitting_report.json
└── dataset_inspection_report.json
```

This makes the ML development process easier to inspect and reproduce.

---

# 🩺 7. Skin Health Awareness

MediMinds also contains an educational section covering important skin-health topics.

### Included Resources

* Skin lesion types
* Skin cancer awareness
* Warning signs
* ABCDE guide
* Prevention
* Treatment information
* Screening guidance
* Medical disclaimer
* Professional-care guidance

The platform is designed to help users understand **when professional evaluation may be appropriate**.

---

# 🔤 8. ABCDE Warning Signs

The application provides an interactive ABCDE guide for skin-lesion awareness.

```text
A → Asymmetry
B → Border
C → Color
D → Diameter
E → Evolving
```

The guide is intended as an educational awareness tool and not as a standalone diagnostic method.

---

# 🤖 9. AI Chatbot

MediMinds includes an interactive chatbot interface designed around skin-health-related questions.

Users can ask about topics such as:

* Skin lesion awareness
* Warning signs
* Prevention
* General skin-health information
* Screening-related questions
* Treatment information
* When to consider professional evaluation

The chatbot is positioned as an **educational assistant**, not a replacement for a dermatologist.

---

# 🌐 10. Multilingual Support

MediMinds supports multilingual content with English and Hindi interfaces.

The project includes dedicated translation resources:

```text
src/lib/
├── translationsEn.ts
└── translationsHi.ts
```

This allows important information to be presented in a more accessible format for users.

---

# 👥 11. Patient & Professional Workflows

The platform includes role-based workflows for different users.

### Patient Workflow

```text
Patient
  ↓
Authentication
  ↓
Patient Dashboard
  ↓
Upload Lesion
  ↓
AI Screening
  ↓
Result
  ↓
Educational Guidance
  ↓
Professional Care
```

### Professional Workflow

```text
Professional
     ↓
Authentication
     ↓
Professional Dashboard
     ↓
Patient / Screening Information
     ↓
Professional Workflow
```

---

# 📅 12. Dermatologist Appointment Workflow

The application contains a dermatologist-related workflow that allows users to explore professional-care features and appointment interactions.

This connects the AI-assisted screening experience with the important next step of **professional medical evaluation**.

---

# 🏗️ System Architecture

```text
                         ┌───────────────────┐
                         │   React Frontend  │
                         │ TypeScript + Vite │
                         └─────────┬─────────┘
                                   │
                                   │ REST API
                                   ↓
                         ┌───────────────────┐
                         │   FastAPI Backend │
                         └─────────┬─────────┘
                                   │
                ┌──────────────────┼─────────────────┐
                ↓                  ↓                 ↓
        Image Quality        ML Inference       Grad-CAM
           Check                  │                 │
                                  ↓                 ↓
                           EfficientNet CNN    Heatmap
                                  │
                                  ↓
                         Screening Policy
                                  │
                                  ↓
                           Final Response
```

---

# 🧠 Machine Learning Architecture

```text
                    Skin Lesion Dataset
                           │
                           ↓
                  Dataset Inspection
                           │
                           ↓
                  Leakage Prevention
                           │
                           ↓
                Lesion-Aware Data Split
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
            Train         Val          Test
              │
              ↓
        Preprocessing
              │
              ↓
        Augmentation
              │
              ↓
      EfficientNet Backbone
              │
              ↓
        Stage 1 Training
              │
              ↓
        Stage 2 Fine-Tuning
              │
              ↓
       Model Evaluation
              │
              ↓
       Threshold Analysis
              │
              ↓
       Screening Model
```

---

# 🧰 Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* CSS
* Component-based architecture

## Backend

* Python
* FastAPI
* REST APIs
* Database integration

## Machine Learning

* Python
* TensorFlow
* Keras
* EfficientNet
* CNN
* Transfer Learning
* Image preprocessing
* Data augmentation
* Grad-CAM
* Threshold tuning
* Model evaluation

## Development

* Git
* GitHub
* npm
* Python virtual environment
* VS Code

---

# 📁 Project Structure

```text
mediminds-skin-sense/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── patients.py
│   │   │   ├── professionals.py
│   │   │   └── screening.py
│   │   │
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── gradcam.py
│   │   ├── image_quality.py
│   │   ├── inference.py
│   │   ├── main.py
│   │   └── schemas.py
│   │
│   └── requirements.txt
│
├── ml/
│   ├── artifacts/
│   ├── data/
│   ├── src/
│   │   ├── augmentation.py
│   │   ├── config.py
│   │   ├── dataset.py
│   │   ├── deploy.py
│   │   ├── evaluate.py
│   │   ├── explainability.py
│   │   ├── model.py
│   │   ├── plots.py
│   │   ├── preprocessing.py
│   │   ├── runtime.py
│   │   ├── serve.py
│   │   ├── threshold_tuning.py
│   │   └── train.py
│   │
│   ├── README.md
│   └── requirements.txt
│
├── public/
│
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── App.tsx
│   ├── App.css
│   └── index.css
│
├── .gitignore
├── package.json
├── package-lock.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/Anshika102005/mediminds-skin-sense.git
cd mediminds-skin-sense
```

---

## 2. Install Frontend Dependencies

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

The Vite development server will provide the local frontend URL.

---

# 🐍 Backend Setup

Create and activate a Python virtual environment.

### Windows

```powershell
python -m venv .venv
.venv\Scripts\activate
```

Install backend dependencies:

```powershell
pip install -r backend/requirements.txt
```

Start FastAPI:

```powershell
uvicorn backend.app.main:app --reload
```

---

# 🧠 ML Environment

Install the machine-learning dependencies:

```powershell
pip install -r ml/requirements.txt
```

The ML directory contains utilities for:

* Dataset preparation
* Preprocessing
* Augmentation
* Model training
* Evaluation
* Threshold tuning
* Explainability
* Inference
* Deployment

---

# 🔐 Environment Variables

Sensitive configuration should be stored in a local `.env` file.

Example:

```env
# Example only
API_KEY=your_api_key
DATABASE_URL=your_database_url
```

> Never commit API keys, passwords, private credentials, or other secrets to GitHub.

For collaboration, create an `.env.example` containing only variable names and safe placeholder values.

---

# 📈 ML Workflow

The project follows a complete machine-learning workflow:

```text
Dataset
   ↓
Inspection
   ↓
Cleaning / Metadata
   ↓
Leakage Prevention
   ↓
Train / Validation / Test Split
   ↓
Preprocessing
   ↓
Augmentation
   ↓
EfficientNet
   ↓
Transfer Learning
   ↓
Fine-Tuning
   ↓
Evaluation
   ↓
Threshold Tuning
   ↓
Explainability
   ↓
Inference
   ↓
FastAPI Deployment
```

---

# 🔬 Evaluation & Explainability

The project evaluates the model using multiple perspectives rather than relying on accuracy alone.

### Classification Evaluation

* Precision
* Recall
* F1-score
* Confusion Matrix
* ROC Curves
* Per-class metrics

### Screening Evaluation

* Threshold analysis
* Malignant sensitivity
* Malignant specificity
* Referral-oriented analysis

### Model Behaviour

* Training curves
* Validation curves
* Overfitting analysis
* Dataset inspection

### Explainability

* Grad-CAM
* Activation heatmaps

---

# 🔒 Data & Privacy

The repository intentionally excludes large or sensitive resources through `.gitignore`.

Excluded resources include:

```text
node_modules/
dist/
archive/
.env
*.keras
*.h5
*.tflite
runtime database files
logs
```

The raw HAM10000 image dataset is not committed to the repository because of its size and dataset-management considerations.

---

# 🎯 Project Objectives

MediMinds Skin Sense was developed around several objectives:

1. AI-Assisted Screening

Apply deep learning to skin lesion image classification.

2. Explainability

Make model predictions easier to inspect using Grad-CAM.

3. Safety-Oriented AI

Separate model predictions from screening policies and clearly communicate limitations.

4. Medical Awareness

Provide educational resources about skin lesions, warning signs, prevention, and treatment.

5. Full-Stack Integration

Connect a deep learning model with a production-style web application and FastAPI backend.

6. User-Centered Design

Provide patient, professional, multilingual, and appointment-related workflows.

🧪 Current Development Scope

MediMinds Skin Sense is an actively developed project.

The current implementation focuses on:

7-class skin lesion classification
EfficientNet transfer learning
Image-quality validation
Grad-CAM explainability
Threshold-based screening logic
FastAPI backend
React + TypeScript frontend
Patient workflows
Professional workflows
Educational content
English/Hindi support
Evaluation and ML experiment artifacts
⚠️ Medical Disclaimer

MediMinds Skin Sense is intended for educational, research, and AI-assisted screening purposes.

The AI model may produce incorrect predictions. Model outputs should not be interpreted as definitive medical diagnoses.

Users should consult a qualified dermatologist or healthcare professional for diagnosis, treatment decisions, or evaluation of suspicious skin lesions.

👩‍💻 Author
Anshika Sahu

B.Tech — Computer Science & Artificial Intelligence / Machine Learning

Interested in:

Artificial Intelligence
Machine Learning
Deep Learning
Computer Vision
Explainable AI
Generative AI
AI Engineering
⭐ Project Highlights
🧠 EfficientNet CNN
🔥 Grad-CAM Explainability
🔬 7-Class Skin Lesion Classification
🛡️ Image Quality Validation
🎯 Threshold-Based Screening
📊 Comprehensive Model Evaluation
🤖 AI Chatbot
🌐 English + Hindi Support
👤 Patient Dashboard
👩‍⚕️ Professional Workflow
📅 Appointment Workflow
⚡ React + TypeScript
🐍 FastAPI Backend
⭐ If you find this project interesting

Feel free to explore the repository, review the ML pipeline, and experiment with the application.

MediMinds Skin Sense — Bringing Deep Learning and Explainable AI into an accessible skin-health screening experience.



