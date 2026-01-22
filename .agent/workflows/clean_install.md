---
description: Clean and reinstall dependencies
---

This workflow removes `node_modules` and `package-lock.json` and reinstalls dependencies. Use this if you encounter strange dependency issues.

1. Remove node_modules and lock file (Windows)
```bash
rm -Recurse -Force node_modules
rm -Force package-lock.json
```

2. Install dependencies
// turbo
```bash
npm install
```
