# 🚀 HomeOS - Future Development Steps

## Immediate Priority: Degree ↔ Calendar/Tasks Integration

### Your Request
> "Each module should have lectures and due dates for coursework that automatically are put into the calendar and tasks respectively. As they're ticked off the tasks they will be crossed off the list on the module page."

This is an **excellent integration** that will make your degree tracker truly powerful!

---

## Phase 1: Degree-Calendar Integration (Next Session)

### 1.1 Add Lecture Schedule to Modules

**Backend Changes:**
- Add `lectures` table:
  ```sql
  lectures (
    id UUID,
    module_id UUID,
    title VARCHAR(200),          -- e.g., "Week 1: Introduction"
    location VARCHAR(200),        -- e.g., "Room 301" or "Online"
    day_of_week INTEGER,          -- 0=Monday, 6=Sunday
    start_time TIME,              -- e.g., 10:00
    end_time TIME,                -- e.g., 11:30
    recurrence_start_date DATE,   -- When lectures start
    recurrence_end_date DATE,     -- When lectures end
    notes TEXT                    -- Any additional info
  )
  ```

- API endpoints:
  ```
  POST   /api/degrees/modules/{id}/lectures
  GET    /api/degrees/modules/{id}/lectures
  PUT    /api/degrees/lectures/{id}
  DELETE /api/degrees/lectures/{id}
  ```

**Frontend Changes:**
- Module detail page with lecture schedule
- Weekly timetable view
- "Add Lecture" form

**Calendar Integration:**
- When lecture is created → automatically create recurring calendar event
- Link `lecture.id` to `calendar_item.id` (add `source_type` and `source_id` to calendar_items)
- Sync updates: edit lecture → update calendar event
- Sync deletes: delete lecture → delete calendar events

**Example Workflow:**
```json
POST /api/degrees/modules/{module_id}/lectures
{
  "title": "CS101 Lecture",
  "location": "Room 301",
  "day_of_week": 1,  // Tuesday
  "start_time": "10:00",
  "end_time": "11:30",
  "recurrence_start_date": "2024-01-15",
  "recurrence_end_date": "2024-04-30"
}

→ Automatically creates recurring calendar event for every Tuesday 10:00-11:30
```

### 1.2 Coursework Deadline → Task Integration

**Backend Changes:**
- Add `linked_task_id` field to `coursework` table
- When coursework with deadline is created → auto-create task in calendar
- Add `source_type` and `source_id` to `calendar_items`:
  ```sql
  ALTER TABLE calendar_items ADD COLUMN source_type VARCHAR(50);
  ALTER TABLE calendar_items ADD COLUMN source_id UUID;
  ```

**API Enhancement:**
- When creating coursework with deadline:
  ```json
  POST /api/degrees/modules/{module_id}/coursework
  {
    "name": "Midterm Essay",
    "weighting": 40.0,
    "deadline": "2024-03-15T23:59:00Z"
  }
  ```

  Backend automatically:
  1. Creates the coursework
  2. Creates a task in calendar_items with:
     - `title`: "Midterm Essay (CS101)"
     - `type`: "task"
     - `start_time`: deadline minus 7 days (configurable)
     - `end_time`: deadline
     - `source_type`: "coursework"
     - `source_id`: coursework.id
  3. Returns coursework with `linked_task_id`

**Two-Way Sync:**
- Complete task → mark coursework as submitted
- Submit coursework → complete task
- Update deadline → update task due date
- Delete coursework → delete associated task

### 1.3 Module Detail Page Enhancement

**Frontend Component: `ModuleDetail.tsx`**

Display:
1. **Module Overview**
   - Name, code, credits, weighting
   - Current average
   - Progress bar

2. **Lecture Schedule**
   - Weekly timetable
   - Next lecture countdown
   - Location and notes
   - "Add to my calendar" button

3. **Coursework List**
   - Table with columns:
     - Name
     - Weighting
     - Deadline
     - Status
     - Marks (if graded)
     - Task status (linked task)
   - **Visual sync indicator**:
     - ✓ Green checkmark if task completed
     - ⏳ Yellow if task in progress
     - ⭕ Gray if not started
   - Click task status → navigate to task in calendar

4. **Statistics Panel**
   - Module average
   - Graded vs remaining
   - Best/worst case for this module

**Example View:**
```
╔══════════════════════════════════════════════════════════╗
║ CS101: Introduction to Programming                       ║
║ 10 credits • 8.33% weighting • Current: 74%            ║
╠══════════════════════════════════════════════════════════╣
║ Lectures                                  [+ Add Lecture]║
║ ┌────────────────────────────────────────────────────┐  ║
║ │ Tue 10:00-11:30  Room 301    [Next: Tomorrow]     │  ║
║ │ Thu 14:00-15:30  Online      [Next: 3 days]       │  ║
║ └────────────────────────────────────────────────────┘  ║
║                                                          ║
║ Coursework                              [+ Add Coursework]║
║ ┌──────────────────────────────────────────────────────┐║
║ │ Name          Weight  Deadline   Marks  Task Status  │║
║ ├──────────────────────────────────────────────────────┤║
║ │ Midterm       40%     Mar 15     85%    ✓ Done       │║
║ │ Final Project 60%     Apr 30     -      ⏳ In Prog   │║
║ └──────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════╝
```

