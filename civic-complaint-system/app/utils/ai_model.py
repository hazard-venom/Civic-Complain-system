from pathlib import Path

try:
    import pandas as pd
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
except ImportError:  # Keep API functional even before dependency installation
    pd = None
    TfidfVectorizer = None
    LogisticRegression = None


BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "data" / "complaints_dataset.csv"

PRIORITY_ORDER = {"Low": 1, "Medium": 2, "High": 3}

vectorizer = TfidfVectorizer() if TfidfVectorizer else None
category_model = LogisticRegression(max_iter=1000) if LogisticRegression else None
priority_model = LogisticRegression(max_iter=1000) if LogisticRegression else None
models_trained = False


def _train_models():
    global models_trained
    if models_trained:
        return
    if not pd or not vectorizer or not category_model or not priority_model:
        return

    data = pd.read_csv(DATASET_PATH)
    x = data["text"]
    y_category = data["category"]
    y_priority = data["priority"]

    x_vectorized = vectorizer.fit_transform(x)
    category_model.fit(x_vectorized, y_category)
    priority_model.fit(x_vectorized, y_priority)
    models_trained = True


def _fallback_category(text: str) -> str:
    value = text.lower()
    if any(word in value for word in ["pothole", "road", "highway", "crack"]):
        return "Road"
    if any(word in value for word in ["garbage", "dustbin", "drainage", "sanitation"]):
        return "Sanitation"
    if any(word in value for word in ["water", "leak", "supply"]):
        return "Water"
    if any(word in value for word in ["street light", "streetlight", "electric", "pole", "sparks"]):
        return "Electricity"
    return "General"


def calculate_priority_score(text: str) -> int:
    score = 0
    value = text.lower()

    if any(word in value for word in ["accident", "collision", "injury", "fire"]):
        score += 5
    if "school" in value or "hospital" in value:
        score += 3
    if any(word in value for word in ["urgent", "danger", "dangerous", "emergency"]):
        score += 4
    if any(word in value for word in ["leak", "sparks", "short circuit"]):
        score += 3
    if any(word in value for word in ["pothole", "road crack", "major crack", "sinkhole"]):
        score += 4
    if any(word in value for word in ["highway", "main road", "traffic"]):
        score += 2

    return score


def score_to_priority(score: int) -> str:
    if score >= 7:
        return "High"
    if score >= 4:
        return "Medium"
    return "Low"


def choose_higher_priority(first: str, second: str) -> str:
    if PRIORITY_ORDER.get(first, 1) >= PRIORITY_ORDER.get(second, 1):
        return first
    return second


def predict_complaint(text: str) -> tuple[str, str]:
    _train_models()
    if models_trained and vectorizer and category_model and priority_model:
        text_vec = vectorizer.transform([text])
        category = category_model.predict(text_vec)[0]
        priority = priority_model.predict(text_vec)[0]
        return category, priority

    fallback_priority = score_to_priority(calculate_priority_score(text))
    return _fallback_category(text), fallback_priority
