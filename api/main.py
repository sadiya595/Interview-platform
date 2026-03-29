from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from mangum import Mangum
import os
import json
from groq import Groq

# load_dotenv() only matters locally — Vercel injects env vars at runtime
load_dotenv()

app = FastAPI(title="Interview Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ DO NOT initialize Groq client here at module level
# It must be initialized inside each function so Vercel's
# runtime env vars are available when the function actually runs


class QuestionRequest(BaseModel):
    role: str
    level: str


class EvaluationRequest(BaseModel):
    question: str
    answer: str
    role: str
    level: str


@app.get("/api/health")
def health():
    key = os.environ.get("GROQ_API_KEY")
    return {
        "status": "API is running",
        "groq_key_present": bool(key),  # helpful debug info
    }


@app.post("/api/generate-questions")
def generate_questions(request: QuestionRequest):
    # ✅ Initialize client INSIDE the function
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    try:
        prompt = f"""You are a senior technical interviewer. 
Generate 5 interview questions for a {request.role} position at {request.level} level.

Respond with ONLY a JSON object. No markdown, no backticks, no explanation.
Use exactly these field names: id, question, category, difficulty.

{{
  "questions": [
    {{"id": 1, "question": "write question here", "category": "technical", "difficulty": "medium"}},
    {{"id": 2, "question": "write question here", "category": "behavioral", "difficulty": "easy"}},
    {{"id": 3, "question": "write question here", "category": "technical", "difficulty": "hard"}},
    {{"id": 4, "question": "write question here", "category": "situational", "difficulty": "medium"}},
    {{"id": 5, "question": "write question here", "category": "technical", "difficulty": "medium"}}
  ]
}}"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip()

        # Clean up potential markdown formatting
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        data = json.loads(raw)

        normalized = []
        for q in data.get("questions", []):
            normalized.append({
                "id": q.get("id"),
                "question": q.get("question") or q.get("title") or q.get("text", ""),
                "category": q.get("category") or q.get("type", "technical"),
                "difficulty": q.get("difficulty", "medium")
            })

        return {"questions": normalized}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON parse error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/evaluate-answer")
def evaluate_answer(request: EvaluationRequest):
    # ✅ Initialize client INSIDE the function
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    try:
        prompt = f"""You are a senior technical interviewer evaluating a candidate's answer.

Role: {request.role}
Level: {request.level}
Question: {request.question}
Candidate's Answer: {request.answer}

Evaluate this answer. Respond with ONLY a JSON object, no markdown, no backticks.

{{
  "score": <number from 0 to 10>,
  "verdict": "<one of: Strong, Acceptable, Needs Work>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "model_answer": "<a concise ideal answer in 3-5 sentences>"
}}"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        data = json.loads(raw)
        return data

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON parse error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Mangum handler for Vercel Serverless Functions
handler = Mangum(app)