---

## Phase 2: Complete Frontend for Degree Tracker

### 2.1 Coursework Management UI
- **Inline editing** of marks in table
- **Add/Edit modals** with validation
- **Bulk operations** (delete multiple, update statuses)
- **Sort and filter** by deadline, status, weighting

### 2.2 Target Grade Calculator Widget
- Interactive slider to set target grade
- Real-time calculation of required average
- Visual indicator if achievable
- Breakdown by module: "You need 75% in CS201, 70% in CS202"

### 2.3 Charts and Visualizations
**Using recharts or chart.js:**
- **Module Comparison Bar Chart**: Average per module
- **Grade Distribution Pie Chart**: First/2:1/2:2 breakdown
- **Progress Timeline**: Completion over time
- **Weighting Breakdown**: Visual representation of module weightings

### 2.4 Module Management
- **Add/Edit Module Modal**
- **Reorder modules** (drag and drop)
- **Archive completed modules**
- **Module cloning** (for similar modules)

---

## Phase 3: Advanced Degree Tracker Features

### 3.1 Grade Predictions with ML
- Analyze past performance trends
- Predict likely grade on upcoming coursework
- Suggest modules to focus on for maximum impact

### 3.2 Study Time Tracking Integration
- Link with calendar to track study hours per module
- Compare estimated vs actual time spent
- Suggest optimal study allocation based on weightings

### 3.3 Academic Calendar Integration
- Import university term dates
- Exam period blocking
- Reading week highlighting
- Holiday tracking

### 3.4 Collaborative Features
- Share module templates with friends
- Compare (anonymized) performance with cohort
- Study group coordination

---

## Phase 4: Other HomeOS Modules

### 4.1 LLM Integration (Session 3)
**Priority: High** - This will make everything more powerful!

**Features:**
- **Natural language task creation**:
  - "Remind me to submit CS101 essay next Friday"
  - "Add a lecture for Data Structures every Tuesday at 2pm"

- **Query interface**:
  - "What do I have due this week?"
  - "What's my current grade in Computer Science?"
  - "Can I still get a First in my degree?"

- **Smart suggestions**:
  - "You have 3 deadlines next week, should I schedule study time?"
  - "Your recovery score is low, want to reschedule tomorrow's tasks?"

**Implementation:**
- Anthropic Claude API integration
- Tool definitions for all HomeOS operations
- Safety guardrails (read freely, write only on command)
- Conversation history and context

### 4.2 WHOOP Health Integration (Session 4)
- Pull recovery, sleep, strain data
- Health-aware task scheduling
- Burnout detection
- Optimal study time suggestions based on recovery

### 4.3 Notes System (Session 5)
- Markdown notes with full-text search
- Semantic search (embeddings)
- Link notes to modules/lectures
- Timeline reconstruction
- LLM-powered summarization
- Lecture note templates

### 4.4 Finance Tracker (Session 6)
- CSV import from banks
- Net worth tracking over time
- Student budget management
- Mean/variance/Sharpe ratio calculations
- Simple Monte Carlo projections

### 4.5 Server Controller (Session 7)
- Whitelist script execution
- GitHub pull integration
- Service management (start/stop)
- System monitoring
- Remote updates

---

## Phase 5: Mobile & Advanced Features

### 5.1 Android App (Session 8)
**For location-based reminders and NFC triggers:**
- GPS tracking with geofencing
- "Remind me to buy peanuts when at Tesco"
- NFC tag triggers: "Tap tag at desk → start study timer"
- Push notifications
- Offline sync

### 5.2 Progressive Web App (PWA)
- Install on home screen
- Offline functionality
- Push notifications in browser
- Background sync

### 5.3 Data Export & Backup
- Export all data to JSON
- PDF report generation
- Automated backups to cloud (optional)
- Import from other systems

---

## Recommended Session Breakdown

### ✅ **Session 1: Complete** (16-24 hours)
- ✓ Project infrastructure (Docker, DB, API framework)
- ✓ Core event system and scheduler
- ✓ Calendar/Task CRUD API
- ✓ Basic frontend structure
- ✓ Degree tracker backend API (19 endpoints)
- ✓ Degree tracker frontend foundation

