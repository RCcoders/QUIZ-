import argparse
from question_generator import AcademicAssistant

def main():
    parser = argparse.ArgumentParser(description="Test Ollama Academic Assistant locally")
    parser.add_argument('--mode', type=str, required=True, choices=['quiz', 'notes', 'adaptive'], 
                        help="Mode of operation: quiz, notes, adaptive")
    parser.add_argument('--topic', type=str, help="Topic for quiz or notes")
    parser.add_argument('--file', type=str, help="Path to PDF document for quiz or notes")
    parser.add_argument('--weak-topics', type=str, help="Comma-separated weak topics for adaptive mode")
    parser.add_argument('--difficulty', type=str, default='medium', choices=['easy', 'medium', 'hard'], help="Difficulty for quiz mode")
    parser.add_argument('--count', type=int, default=3, help="Number of questions to generate (for quiz/adaptive modes)")
    parser.add_argument('--model', type=str, default='llama3', help="Ollama model to use")
    
    args = parser.parse_args()
    
    assistant = AcademicAssistant(model_name=args.model)
    
    if args.mode == 'quiz':
        print(f"Generating {args.count} {args.difficulty} questions using model {args.model}")
        if args.topic:
            result = assistant.generate_quiz(args.topic, num_questions=args.count, difficulty=args.difficulty)
        elif args.file:
            result = assistant.generate_quiz_from_document(args.file, num_questions=args.count, difficulty=args.difficulty)
        else:
            print("Error: --topic or --file required for quiz mode.")
            return
        print("\nResult:")
        print(result)

    elif args.mode == 'notes':
        print(f"Generating notes using model {args.model}")
        if args.topic:
            result = assistant.generate_notes(args.topic)
        elif args.file:
            result = assistant.generate_notes_from_document(args.file)
        else:
            print("Error: --topic or --file required for notes mode.")
            return
        print("\nResult:")
        print(result)

    elif args.mode == 'adaptive':
        print(f"Generating {args.count} adaptive questions using model {args.model}")
        if args.weak_topics:
            topics_list = [t.strip() for t in args.weak_topics.split(',')]
            result = assistant.generate_adaptive_quiz(weak_topics=topics_list, num_questions=args.count)
            print("\nResult:")
            print(result)
        else:
            print("Error: --weak-topics required for adaptive mode. Example: --weak-topics 'math,physics'")
            return

if __name__ == "__main__":
    main()
