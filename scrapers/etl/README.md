# ETL Structure

## 📁 Organization

### **Loaders (2):**
- `loaders/basic_professor_loader.py` - Loads basic professor data (all OU professors)
- `loaders/detailed_professor_loader.py` - Loads detailed professor data (with ratings)

### **Clients (2):**
- `clients/api_client.py` - RateMyProfessors API client
- `clients/database_client.py` - Database operations

### **Processors (2):**
- `processors/basic_data_processor.py` - Process basic professor data
- `processors/data_processor.py` - Process detailed professor data

## 🚀 Usage

### **Step 1: Load Basic Data**
```bash
python scrapers/etl/loaders/basic_professor_loader.py
```

### **Step 2: Load Detailed Data**
```bash
# Test mode (3 professors)
python scrapers/etl/loaders/detailed_professor_loader.py

# Full run (all qualified professors)
python scrapers/etl/loaders/detailed_professor_loader.py
```

## 📊 Data Flow

1. **Basic Loader** → Fetches all OU professors with basic stats
2. **Detailed Loader** → Fetches detailed data for professors with 10+ ratings
   - Tier 1 (10-14 ratings): Get 10 detailed ratings
   - Tier 2 (15+ ratings): Get 15 detailed ratings 