### 🎯 **Session 2: Degree-Calendar Integration** (12-16 hours) ← RECOMMENDED NEXT
**What you'll get:**
- Lectures automatically create calendar events
- Coursework deadlines automatically create tasks
- Two-way sync: complete task = mark coursework submitted
- Module detail page with lecture schedule and coursework list
- Visual task status on coursework table
- Click coursework → jump to linked task

**Why this next:**
- Makes degree tracker immediately useful
- Demonstrates system integration
- Creates compelling workflow
- High value, medium complexity

### **Session 3: Complete Degree UI + Charts** (12-16 hours)
- Inline mark editing
- Add/edit modals for modules and coursework
- Target grade calculator widget
- Charts and visualizations
- Polish and responsive design

### **Session 4: LLM Integration** (16-20 hours)
- Anthropic API setup
- Tool definitions
- Natural language interface
- Query capabilities
- Safety and audit logging

### **Session 5: WHOOP Health** (12-16 hours)
- API integration
- Data ingestion
- Health dashboard
- Recovery-aware scheduling

### **Sessions 6+: Remaining Modules**
- Notes, Finance, Server Controller, Android App

---

## Quick Wins (Can do anytime)

### UI Improvements
- [ ] Dark mode toggle
- [ ] Customizable dashboard
- [ ] Keyboard shortcuts
- [ ] Better mobile responsiveness
- [ ] Loading skeletons instead of spinners

### Backend Enhancements
- [ ] WebSocket for real-time updates
- [ ] Redis caching for statistics
- [ ] Background job queue (Celery)
- [ ] Rate limiting
- [ ] API versioning

### DevOps
- [ ] GitHub Actions CI/CD
- [ ] Automated testing
- [ ] Docker production build
- [ ] Environment configs (dev/staging/prod)
- [ ] Monitoring and logging (Sentry, Prometheus)

### Data Management
- [ ] Database backups
- [ ] Data seeding scripts
- [ ] Migration rollback procedures
- [ ] Data validation improvements

---

## Technical Debt to Address

1. **Authentication**: Currently single-user, need proper auth for multi-user
2. **Error Handling**: Add comprehensive error messages and recovery
3. **Testing**: Unit tests, integration tests, E2E tests
4. **Documentation**: API docs, architecture diagrams, user guides
5. **Performance**: Query optimization, caching, pagination
6. **Security**: Input validation, SQL injection prevention, XSS protection

---

## My Recommendation: What to Build Next

**🎯 Session 2: Degree-Calendar Integration**

This is the **highest value next step** because:

1. **Immediate Utility**: Makes the degree tracker actually useful for your daily life
2. **System Integration**: Demonstrates how modules work together
3. **Compelling Workflow**: Create lecture → auto-add to calendar → never miss class
4. **Task Completion**: Tick off task → coursework marked as done → progress updates
5. **Medium Complexity**: Not too hard, very rewarding

### After Session 2, you'll be able to:
- Set up all your lectures once → they appear in your calendar every week
- Add coursework with deadlines → tasks auto-created with reminders
- Complete a task in the task list → see it crossed off in degree tracker
- View your weekly schedule with lectures and assignment deadlines
- Get a holistic view of your academic life in one system

### Estimated Time: 12-16 hours
- Backend: 6-8 hours (lectures table, integration logic, sync)
- Frontend: 6-8 hours (module detail page, lecture UI, coursework table)

---

## Alternative: If You Want Quick Wins First

If you want to see **immediate visual improvements** before integration:

**Quick Session: Polish Degree Tracker UI** (4-6 hours)
- Add/edit modals for modules and coursework
- Inline editing of marks
- Better loading states
- Charts (grade distribution, module comparison)
- Target grade calculator widget

Then do the calendar integration in Session 3.

---

## Summary

**Your request** (lectures → calendar, coursework → tasks, two-way sync) is **Session 2**.

**My recommendation**: Do Session 2 next. It's the most valuable integration and will make your system genuinely useful for managing your degree.

After that, you can:
- Polish the UI (Session 3)
- Add LLM superpowers (Session 4)
- Continue with other modules (Sessions 5+)

**Current Status:**
- ✅ Backend: 100% complete for existing features
- ✅ Degree Tracker API: 100% functional
- ✅ Frontend Foundation: Dashboard with stats working
- ⏳ Integration: Needs Session 2
- ⏳ UI Polish: Needs Session 3
- ⏳ LLM: Needs Session 4

You're in great shape! The foundation is solid, and Session 2 will make it all come together beautifully. 🎓

---

## Want to Start Session 2 Now?

If you're ready, I can start implementing the degree-calendar integration immediately. Just say the word!

**Session 2 Deliverables:**
1. Lectures table and API
2. Auto-create calendar events from lectures
3. Auto-create tasks from coursework deadlines
4. Two-way sync (complete task ↔ mark coursework)
5. Module detail page with timetable
6. Coursework table with task status indicators

Ready when you are! 🚀
