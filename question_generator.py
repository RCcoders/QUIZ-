import json
import ollama
from pydantic import BaseModel, Field, ValidationError
import fitz  # PyMuPDF
from typing import List, Optional, Union

# Define the models required by the prompt
class QuizQuestionBase(BaseModel):
    question: str = Field(description="The multiple-choice question.")
    options: List[str] = Field(description="Exactly four options for the question.", min_length=4, max_length=4)
    correctAnswer: str = Field(description="The correct option amongst the options provided.")
    explanation: str = Field(description="Explanation must justify the correct answer clearly.")
    difficulty: str = Field(description="easy/medium/hard")

class AdaptiveQuizQuestion(QuizQuestionBase):
    topic: str = Field(description="The topic the question covers.")

# Define the unified system prompt exactly as provided by the user
SYSTEM_PROMPT = """
You are an advanced AI Academic Assistant designed for both teachers and students.

You have three core modes of operation:
1. QUIZ_GENERATOR (for teachers)
2. NOTES_GENERATOR (for students)
3. ADAPTIVE_QUIZ (for personalized learning)

----------------------------------------
GENERAL RULES (APPLY ALWAYS)
----------------------------------------
- Always follow the exact output format for each mode
- Do not include extra text outside the required format
- Keep responses structured, clean, and machine-readable where required
- Ensure accuracy and educational value
- Avoid repetition
- Use simple and clear language unless complexity is required

----------------------------------------
MODE 1: QUIZ_GENERATOR
----------------------------------------
Input:
- topic
- number_of_questions
- difficulty (easy / medium / hard)

Output (STRICT JSON ARRAY):
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "string",
    "explanation": "string",
    "difficulty": "easy/medium/hard"
  }
]

Rules:
- Questions must test understanding, not memorization
- Only one correct answer
- Explanation must justify the correct answer clearly

----------------------------------------
MODE 2: NOTES_GENERATOR
----------------------------------------
Input:
- topic

Output (STRUCTURED TEXT):
1. Key Concepts (bullet points)
2. Explanation (clear and simple)
3. Important Questions (minimum 5)
4. Summary (short)

Rules:
- Focus on exam-relevant content
- Keep it concise but informative
- Highlight important ideas

----------------------------------------
MODE 3: ADAPTIVE_QUIZ
----------------------------------------
Input:
- weak_topics (array of topics)
- number_of_questions

Output (STRICT JSON ARRAY):
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "string",
    "explanation": "string",
    "topic": "string",
    "difficulty": "easy/medium/hard"
  }
]

Rules:
- 50% questions from weak topics (easy to medium)
- 30% medium difficulty from related areas
- 20% hard questions
- Gradually increase difficulty
- Avoid repeating concepts

----------------------------------------
EXECUTION INSTRUCTION
----------------------------------------
- Read user input carefully
- Identify the mode
- Generate output strictly according to that mode
- Do not mix formats between modes
"""

class AcademicAssistant:
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name

    def extract_text_from_pdf(self, file_path: str) -> str:
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            return text
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {e}")

    def call_ollama(self, user_prompt: str, expect_json: bool = False) -> str:
        try:
            # We enforce JSON output strictly if the mode requires it.
            # Using format='json' requires your ollama model to officially support structured JSON.
            format_opt = 'json' if expect_json else ''
            response = ollama.chat(
                model=self.model_name,
                messages=[
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user', 'content': user_prompt}
                ],
                format=format_opt
            )
            return response['message']['content'].strip()
        except Exception as e:
            print(f"Error communicating with Ollama: {e}")
            raise

    def generate_quiz(self, topic_or_context: str, num_questions: int = 5, difficulty: str = "medium") -> str:
        """Mode 1: QUIZ_GENERATOR"""
        user_prompt = f"MODE: QUIZ_GENERATOR\ntopic: {topic_or_context}\nnumber_of_questions: {num_questions}\ndifficulty: {difficulty}"
        
        content = self.call_ollama(user_prompt, expect_json=True)
        
        try:
            json_list = json.loads(content)
            # Remove any top level keys if the model inadvertently wrapped it
            if isinstance(json_list, dict) and "questions" in json_list:
                json_list = json_list["questions"]
                
            # Pydantic validation to ensure exactly what the prompt demanded
            validated_questions = [QuizQuestionBase(**q).model_dump() for q in json_list]
            return json.dumps(validated_questions, indent=2)
        except Exception as e:
            print("Failed to parse/validate JSON from model response:", content)
            raise e

    def generate_notes(self, topic_or_context: str) -> str:
        """Mode 2: NOTES_GENERATOR"""
        user_prompt = f"MODE: NOTES_GENERATOR\ntopic: {topic_or_context}"
        # No strict JSON format here since the output is STRUCTURED TEXT
        return self.call_ollama(user_prompt, expect_json=False)

    def generate_adaptive_quiz(self, weak_topics: List[str], num_questions: int = 5) -> str:
        """Mode 3: ADAPTIVE_QUIZ"""
        topics_str = json.dumps(weak_topics)
        user_prompt = f"MODE: ADAPTIVE_QUIZ\nweak_topics: {topics_str}\nnumber_of_questions: {num_questions}"
        
        content = self.call_ollama(user_prompt, expect_json=True)
        
        try:
            json_list = json.loads(content)
            if isinstance(json_list, dict) and "questions" in json_list:
                json_list = json_list["questions"]
                
            validated_questions = [AdaptiveQuizQuestion(**q).model_dump() for q in json_list]
            return json.dumps(validated_questions, indent=2)
        except Exception as e:
            print("Failed to parse/validate JSON from model response:", content)
            raise e

    # Helper methods for PDF handling using the context as the 'topic'
    def generate_quiz_from_document(self, file_path: str, num_questions: int = 5, difficulty: str = "medium") -> str:
        context = self.extract_text_from_pdf(file_path)
        context = " ".join(context.split()[:3000])
        return self.generate_quiz(context, num_questions, difficulty)

    def generate_notes_from_document(self, file_path: str) -> str:
        context = self.extract_text_from_pdf(file_path)
        context = " ".join(context.split()[:3000])
        return self.generate_notes(context)
