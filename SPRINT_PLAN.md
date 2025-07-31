# 🚀 OU Class Manager - 2-Week Sprint Plan

## 🎯 Project Vision
**The Ultimate OU Student Tool:** Combine class scheduling, degree progress tracking, and RateMyProfessor integration into one beautiful, functional app that every OU student will want to use.

---

## 📋 Sprint Overview
**Duration:** 2 weeks (100 hours)  
**Goal:** Complete, tested, deployed app ready for campus launch  
**Target Users:** OU students needing degree tracking + class scheduling

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 14** with App Router
- **React** with TypeScript
- **shadcn/ui** components
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React DnD** for drag-and-drop

### Backend Stack
- **Prisma** ORM (already set up)
- **PostgreSQL** database
- **NextAuth.js** for authentication
- **RateMyProfessor API** integration
- **Web scraping** for degree requirements

### Deployment
- **Vercel** for hosting
- **GitHub** for version control
- **Environment variables** for secrets

---

## 📅 Week 1: Core Features

### Day 1-2: Foundation & Auth
- [ ] Set up Next.js project structure
- [ ] Configure shadcn/ui components
- [ ] Implement NextAuth.js authentication
- [ ] Create user profile system
- [ ] Set up database schema for users and schedules

### Day 3-4: Degree Requirements Scraper
- [ ] Research OU degree requirements pages
- [ ] Build web scraper for major requirements using crawl4ai
- [ ] Parse and structure degree data
- [ ] Create database schema for majors/requirements
- [ ] Build admin interface for managing degree data

### Day 5-7: Core Calendar & Scheduling
- [ ] Build weekly calendar component
- [ ] Implement drag-and-drop functionality
- [ ] Create class search and filter system
- [ ] Integrate with existing class database
- [ ] Add schedule conflict detection
- [ ] Build schedule saving/loading system

---

## 📅 Week 2: Polish & Deploy

### Day 8-10: Advanced Features
- [ ] Implement degree progress tracking
- [ ] Add data visualizations (charts, progress bars)
- [ ] Integrate RateMyProfessor data
- [ ] Build professor comparison features
- [ ] Add schedule optimization suggestions

### Day 11-12: UI/UX Polish
- [ ] Add dark mode toggle
- [ ] Implement hover effects and animations
- [ ] Create responsive design
- [ ] Add loading states and error handling
- [ ] Polish drag-and-drop interactions

### Day 13-14: Testing & Deployment
- [ ] Write unit tests for core functionality
- [ ] Add integration tests
- [ ] Set up CI/CD pipeline
- [ ] Deploy to Vercel
- [ ] Create documentation and README
- [ ] Final bug fixes and polish

---

## 🎨 Key Features Breakdown

### 1. Authentication System
- **NextAuth.js** with Google/GitHub providers
- User profile management
- Schedule persistence per user

### 2. Degree Requirements Integration
- **Scrape OU's degree pages** for all majors
- **Progress tracking** with visual indicators
- **Smart filtering** - only show relevant classes
- **Requirement suggestions** - "Take CHEM 1315 for science credit"

### 3. Enhanced Calendar System
- **Weekly grid view** with time slots
- **Drag-and-drop** class scheduling
- **Conflict detection** with visual warnings
- **Schedule persistence** and sharing

### 4. Class Search & Filtering
- **Advanced search** with autocomplete
- **Subject/time filters** (existing)
- **Major-specific filtering** (NEW)
- **Professor ratings** integration

### 5. Data Visualizations
- **Progress dashboards** for degree completion
- **Schedule analytics** (busiest days, credit distribution)
- **Professor performance** radar charts
- **Study time recommendations**

### 6. Smart Features
- **Schedule optimizer** - find best class combinations
- **Credit calculator** - track progress toward graduation
- **Conflict detection** - prevent overlapping classes
- **Professor alerts** - notify when better sections open

---

## 🗄️ Database Schema

### Users
```sql
users (id, email, name, major, graduation_year, created_at)
```

### Schedules
```sql
schedules (id, user_id, name, semester, created_at)
schedule_classes (schedule_id, class_id)
```

### Majors & Requirements
```sql
majors (id, name, code, college, total_credits, description)
requirements (id, major_id, category_name, credits_needed, description)
major_courses (id, requirement_id, subject, course_number, title, credits)
```

### Progress Tracking
```sql
user_progress (user_id, major_id, requirement_id, completed_credits)
```

---

## 🎯 Success Metrics

### Technical Goals
- [ ] 100% test coverage for core features
- [ ] < 2 second page load times
- [ ] Mobile responsive design
- [ ] Zero critical bugs at launch

### User Experience Goals
- [ ] Intuitive drag-and-drop interface
- [ ] Clear degree progress visualization
- [ ] Fast class search and filtering
- [ ] Beautiful, modern UI

### Business Goals
- [ ] Ready for campus launch
- [ ] Scalable architecture
- [ ] Easy to add new features
- [ ] Documentation for future development

---

## 🚨 Risk Mitigation

