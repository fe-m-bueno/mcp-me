# Interview Stories — Felipe Martins Bueno

This file contains structured interview stories (STAR/CAR format) for technical and behavioral interviews. Target roles: Fullstack Developer, Backend-Focused Software Engineer, Systems Analyst.

---

## How to Use These Stories

- Memorize the context, not word-for-word scripts
- Adjust detail level to the interview: more technical depth for engineering rounds, more business impact for recruiter screens
- Every story anchors in: technical depth, business impact, ownership, measurable result

---

## Story 1: Search Performance Improvement (Django + Redis)

### Best for
- Tell me about a time you improved performance
- Describe a difficult technical problem you solved
- How do you approach debugging performance issues?
- Tell me about a time you optimized a system under pressure

### Situation
At Pilgrims Consulting, I worked on an internal Django platform used across procurement, sales, bid management, and contract operations. One of the most heavily used workflows was the quotations search, which refreshed around 40,000 records and was directly tied to daily operations.

### Task
The search was too slow and was hurting usability for a business-critical internal system. I needed to improve response time without breaking the workflow people were already relying on.

### Action
I analyzed the behavior of the search flow and identified a combination of issues: N+1 query patterns, inefficient dynamic search queries, lack of pagination, and no caching strategy.

I then:
- Removed N+1 query patterns
- Improved dynamic search query logic
- Added pagination
- Introduced Redis cache

### Result
Response time improved from **92 seconds to 3.6 seconds** — a reduction of up to **99.7%**. That made the workflow usable again and improved the experience of a platform used by around 80 people across several operational areas.

### Short Version
I optimized a heavily used quotations search flow in a Django platform by removing N+1 queries, improving search logic, and adding pagination plus Redis cache. Response time dropped from 92s to 3.6s.

---

## Story 2: Dashboard Reliability for Critical Decision-Making

### Best for
- Tell me about a time your work impacted the business
- Describe a high-stakes system you supported
- Tell me about a time when performance affected leadership visibility

### Situation
At Pilgrims, Metabase dashboards were used daily by around 70 team members and 10 senior managers to track billing, profit, sales, and revenue-related decisions. If the system slowed down, it blocked visibility into important company metrics.

### Task
Those queries had poor performance and needed improvement so the system could respond consistently under daily operational load.

### Action
I improved the related PostgreSQL and SQL Server query workloads, tuning the backend/database side of the dashboards so they could respond more consistently.

### Result
Report and dashboard runtimes dropped from **29 seconds to 1.2 seconds** — up to **93% reduction**. That improved access to business-critical metrics for both the operating team and senior leadership.

### Short Version
I improved Metabase dashboard performance for revenue and profit reporting used daily by the team and senior leadership, reducing runtimes from 29s to 1.2s.

---

## Story 3: Building and Refactoring Airflow Pipelines

### Best for
- Tell me about a time you improved data infrastructure
- Describe your experience with ETL or orchestration
- Tell me about a complex system you maintained over time

### Situation
At Pilgrims, data had to move from multiple systems and formats into the data lake and data warehouse, including SQL Server, Oracle, PostgreSQL, APIs, PDFs, and CSVs.

### Task
I needed to create new workflows and improve the reliability and maintainability of the existing Airflow pipeline set.

### Action
I created around 60 Airflow DAGs and refactored the rest of a larger set of around 140 workflows. My work included:
- Retries and error recovery
- Variable and connection control
- Atomicity safeguards
- Query optimization
- Thread unblocking in DL/DW flows with swaps and copy operations

I supported daily, hourly, event-driven, and mixed pipeline patterns.

### Result
The data platform became more reliable, more maintainable, and more capable of serving downstream reporting and warehouse needs with less manual intervention.

### Short Version
I created around 60 Airflow DAGs and refactored the rest of a ~140-workflow pipeline set, improving reliability, control, and ETL orchestration across databases, APIs, PDFs, and CSVs.

---

## Story 4: Automating High-Effort Manual Processes

### Best for
- Tell me about a time you automated a manual process
- Describe a time you created business impact quickly
- How do you identify good automation opportunities?

### Situation
At Pilgrims, several operational workflows still depended on repetitive manual steps that consumed hours of staff time weekly.

### Task
I looked for processes where automation could remove recurring operational load and reduce the chance of human error.

### Action
I automated workflows including:
- Guarantee notifications
- Intergovernmental consortium data entry (consórcio intergestores)
- Sending documents and invoices/NFs

### Result
Combined savings were over **240 hours** across recurring processes:
- 120+ hours from guarantee-related workflows
- 80+ hours from consortium data-entry work
- 40+ hours from document/NF sending

### Short Version
I automated recurring operational workflows that saved more than 240 hours across guarantee notifications, consortium data entry, and document sending.

---

## Story 5: Introducing Better Engineering Practices

### Best for
- Tell me about a time you improved team process
- How do you contribute beyond coding?
- Tell me about a time you raised engineering quality

