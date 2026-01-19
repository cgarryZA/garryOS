Project name

HomeOS (working name)

High-level goal

Build a local-first personal operating system that runs on a home server and unifies calendar, tasks, reminders, health data, notes, finance tracking, and machine control into one coherent platform.

The system must work offline, store all data locally, and expose a safe, constrained interface that can be queried and operated via an LLM.

Core principles

Local-first: all data is stored and processed locally

Single source of truth: one database, one event system

Modular monolith: one repo, clean module boundaries

Event-driven: reminders, triggers, and automation are events

LLM as interface, not authority: no autonomous execution

Technical stack

Backend: Python + FastAPI

Database: PostgreSQL (primary), Redis (triggers & ephemeral state)

Background jobs: APScheduler or Celery

Frontend: React (drag-and-resize dashboard layout)

Deployment: Docker Compose (local server)

Core system responsibilities
1. Event system

Implement a central event bus that supports:

Time-based triggers

Location-based triggers

Progress-based triggers

Manual user events

Events are immutable and stored historically.

2. Calendar, tasks, and reminders

Model calendar events, tasks, and reminders as a single entity with different views.

Support:

Deadlines

Estimated duration

Progress tracking

Recurring events

One-off reminders

Location-based reminders

Progress-based reminders (expected vs actual progress)

3. Health module

Integrate wearable health data (initially WHOOP via API).

Store:

Sleep

Recovery

Strain

Compute derived metrics:

Recovery trends

Sleep debt

Load vs recovery correlation

Health data must be usable by other modules (e.g. scheduling, burnout detection).

4. Notes system

Store notes as Markdown.

Support:

Full-text search

Semantic indexing

Timeline reconstruction

Summarisation and querying via LLM

Notes must never be modified by the LLM unless explicitly requested.

5. Degree tracker

Track:

Modules

Coursework items

Weightings

Marks

Completion percentages

Deadlines

Compute:

Current weighted average

Remaining potential outcomes

Progress forecasts

6. Finance tracker

Track:

Accounts

Assets

Liabilities

Net worth over time

Provide basic analytics:

Mean, variance

Sharpe ratio

Simple Monte Carlo projections

7. Server controller

Allow controlled interaction with the host machine:

Start/stop predefined services

Pull updates from GitHub

Run whitelisted scripts

No arbitrary command execution.

LLM integration rules

The LLM:

Never accesses the database directly

Never executes shell commands

Interacts only through explicit tools (API endpoints)

May read freely

May create or modify data only when explicitly instructed

Must explain reasoning and suggestions but not act autonomously

The backend exposes LLM tools such as:

get_calendar

get_tasks

get_health_summary

create_task

suggest_schedule

summarise_notes

Repository structure
backend/
  app/
    core/        # auth, events, scheduler, llm tools
    modules/     # calendar, health, notes, finance, etc.
    api/         # FastAPI routers
    models/      # database models
    main.py
frontend/
infra/
docs/


Modules must not depend on each other directly.
All cross-module communication goes through core services.

Initial implementation priorities

Core database models

Event system

Calendar/tasks/reminders

LLM tool interface

Health (WHOOP) ingestion

Dashboard frontend

Non-goals (explicitly out of scope initially)

Mobile apps

Multi-user support

Cloud hosting

Public API exposure

Autonomous LLM agents

Success criteria

System runs entirely on a local server

LLM can query and reason across all modules safely

Reminders and triggers fire reliably

Data remains coherent across time

New modules can be added without refactoring core logic

Calendar so claude can see my timetable and I can ask it questions and add stuff directly to my calendar via prompt
Tasks with reminders
Location based reminders, eg “remind me to buy peanuts will only remind when I’m in tesco”
Have a webserver that runs locally that will have access to all these so I can see them anywhere.

Whoop Interface:
Have a whoop dashboard

ToDo App:
Triggers:
	Date Based:
		One off on the date
Progress based: Provide time estimate and give update reminds on percentage completion based on time estimate and due date
	Location Based:
		Trigger when at location: Eg, “Remind me when I get home”
Items:
	Lists:
		Should Have items or reminders, hidden if empty/all completed but not deleted
	Reminders:
		Less detail
	Tasks:
		More detail
I want to be able to move lists around on the page resize them vertically horizontally. Reminders should be a separate tab and just have a list. Seperated into time based and location based with time at the top. 

Degree Tracker:
Input modules and completion amounts and hours etc and due dates and marks for items and then when they’re done I can get a tracker showing completion amount along with current average mark.

Finance Tracker:
Integrate with bank accounts and track my networth and do estimates etc and some small things like sharpe ratio and mean and std estimation for some Montecarlo.
Server Controller:
I want to be able to control the PC on my local network through the browser eg having everything be inside one github repo that I can then cause the machine to pull remotely via the web server so I can update functionality easily quickly seamlessly from anywhere in the world eg if I wanted I could add a new app remotely and use it on the fly.

Minecraft server:
Be able to spin up a Minecraft server using existing settings or from scratch taking a seed and version.

Notes:
Notes app with search and automatic outputting and interface with claude so I can ask questions or summarise or output my notes eg for my dissertation I can output a full timeline.




