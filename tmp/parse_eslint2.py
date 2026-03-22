import json

with open('tmp/eslint_report2.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

with open('tmp/eslint_remaining_utf8.txt', 'w', encoding='utf-8') as out:
    for file in report:
        if file['errorCount'] > 0 or file['warningCount'] > 0:
            out.write(f"File: {file['filePath']}\n")
            for msg in file['messages']:
                out.write(f"  Line {msg.get('line', '?')}: {msg.get('message', '')} ({msg.get('ruleId', '')})\n")