### Situation
At Pilgrims, parts of the technical workflow were less structured than ideal for a 4-developer team working on a critical internal platform.

### Task
I wanted to help the team work in a more consistent and maintainable way while also improving release predictability.

### Action
I helped establish or reinforce practices such as:
- Git-based version control
- Branching strategies
- Pull requests
- Code review
- CI/CD with GitHub Actions
- TDD
- Release validation / homologation
- Better process and API documentation

### Result
The team gained a more disciplined engineering workflow, with clearer collaboration, better review flow, and more predictable release quality.

### Short Version
I helped strengthen engineering workflow for a 4-developer team by supporting Git, branching, CI/CD, TDD, release validation, and better API documentation.

---

## Story 6: Sensitive Workforce Data at Paraná Banco

### Best for
- Tell me about a time you worked with sensitive data
- Tell me about a time accuracy mattered
- How do you handle reliability in business-critical processes?

### Situation
At Paraná Banco, I worked on compensation and benefits operations involving sensitive workforce data for 800-900 employees, including time tracking, compensation, personal data, and benefits.

### Action
I worked with SQL Server, Power BI, Excel, and Python to improve daily and weekly reporting workflows used by legal, HR, budgeting, and controllership teams. I also automated recurring data-processing routines and improved onboarding and benefits validation.

### Result
- Processing time dropped from **8 hours to 10 minutes**
- **40+ hours** of manual work saved
- Onboarding and benefits validation errors reduced by **90%**

### Short Version
I improved sensitive workforce-data processes for 800-900 employees, reducing reporting time from 8 hours to 10 minutes and cutting validation errors by 90%.

---

## Story 7: Cross-System Automation at Straumann

### Best for
- Tell me about a time you automated across multiple systems
- Describe a process improvement with measurable impact

### Situation
At Straumann Group, employee and planning data had to stay consistent across Senior ERP and SAP HCM for an organization of ~1,600 employees, including sister companies (ClearCorrect, Smilink) and international branches (Chile, Costa Rica, Switzerland).

### Action
I automated parts of employee data maintenance across both systems and supported dashboards and KPI workflows tied to personnel budget, benefits, suppliers, and business analysis across 6 business areas.

### Result
- Manual work reduced by **60%**
- At least **20 hours/week** saved
- Recurring data supported **250+ users**, especially managers
- Supported budgeting for **2,100+ employees**

### Short Version
I automated employee data maintenance across Senior ERP and SAP HCM for an operation with ~1,600 employees, reducing manual work by 60% and saving at least 20 hours per week.

---

## Story 8: AI-Assisted Engineering Workflow

### Best for
- How do you use AI tools in your workflow?
- Tell me how you balance AI speed with engineering quality
- What is your view on AI-assisted software development?

### Situation
AI tools are increasingly common in engineering, but they often generate code that looks plausible without being reliable enough to ship directly.

### Action
I use AI-assisted workflows (Codex, Claude Code) for: refactoring, debugging, rapid prototyping, code review, documentation acceleration, and workflow exploration.

I treat them as collaborators, not authorities. I still validate logic, architecture, constraints, and maintainability myself. I also use Git worktrees and structured branching to isolate experiments and parallel work.

### Result
Faster iteration without outsourcing judgment. I move faster on implementation and exploration while keeping ownership of correctness and system quality.

### Short Version
I use AI coding tools as productivity multipliers for debugging, refactoring, prototyping, and code review, but I still validate architecture, correctness, and maintainability myself.

---

## Story 9: Why Fullstack / Backend

### Best for
- Why are you targeting fullstack/backend roles?
- What kind of work do you enjoy most?

### Answer
My strongest work has been in backend-heavy fullstack systems: internal platforms, APIs, automations, ETL pipelines, query optimization, and business-critical workflows. I enjoy frontend work and can build product-facing features, but the areas where I create the most value are backend logic, system integration, data movement, performance improvements, and process automation.

---

## Story 10: Why My Title Undersells My Work

### Best for
- Your title says Systems Analyst. Why are you applying for software roles?
- How much coding did you actually do?

### Answer
The formal title is Junior Systems Analyst, but the actual work has been strongly software-focused. In practice, I've worked on a Django platform, REST APIs, query optimization, Redis caching, Airflow DAGs, ETL pipelines, Dockerized services, system integrations, and technical automations with measurable impact. The title is broader than the real day-to-day engineering scope.

---

## Failure / Challenge Framing

When asked about failure or mistakes, use mature framing:
- Overtrusting initial assumptions before profiling a bottleneck
- Realizing that some "simple" operational workflows were more fragile than they looked
- Learning to balance speed of automation with maintainability and observability
- Learning not to rely blindly on AI-generated code and to validate correctness carefully

Avoid:
- Blaming stakeholders
- Saying there were no mistakes
- Giving only soft "perfectionist" answers

---

## Final Interview Rule

Anchor every story in:
- Technical depth
- Business impact
- Ownership
- Measurable result

Best impression: "He is not just a candidate who studied tech. He already improves real systems, real operations, and real engineering workflows."