### Technical Risks
- **Web scraping complexity** → Start early, have fallback data
- **Performance issues** → Implement caching and optimization
- **Database complexity** → Keep schema simple, iterate later

### Timeline Risks
- **Feature creep** → Stick to MVP, add features post-launch
- **Integration issues** → Test early and often
- **Deployment problems** → Use proven tools (Vercel)

---

## 📝 Daily Standup Template

**Date:** [Date]  
**Hours Worked:** [X]  
**Completed:** [List items]  
**Blockers:** [Any issues]  
**Tomorrow's Plan:** [Next steps]

---

## 🎉 Launch Checklist

### Pre-Launch
- [ ] All core features working
- [ ] Comprehensive testing completed
- [ ] Performance optimized
- [ ] Documentation written
- [ ] Deployment successful

### Launch Day
- [ ] Share with friends for feedback
- [ ] Post on OU social media groups
- [ ] Gather user feedback
- [ ] Monitor for bugs/issues

### Post-Launch
- [ ] Implement user feedback
- [ ] Add new features based on usage
- [ ] Scale infrastructure if needed
- [ ] Plan for other universities

---

## 💡 Future Enhancements (Post-Sprint)

### Phase 2 Features
- **Study group finder** - connect with classmates
- **Grade tracking** - if we can get historical data
- **Weather integration** - for outdoor classes
- **Mobile app** - React Native version
- **Other universities** - expand beyond OU

### Technical Improvements
- **Real-time collaboration** - shared schedules
- **Advanced analytics** - detailed usage insights
- **API for third-party integrations**
- **Machine learning** - smart schedule suggestions

---

## 🎯 OU Major Scraping Strategy

### 📊 Major Count Analysis
- **Total Majors:** ~200+ unique programs
- **Colleges:** 7 main colleges (Engineering, Arts & Sciences, Business, etc.)
- **URL Pattern:** `https://ou-public.courseleaf.com/{college}/{department}/{major-name}/`
- **Pages per Major:** 3 (Program Requirements, Degree Requirements, Plan of Study)

### 🚀 Scraping Implementation Plan

#### Phase 1: Engineering College (~15 majors)
- Computer Engineering (your major)
- Electrical Engineering
- Computer Science
- Mechanical Engineering
- Aerospace Engineering
- etc.

#### Phase 2: Business College (~20 majors)
- Accounting, Finance, Management, etc.

#### Phase 3: Arts & Sciences (~50 majors)
- Psychology, Biology, Chemistry, etc.

#### Phase 4: Other Colleges (~115 majors)
- Education, Journalism, Fine Arts, etc.

### 🛠️ Technical Approach

#### crawl4ai Implementation
```python
# Example crawl4ai scraper for Computer Engineering
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig

async def scrape_major_requirements(major_url):
    browser_config = BrowserConfig(headless=True)
    crawler_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        css_selector="table",  # Target requirement tables
        extraction_strategy=JsonCssExtractionStrategy(schema)
    )
    
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url=major_url, config=crawler_config)
        return result.extracted_content
```

#### Database Schema for Majors
```sql
-- Majors table
majors (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    college TEXT,
    total_credits INTEGER,
    description TEXT
)

-- Requirements categories
requirements (
    id INTEGER PRIMARY KEY,
    major_id INTEGER,
    category_name TEXT,  -- "Major Requirements", "Gen Ed", etc.
    credits_needed INTEGER,
    description TEXT,
    FOREIGN KEY (major_id) REFERENCES majors(id)
)

-- Individual courses in requirements
major_courses (
    id INTEGER PRIMARY KEY,
    requirement_id INTEGER,
    subject TEXT,        -- "ECE", "MATH", etc.
    course_number TEXT,  -- "2214", "2924", etc.
    title TEXT,          -- "Digital Design", etc.
    credits INTEGER,
    FOREIGN KEY (requirement_id) REFERENCES requirements(id)
)
```

### 📋 Scraping Workflow

1. **Extract Major Links** from [academic-majors page](https://ou-public.courseleaf.com/academic-majors/)
2. **Parse URL Structure** to identify college/department/major
3. **Scrape Each Major** for all 3 pages (Program, Degree, Plan)
4. **Extract Requirements** using CSS selectors for tables
5. **Store Structured Data** in SQLite database
6. **Build Admin Interface** for managing degree data

### ⚡ Performance Estimates
- **Scraping Speed:** ~3 seconds per page
- **Total Time:** ~15 minutes for all 200+ majors
- **Data Size:** ~2-5MB of structured degree requirements
- **Storage:** SQLite handles this easily

### 🎯 Success Metrics
- [ ] All Engineering majors scraped (Day 3)
- [ ] All Business majors scraped (Day 4)
- [ ] All Arts & Sciences majors scraped (Day 5)
- [ ] All remaining majors scraped (Day 6)
- [ ] Admin interface for managing data (Day 7)

---

**🎯 GOAL:** Build the app that every OU student wishes they had, and launch it in 2 weeks. This could be your ticket to FAANG. Let's make it legendary. 🚀 