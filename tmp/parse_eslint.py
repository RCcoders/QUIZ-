import json

with open('eslint_report.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

for file in report:
    if file['errorCount'] > 0 or file['warningCount'] > 0:
        print(f"File: {file['filePath']}")
        for msg in file['messages']:
            print(f"  Line {msg.get('line', '?')}: {msg.get('message', '')} ({msg.get('ruleId', '')})")

