# 🔧 Frontend Button Issues - Troubleshooting Guide

## Quick Diagnosis

If buttons on the frontend aren't working, follow these steps:

---

## Step 1: Check if Backend is Running

### Windows PowerShell:
```powershell
cd C:\path\to\garryOS
.\scripts\start-dev.ps1
```

### Windows CMD:
```cmd
cd C:\path\to\garryOS
scripts\start-dev.bat
```

### Manual Check:
```cmd
docker ps
```

**Expected output:** You should see containers running for:
- `homeos-backend`
- `homeos-frontend`
- `homeos-postgres`
- `homeos-redis`

**If no containers:** Start Docker Desktop and run the start script again.

---

## Step 2: Verify Backend is Accessible

Open a browser and go to:
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

**Expected:** JSON response like `{"status": "healthy", ...}`

**If 404 or connection error:** Backend isn't running properly.

---

## Step 3: Use the Diagnostic Page

I've created a special diagnostic page to help you troubleshoot.

Visit: **http://localhost:3000/diagnostic**

This page will:
- ✅ Test backend connection
- ✅ Test API endpoints
- ✅ Show detailed error messages
- ✅ Provide test buttons

### What to Look For:

**Green dots** = Working ✅
**Red dots** = Problem ❌

If you see red dots:
1. Check the error message displayed
2. Follow the troubleshooting steps shown
3. Try the "Re-test Backend Connection" button

---

## Step 4: Check Browser Console

1. Press **F12** (or right-click → Inspect)
2. Click **Console** tab
3. Look for red error messages

### Common Errors & Fixes:

#### Error: "Failed to fetch" or "Network Error"
**Cause:** Backend not reachable
**Fix:**
- Verify backend is running (`docker ps`)
- Check http://localhost:8000/health in browser
- Restart containers: `docker-compose down && docker-compose up -d`

#### Error: "CORS policy" or "Access-Control-Allow-Origin"
**Cause:** CORS not configured correctly
**Fix:** Backend should already have CORS configured. Check backend logs:
```cmd
cd C:\path\to\garryOS\infra
docker-compose logs backend
```

#### Error: "Cannot read properties of undefined"
**Cause:** Data not loaded properly
**Fix:** Check diagnostic page to see which API call is failing

#### Error: "Module not found" or import errors
**Cause:** Missing dependencies
**Fix:** Reinstall frontend dependencies:
```cmd
cd C:\path\to\garryOS\frontend
npm install
```

---

## Step 5: Test with Simple Button

To isolate the issue, go to the diagnostic page and click:
- "Test Create Program" button

If this button works → Degree tracker buttons should work too
If this button doesn't work → Backend connection issue

---

## Step 6: Verify Frontend is Running

Check that you can access: **http://localhost:3000**

If you can't:
```cmd
cd C:\path\to\garryOS\infra
docker-compose restart frontend
```

Check frontend logs:
```cmd
docker-compose logs frontend
```

---

## Step 7: Hard Refresh the Page

Sometimes browsers cache old JavaScript.

**Windows:**
- Chrome/Edge: `Ctrl + Shift + R`
- Firefox: `Ctrl + F5`

**Or:** Clear browser cache:
- Settings → Privacy → Clear browsing data → Cached images and files

---

## Step 8: Check Specific Button Types

### If "Add Module" button doesn't work:

1. Go to diagnostic page: http://localhost:3000/diagnostic
2. Click "Test Create Program"
3. If test works, the modal might be the issue
4. Check console (F12) for React errors

### If module cards aren't clickable:

1. Check if you have any modules created
2. If no modules, create one first via API docs: http://localhost:8000/docs
3. Try clicking the empty area around the card

### If inline editing doesn't work:

1. You need to have coursework created first
2. Try clicking directly on the marks cell (not the row)
3. Check console for errors

---

## Common Causes & Solutions

### 1. Docker Not Running
**Symptoms:**
- Can't access http://localhost:8000
- Start scripts fail

**Solution:**
- Start Docker Desktop
- Wait for it to fully initialize (whale icon stable)
- Run start script again

### 2. Port Already in Use
**Symptoms:**
- "Address already in use"
- "Port 3000/8000 is already allocated"

