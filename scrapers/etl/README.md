# ETL System - Domain-Based Architecture

## 🏗️ Architecture Overview

The ETL system uses a **domain-based architecture** with three main domains handling different aspects of OU academic data:

### **Universal Clients** (`/clients/`)
- `comprehensive_api_client.py` - RateMyProfessors GraphQL API client
- `comprehensive_database_client.py` - Universal SQLAlchemy database client

### **Domain Organization** (`/domains/`)

#### **Classes Domain** (`/domains/classes/`)
Handles OU class schedule data extraction
- **API Client**: ClassNav API integration with pagination
- **Database Client**: Class and MeetingTime model persistence  
- **Processor**: Class data transformation and meeting time parsing
- **Loader**: Main orchestration script

#### **Majors Domain** (`/domains/majors/`)  
Handles OU academic program requirements
- **API Client**: CourseLeaf web crawling using crawl4ai
- **Database Client**: Major, Requirement, and MajorCourse models
- **Loader**: Bachelor degree program scraper

#### **Professors Domain** (`/domains/professors/`)
Handles RateMyProfessors data and detailed ratings
- **Database Client**: Professor and Rating model operations
- **Basic Loader**: GraphQL queries for all OU professors
- **Detailed Loader**: Tiered rating strategy for detailed data
- **Processor**: Professor and rating data transformation

## 🚀 Usage

### **Classes Data**
```bash
# Test mode (filtered data)
python scrapers/etl/domains/classes/loaders/class_loader.py

# Full mode (all class data)
python scrapers/etl/domains/classes/loaders/class_loader.py --full
```

### **Majors Data**
```bash
# Scrape all bachelor degree programs
python scrapers/etl/domains/majors/loaders/bachelor_degree_scraper.py
```

### **Professors Data**
```bash
# Step 1: Load basic professor data
python scrapers/etl/domains/professors/loaders/basic_professor_loader.py

# Step 2: Load detailed ratings (test mode: 3 professors)
python scrapers/etl/domains/professors/loaders/detailed_professor_loader.py

# Step 2: Load detailed ratings (full mode: all qualified professors)
python scrapers/etl/domains/professors/loaders/detailed_professor_loader.py --full
```

## 📊 Data Flow

### **Classes Pipeline**
1. **ClassNav API** → Fetch class schedules by semester
2. **ClassDataProcessor** → Parse and validate class data
3. **ClassDatabaseClient** → Store classes and meeting times

### **Majors Pipeline**  
1. **CourseLeaf Crawler** → Scrape degree requirements
2. **MajorRequirementsAPIClient** → Extract structured data
3. **MajorDatabaseClient** → Store majors, requirements, and courses

### **Professors Pipeline**
1. **Basic Loader** → Fetch all OU professors with basic stats
2. **Detailed Loader** → Fetch detailed data for professors with 10+ ratings
   - Tier 1 (10-14 ratings): Get 10 detailed ratings
   - Tier 2 (15+ ratings): Get 15 detailed ratings
3. **DataProcessor** → Transform and normalize rating data

## 🔧 Features

- **Test/Full Modes**: Development-friendly testing with production scalability
- **Comprehensive Logging**: Timestamped logs for monitoring and debugging
- **Data Validation**: Duplicate detection and required field validation
- **Rate Limiting**: Respectful API usage with pagination support
- **Database Integrity**: Verification and statistics reporting 