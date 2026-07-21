"""
Groq AI utility — Python port of groqUtil.js
Provides: extractResumeData, generateJobDescription, generateQuestions, evaluateTechnicalTest
"""
import logging
from groq import Groq
from django.conf import settings
import json

logger = logging.getLogger(__name__)

_client = None


def get_groq_client():
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def extract_resume_data(text: str) -> dict:
    """Extract structured data from raw resume text. Mirrors extractResumeDataWithGroq."""
    prompt = f"""
You are an expert HR AI assistant. Your task is to extract structured information from the provided resume text.
Return the information strictly in JSON format. Do not add any extra text or markdown formatting.
If a field is not found, set its value to null.

The JSON schema must be exactly as follows:
{{
  "extracted_name": "String (The full name of the candidate)",
  "extracted_email": "String (The email address of the candidate)",
  "extracted_phone": "String (The phone number of the candidate)",
  "extracted_website": "String (The personal website URL of the candidate)",
  "extracted_linkedin": "String (The LinkedIn profile URL of the candidate)",
  "extracted_github": "String (The GitHub profile URL of the candidate)",
  "education": [
    {{ "institution": "String", "degree": "String", "duration": "String" }}
  ],
  "experience": [
    {{ "company": "String", "role": "String", "duration": "String", "description": "String" }}
  ],
  "projects": [
    {{ "title": "String", "description": "String" }}
  ],
  "certifications": [
    "String (Name of the certification)"
  ],
  "summary": "String (A short summary or objective of the candidate)",
  "extracted_skills": [
    "String (Skill name)"
  ]
}}

Resume Text:
\"\"\"
{text}
\"\"\"
"""
    client = get_groq_client()
    response = client.chat.completions.create(
        messages=[{'role': 'user', 'content': prompt}],
        model='llama-3.1-8b-instant',
        temperature=0.1,
        response_format={'type': 'json_object'},
    )
    content = response.choices[0].message.content
    return json.loads(content)


def generate_job_description(title: str, skills: list, min_experience, min_education: str) -> str:
    """Generate a professional job description. Mirrors generateJobDescriptionWithGroq."""
    skills_str = ', '.join(skills) if skills else 'Not specified'
    exp_str = f'{min_experience} years' if min_experience is not None else 'Not specified'

    prompt = f"""
You are an expert HR Manager and Technical Recruiter. Write a highly professional, engaging, and clear Job Description.

Job Details:
- Job Title: {title or 'Not specified'}
- Required Skills: {skills_str}
- Minimum Experience: {exp_str}
- Minimum Education: {min_education or 'Not specified'}

Write a comprehensive job description including:
1. A brief, exciting overview of the role and its impact.
2. Key Responsibilities (bullet points).
3. Requirements & Qualifications (bullet points).
4. Why join us (a brief section on culture and growth).

Format using markdown. Keep it concise (around 200-300 words). Use "our team" instead of "[Company Name]".
Do NOT return JSON, just the raw markdown text.
"""
    client = get_groq_client()
    response = client.chat.completions.create(
        messages=[{'role': 'user', 'content': prompt}],
        model='llama-3.1-8b-instant',
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


def generate_questions(topic: str, difficulty: str) -> list:
    """Generate 10 MCQ questions on a topic. Mirrors generateQuestionWithGroq."""
    prompt = f"""
You are an expert technical interviewer. Generate 10 high-quality professional multiple-choice questions.

Topic: {topic}
Difficulty: {difficulty}

Return strictly in JSON. No extra text or markdown.
{{
  "questions": [
    {{
      "question": "String",
      "option_a": "String",
      "option_b": "String",
      "option_c": "String",
      "option_d": "String",
      "correct_answer": "Exactly one of: 'A', 'B', 'C', or 'D'"
    }}
  ]
}}

Generate exactly 10 questions. Do not include A/B/C/D in the option text itself.
"""
    client = get_groq_client()
    response = client.chat.completions.create(
        messages=[{'role': 'user', 'content': prompt}],
        model='llama-3.1-8b-instant',
        temperature=0.6,
        response_format={'type': 'json_object'},
    )
    content = json.loads(response.choices[0].message.content)
    return content.get('questions', [])


def evaluate_technical_test(answers: list) -> dict:
    """Evaluate programming test answers with Groq AI. Mirrors evaluateTechnicalTestWithGroq."""
    answers_text = '\n'.join(
        f'--- Question {i+1} ---\nQuestion: {a.get("question")}\nLanguage: {a.get("language", "Unknown")}\nCode:\n{a.get("selected_answer", "No code provided")}'
        for i, a in enumerate(answers)
    )

    prompt = f"""
You are an expert Senior Software Engineer. Review the candidate's programming test and assign an overall score out of 100.

{answers_text}

Return strictly in JSON:
{{
  "score": <integer 0-100>
}}
"""
    client = get_groq_client()
    response = client.chat.completions.create(
        messages=[{'role': 'user', 'content': prompt}],
        model='llama-3.1-8b-instant',
        temperature=0.2,
        response_format={'type': 'json_object'},
    )
    return json.loads(response.choices[0].message.content)


def compute_match_score(resume_skills: list, job_skills: list) -> dict:
    """
    Compute match score between resume skills and job required skills.
    Returns matched_skills, missing_skills, and match_score percentage.
    """
    resume_skills_lower = {s.lower() for s in (resume_skills or [])}
    job_skills_lower = [s.lower() for s in (job_skills or [])]

    matched = [s for s in job_skills_lower if s in resume_skills_lower]
    missing = [s for s in job_skills_lower if s not in resume_skills_lower]

    score = (len(matched) / len(job_skills_lower) * 100) if job_skills_lower else 0.0

    return {
        'match_score': round(score, 2),
        'matched_skills': matched,
        'missing_skills': missing,
    }