**Solution:**
```cmd
# Stop conflicting services
docker-compose down
# Or kill specific port (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 3. Database Not Initialized
**Symptoms:**
- Backend starts but API calls fail
- "relation does not exist" errors

**Solution:**
```cmd
cd C:\path\to\garryOS\infra
docker-compose down -v
docker-compose up -d --build
```

### 4. Old Code Cached
**Symptoms:**
- Buttons worked before, now don't
- Console shows old errors

**Solution:**
- Hard refresh (Ctrl + Shift + R)
- Clear cache
- Rebuild: `docker-compose up -d --build`

### 5. Module Components Not Found
**Symptoms:**
- "Cannot find module" in console
- Import errors

**Solution:**
```cmd
cd C:\path\to\garryOS\frontend
npm install
```

Then rebuild:
```cmd
cd C:\path\to\garryOS\infra
docker-compose restart frontend
```

---

## Step-by-Step Full Reset

If nothing works, do a complete reset:

```cmd
# 1. Stop everything
cd C:\path\to\garryOS\infra
docker-compose down -v

# 2. Remove containers
docker-compose rm -f

# 3. Start fresh
docker-compose up -d --build

# 4. Wait 30 seconds for everything to start

# 5. Check logs
docker-compose logs -f
```

Then visit http://localhost:3000/diagnostic

---

## Verify Everything Works

After fixing, test this workflow:

1. **Go to diagnostic page:** http://localhost:3000/diagnostic
   - ✅ Green dot for "Backend Status"
   - ✅ Green dots for all API tests

2. **Create a test program:**
   - Click "Test Create Program" button
   - Should see "Program created successfully!"

3. **Go to Degree Tracker:** http://localhost:3000/degrees
   - Should see the test program
   - Click "+ Add Module" → Modal should appear
   - Fill form → Click "Create" → Should save

4. **Click module card:**
   - Should navigate to module detail page
   - Should see "Add Lecture" and "Add Coursework" buttons

5. **Test inline editing:**
   - Add coursework with marks
   - Click marks cell
   - Should become editable input

---

## Still Not Working?

### Check These Files Exist:

```cmd
cd C:\path\to\garryOS\frontend\src
dir components\degrees
dir pages\degrees
```

**Expected files:**
- AddModuleModal.tsx
- AddCourseworkModal.tsx
- AddLectureModal.tsx
- CourseworkTable.tsx
- InlineMarkEditor.tsx
- TargetGradeCalculator.tsx
- DegreeTracker.tsx
- ModuleDetail.tsx

**If missing:** The agent work might not have been saved. Re-pull from git:
```cmd
git pull origin claude/homeos-platform-bFA5h
```

### Check Backend Logs:

```cmd
cd C:\path\to\garryOS\infra
docker-compose logs backend | tail -50
```

Look for:
- ✅ "Application startup complete"
- ✅ "Uvicorn running on http://0.0.0.0:8000"
- ❌ Any errors about migrations or database

### Check Frontend Logs:

```cmd
docker-compose logs frontend | tail -50
```

Look for:
- ✅ "ready in XXms"
- ✅ "Local: http://localhost:3000"
- ❌ Any compile errors

---

## Quick Reference Commands

### Start everything:
```cmd
cd C:\path\to\garryOS
.\scripts\start-dev.ps1
```

### Stop everything:
```cmd
cd C:\path\to\garryOS\infra
docker-compose down
```

### View logs:
```cmd
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart a service:
```cmd
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild everything:
```cmd
docker-compose down -v
docker-compose up -d --build
```

---

## Contact Points for Debugging

**Diagnostic Page:** http://localhost:3000/diagnostic
**API Docs:** http://localhost:8000/docs
**Backend Health:** http://localhost:8000/health
**Frontend:** http://localhost:3000

---

## Summary

Most button issues are caused by:
1. ❌ Backend not running
2. ❌ Cached old code
3. ❌ CORS issues (should be fixed)
4. ❌ Database not initialized

**Quick fix in order:**
1. Visit http://localhost:3000/diagnostic
2. Check for red dots
3. Fix backend if needed (restart Docker)
4. Hard refresh page (Ctrl + Shift + R)
5. Test buttons again

The diagnostic page is your friend - use it first! 🔧
