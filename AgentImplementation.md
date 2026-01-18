# Agent Implementation - SellMe PRT (Sales Training)

## Project Overview

**Type**: Training & Education Platform
**Purpose**: AI sales training application for role-playing and presentation practice

## Tech Stack

```
Backend:     Node.js + Express + TypeScript
Database:    SQLite + Prisma ORM
Voice:       OpenAI Realtime API (WebSockets)
Frontend:    EJS templates + Bootstrap 5 + Bootstrap Icons
Container:   Docker + Docker Compose
```

## Key Components

- `src/routes/` - Admin and training routes
- `prisma/schema.prisma` - Training scenarios schema
- Admin panel with data tables, pagination, bulk actions

## Key Features

- Sales training scenarios
- Role-playing with AI customer
- Performance feedback
- Admin panel for scenario management

---

## Recommended Agents

### MUST IMPLEMENT (Priority 1)

| Agent | File | Use Case |
|-------|------|----------|
| **Backend Architect** | engineering/backend-architect.md | Training session management, scoring system |
| **DevOps Automator** | engineering/devops-automator.md | Docker management |
| **AI Engineer** | engineering/ai-engineer.md | AI customer persona, sales evaluation |
| **Database Admin** | data/database-admin.md | SQLite, scenarios, training sessions |
| **Security Auditor** | security/security-auditor.md | User sessions, admin access |
| **Bug Debugger** | quality/bug-debugger.md | Training session issues |

### SHOULD IMPLEMENT (Priority 2)

| Agent | File | Use Case |
|-------|------|----------|
| **Frontend Developer** | engineering/frontend-developer.md | Training UI |
| **API Tester** | testing/api-tester.md | API validation |
| **Code Reviewer** | quality/code-reviewer.md | TypeScript patterns |
| **UI Designer** | design/ui-designer.md | Training interface |
| **Content Creator** | marketing/content-creator.md | Sales scenarios, objection scripts |

### COULD IMPLEMENT (Priority 3)

| Agent | File | Use Case |
|-------|------|----------|
| **UX Researcher** | design/ux-researcher.md | Trainee experience |
| **Analytics Reporter** | studio-operations/analytics-reporter.md | Training performance metrics |

---

## Agent Prompts Tailored for This Project

### AI Engineer Prompt Addition
```
Project Context:
- AI plays the role of a customer in sales scenarios
- Provides realistic objections and questions
- Evaluates trainee's sales techniques
- Scoring based on: rapport building, needs assessment, objection handling, closing
- Voice interaction via OpenAI Realtime API
- Should be challenging but fair
```

### Content Creator Prompt Addition
```
Project Context:
- Create sales training scenarios
- Write realistic customer personas
- Develop objection scripts
- Create evaluation rubrics
- Example scenarios: cold call, product demo, handling price objections
```

---

## Marketing & Growth Agents (When Production Ready)

Add these when the project is ready for public release/marketing:

### Social Media & Marketing

| Agent | File | Use Case |
|-------|------|----------|
| **TikTok Strategist** | marketing/tiktok-strategist.md | Sales tips, objection handling clips |
| **Instagram Curator** | marketing/instagram-curator.md | Success quotes, training highlights |
| **Twitter/X Engager** | marketing/twitter-engager.md | Sales community, training thought leadership |
| **Reddit Community Builder** | marketing/reddit-community-builder.md | r/sales, r/salesforce, r/startups |
| **Content Creator** | marketing/content-creator.md | Sales scenarios, training guides, blog posts |
| **SEO Optimizer** | marketing/seo-optimizer.md | Sales training keywords, B2B software SEO |
| **Visual Storyteller** | design/visual-storyteller.md | Training screenshots, success metrics |

### Growth & Analytics

| Agent | File | Use Case |
|-------|------|----------|
| **Growth Hacker** | marketing/growth-hacker.md | Enterprise sales, pilot programs |
| **Trend Researcher** | product/trend-researcher.md | Sales training industry trends |
| **Finance Tracker** | studio-operations/finance-tracker.md | Subscription revenue, training ROI |
| **Analytics Reporter** | studio-operations/analytics-reporter.md | Training completion rates, performance metrics |

---

## Not Recommended for This Project

| Agent | Reason |
|-------|--------|
| Mobile App Builder | Web-based |
| Whimsy Injector | Professional training context |

---

## Implementation Commands

```bash
claude --agent engineering/backend-architect
claude --agent engineering/ai-engineer
claude --agent data/database-admin
claude --agent marketing/content-creator
claude --agent quality/bug-debugger
```
