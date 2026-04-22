# Aegis System - Root Directory Execution

## 🚀 CORRECT STARTUP (ROOT DIRECTORY ONLY)

### 1. Start Backend from ROOT
```bash
# ✅ CORRECT - Run from project root
# P:\project\Aegis system final year>
uvicorn app.main:app --reload
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Live Detection
```bash
# ✅ CORRECT - Run from project root
python backend/test_authentication_fix.py
```

## ❌ WRONG COMMANDS (DO NOT USE)

```bash
# ❌ WRONG - Do NOT cd into backend
cd backend && uvicorn app.main:app --reload

# ❌ WRONG - Do NOT use relative paths
python ../backend/test.py
```

## 🔧 ROOT EXECUTION FIXES

### ✅ Fixed Import Issues
- All backend files now work from root execution
- Python path automatically configured
- No relative import problems

### ✅ Fixed Authentication
- Web Worker sends credentials: `credentials: 'include'`
- Backend maintains security with user authentication
- Debug logging added for troubleshooting

### ✅ Fixed Test Scripts
- All test scripts work from root directory
- Proper Python path configuration
- No import errors

## 🎯 Expected Results

✅ Backend runs from root: `P:\project\Aegis system final year>`  
✅ No import errors  
✅ Live detection works with authentication  
✅ Surveillance logs created  
✅ All existing features preserved  

## 📋 Files Updated

1. **Backend Import Fixes**:
   - `backend/app/api/v1/routes/live_detection.py` - Added root execution support
   
2. **Test Script Fixes**:
   - `backend/test_authentication_fix.py` - Works from root directory

3. **Frontend Maintained**:
   - `LiveMonitor.jsx` - Authentication fix preserved

## 🧪 Verification Steps

1. **Start from ROOT**:
   ```bash
   # From P:\project\Aegis system final year>
   uvicorn app.main:app --reload
   ```

2. **Test Authentication**:
   ```bash
   # From P:\project\Aegis system final year>
   python backend/test_authentication_fix.py
   ```

3. **Check Browser**:
   - Open http://localhost:5173
   - Go to Live Feed
   - Check Network tab for 200 status

## 🔍 Debug Commands

If issues persist, check:

```bash
# Backend logs (should show debug prints)
# Look for: "🎯 Live detection API called!"

# Frontend console (F12)
# Look for: "Sending frame to backend..."

# Network tab
# Filter: /api/v1/detection/live-scan
# Should see: Status 200 (not 401)
```

## 📚 Project Structure

```
P:\project\Aegis system final year\
├── backend\                    # Backend code
├── frontend\                   # Frontend code  
├── uploads\                    # File storage
├── aegis.db                   # Database
├── main.py                     # Optional root entry
├── README_ROOT.md               # This file
└── start.py                     # Optional startup script
```

**RULE: ALWAYS RUN FROM ROOT DIRECTORY**  
**COMMAND: `uvicorn app.main:app --reload`**  
**NEVER: `cd backend && uvicorn ...`**

This ensures all Python paths work correctly and no import errors occur.
