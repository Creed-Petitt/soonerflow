import subprocess
import json
import os
import logging
from typing import Dict, List, Optional, Any

class DatabaseClient:
    """Client for database operations using Node.js scripts"""
    
    def __init__(self):
        self.script_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
            'nextjs-app', 'scripts'
        )
        self.logger = logging.getLogger(__name__)
    
    def save_professor(self, professor_data: Dict[str, Any]) -> bool:
        """Save professor data to database"""
        try:
            # Save professor data to temporary JSON file
            temp_file = os.path.join(self.script_dir, 'temp_professor.json')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(professor_data, f, ensure_ascii=False, indent=2)
            
            # Run the save professor script with the file path as argument
            result = subprocess.run([
                'node', 'save_professor.js', 'temp_professor.json'
            ], capture_output=True, text=True, encoding='utf-8', cwd=self.script_dir)
            
            # Clean up temp file
            if os.path.exists(temp_file):
                os.remove(temp_file)
            
            if result.returncode == 0:
                self.logger.info(f"Successfully saved professor: {professor_data.get('firstName', '')} {professor_data.get('lastName', '')}")
                return True
            else:
                self.logger.error(f"Failed to save professor: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error saving professor: {e}")
            return False
    
    def save_rating(self, rating_data: Dict[str, Any]) -> bool:
        """Save rating data to database"""
        try:
            # Save rating data to temporary JSON file
            temp_file = os.path.join(self.script_dir, 'temp_rating.json')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(rating_data, f, ensure_ascii=False, indent=2)
            
            # Run the save rating script with the file path as argument
            result = subprocess.run([
                'node', 'save_rating.js', 'temp_rating.json'
            ], capture_output=True, text=True, encoding='utf-8', cwd=self.script_dir)
            
            # Clean up temp file
            if os.path.exists(temp_file):
                os.remove(temp_file)
            
            if result.returncode == 0:
                self.logger.info(f"Successfully saved rating for professor: {rating_data.get('professorId', '')}")
                return True
            else:
                self.logger.error(f"Failed to save rating: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error saving rating: {e}")
            return False
    
    def get_qualified_professors(self, min_ratings: int = 10) -> List[Dict[str, Any]]:
        """Get professors from database that meet the minimum rating threshold"""
        try:
            # Create a script to export qualified professors
            export_script = os.path.join(self.script_dir, 'export_qualified_professors.js')
            
            script_content = f'''
const {{ PrismaClient }} = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportQualifiedProfessors() {{
    try {{
        // Get professors with minimum ratings threshold
        const professors = await prisma.professor.findMany({{
            where: {{
                numRatings: {{
                    gte: {min_ratings}
                }}
            }},
            orderBy: {{
                numRatings: 'desc'
            }},
            select: {{
                id: true,
                firstName: true,
                lastName: true,
                department: true,
                numRatings: true,
                avgRating: true
            }}
        }});
        
        // Save to JSON file
        const outputPath = path.join(__dirname, 'qualified_professors.json');
        fs.writeFileSync(outputPath, JSON.stringify(professors, null, 2));
        console.log(`Exported ${{professors.length}} qualified professors to ${{outputPath}}`);
        
    }} catch (error) {{
        console.error('Error:', error);
    }} finally {{
        await prisma.$disconnect();
    }}
}}

exportQualifiedProfessors();
'''
            
            with open(export_script, 'w') as f:
                f.write(script_content)
            
            # Run the script
            result = subprocess.run([
                'node', 'export_qualified_professors.js'
            ], capture_output=True, text=True, encoding='utf-8', cwd=self.script_dir)
            
            if result.returncode == 0:
                # Read the JSON file
                json_file = os.path.join(self.script_dir, 'qualified_professors.json')
                if os.path.exists(json_file):
                    with open(json_file, 'r', encoding='utf-8') as f:
                        professors = json.load(f)
                    # Clean up the JSON file
                    os.remove(json_file)
                    return professors
                else:
                    self.logger.error("JSON file not created")
                    return []
            else:
                self.logger.error(f"Error getting qualified professors: {result.stderr}")
                return []
                
        except Exception as e:
            self.logger.error(f"Error in get_qualified_professors: {e}")
            return []
    
    def professor_exists(self, professor_id: str) -> bool:
        """Check if professor already exists in database"""
        try:
            # Create a script to check professor existence
            check_script = os.path.join(self.script_dir, 'check_professor.js')
            
            script_content = f'''
const {{ PrismaClient }} = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function checkProfessor() {{
    try {{
        const professor = await prisma.professor.findUnique({{
            where: {{
                id: "{professor_id}"
            }}
        }});
        
        console.log(professor ? 'exists' : 'not_found');
        
    }} catch (error) {{
        console.error('Error:', error);
    }} finally {{
        await prisma.$disconnect();
    }}
}}

checkProfessor();
'''
            
            with open(check_script, 'w') as f:
                f.write(script_content)
            
            # Run the script
            result = subprocess.run([
                'node', 'check_professor.js'
            ], capture_output=True, text=True, encoding='utf-8', cwd=self.script_dir)
            
            if result.returncode == 0:
                return 'exists' in result.stdout.strip()
            else:
                self.logger.error(f"Error checking professor: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error in professor_exists: {e}")
            return False 