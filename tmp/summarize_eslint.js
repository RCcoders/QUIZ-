const fs = require('fs');
const report = JSON.parse(fs.readFileSync('eslint_report.json', 'utf8'));
const summary = report
  .filter(r => r.errorCount > 0 || r.warningCount > 0)
  .map(r => ({ file: r.filePath, errors: r.errorCount, warnings: r.warningCount, messages: r.messages.slice(0,3) }));
console.log(JSON.stringify(summary, null, 2));
