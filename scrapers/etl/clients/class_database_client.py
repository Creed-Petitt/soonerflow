import subprocess
import json
import os
import logging
from typing import Dict, List, Optional, Any

class ClassDatabaseClient:
    """Client for class database operations using Node.js scripts"""
    
    def __init__(self):
        self.script_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
            'nextjs-app', 'scripts'
        )
        self.logger = logging.getLogger(__name__)
    
    def save_class(self, class_data: Dict[str, Any]) -> bool:
        """Save class data to database"""
        try:
            # Save class data to temporary JSON file
            temp_file = os.path.join(self.script_dir, 'temp_class.json')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(class_data, f, ensure_ascii=False, indent=2)
            
            # Run the save class script with the file path as argument
            result = subprocess.run([
                'node', 'save_class.js', 'temp_class.json'
            ], capture_output=True, text=True, encoding='utf-8', cwd=self.script_dir)
            
            # Clean up temp file
            if os.path.exists(temp_file):
                os.remove(temp_file)
            
            if result.returncode == 0:
                self.logger.info(f"Successfully saved class: {class_data.get('subject', '')} {class_data.get('courseNumber', '')}")
                return True
            else:
                self.logger.error(f"Failed to save class: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error saving class: {e}")
            return False
    
    def save_meeting_time(self, meeting_time_data: Dict[str, Any]) -> bool:
        """Save meeting time data to database"""
        try:
            # Save meeting time data to temporary JSON file
            temp_file = os.path.join(self.script_dir, 'temp_meeting_time.json')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(meeting_time_data, f, ensure_ascii=False, indent=2)
            
            # Run the save meeting time script with the file path as argument
            result = subprocess.run([
                'node', 'save_meeting_time.js', 'temp_meeting_time.json'
            ], capture_output=True, text=True, encoding='utf-8', cwd=self.script_dir)
            
            # Clean up temp file
            if os.path.exists(temp_file):
                os.remove(temp_file)
            
            if result.returncode == 0:
                self.logger.info(f"Successfully saved meeting time for class: {meeting_time_data.get('classId', '')}")
                return True
            else:
                self.logger.error(f"Failed to save meeting time: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error saving meeting time: {e}")
            return False
    
    def get_class_stats(self) -> Dict[str, Any]:
        """Get database statistics for classes"""
        try:
            # Create a script to get class statistics
            stats_script = os.path.join(self.script_dir, 'get_class_stats.js')
            
            script_content = '''
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function getClassStats() {
    try {
        const totalClasses = await prisma.class.count();
        const totalMeetingTimes = await prisma.meetingTime.count();
        const uniqueSubjects = await prisma.class.findMany({
            select: { subject: true },
            distinct: ['subject']
        });
        const uniqueInstructors = await prisma.class.findMany({
            select: { instructor: true },
            distinct: ['instructor'],
            where: { instructor: { not: null } }
        });

        const stats = {
            totalClasses,
            totalMeetingTimes,
            uniqueSubjects: uniqueSubjects.length,
            uniqueInstructors: uniqueInstructors.length
        };
        
        // Save to JSON file
        const outputPath = path.join(__dirname, 'class_stats.json');
        fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
        console.log(`Exported class stats to ${outputPath}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getClassStats();
'''
            
            with open(stats_script, 'w') as f:
                f.write(script_content)
            
            # Run the script
            result = subprocess.run([
                'node', 'get_class_stats.js'
            ], capture_output=True, text=True, encoding='utf-8', cwd=self.script_dir)
            
            if result.returncode == 0:
                # Read the JSON file
                json_file = os.path.join(self.script_dir, 'class_stats.json')
                if os.path.exists(json_file):
                    with open(json_file, 'r', encoding='utf-8') as f:
                        stats = json.load(f)
                    # Clean up the JSON file
                    os.remove(json_file)
                    return stats
                else:
                    self.logger.error("JSON file not created")
                    return {}
            else:
                self.logger.error(f"Error getting class stats: {result.stderr}")
                return {}
                
        except Exception as e:
            self.logger.error(f"Error in get_class_stats: {e}")
            return {}
    
    def class_exists(self, class_id: str) -> bool:
        """Check if class already exists in database"""
        try:
            # Create a script to check class existence
            check_script = os.path.join(self.script_dir, 'check_class.js')
            
            script_content = f'''
const {{ PrismaClient }} = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function checkClass() {{
    try {{
        const classData = await prisma.class.findUnique({{
            where: {{
                id: "{class_id}"
            }}
        }});
        
        console.log(classData ? 'exists' : 'not_found');
        
    }} catch (error) {{
        console.error('Error:', error);
    }} finally {{
        await prisma.$disconnect();
    }}
}}

checkClass();
'''
            
            with open(check_script, 'w') as f:
                f.write(script_content)
            
            # Run the script
            result = subprocess.run([
                'node', 'check_class.js'
            ], capture_output=True, text=True, encoding='utf-8', cwd=self.script_dir)
            
            if result.returncode == 0:
                return 'exists' in result.stdout.strip()
            else:
                self.logger.error(f"Error checking class: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error in class_exists: {e}")
            return False
    
    def get_sample_classes(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get sample classes with meeting times for testing"""
        try:
            # Create a script to get sample classes
            sample_script = os.path.join(self.script_dir, 'get_sample_classes.js')
            
            script_content = f'''
const {{ PrismaClient }} = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function getSampleClasses() {{
    try {{
        const classes = await prisma.class.findMany({{
            take: {limit},
            include: {{ meetingTimes: true }},
            where: {{ 
                AND: [
                    {{ instructor: {{ not: null }} }},
                    {{ meetingTimes: {{ some: {{}} }} }}
                ]
            }}
        }});
        
        // Save to JSON file
        const outputPath = path.join(__dirname, 'sample_classes.json');
        fs.writeFileSync(outputPath, JSON.stringify(classes, null, 2));
        console.log(`Exported {limit} sample classes to ${{outputPath}}`);
        
    }} catch (error) {{
        console.error('Error:', error);
    }} finally {{
        await prisma.$disconnect();
    }}
}}

getSampleClasses();
'''
            
            with open(sample_script, 'w') as f:
                f.write(script_content)
            
            # Run the script
            result = subprocess.run([
                'node', 'get_sample_classes.js'
            ], capture_output=True, text=True, encoding='utf-8', cwd=self.script_dir)
            
            if result.returncode == 0:
                # Read the JSON file
                json_file = os.path.join(self.script_dir, 'sample_classes.json')
                if os.path.exists(json_file):
                    with open(json_file, 'r', encoding='utf-8') as f:
                        classes = json.load(f)
                    # Clean up the JSON file
                    os.remove(json_file)
                    return classes
                else:
                    self.logger.error("JSON file not created")
                    return []
            else:
                self.logger.error(f"Error getting sample classes: {result.stderr}")
                return []
                
        except Exception as e:
            self.logger.error(f"Error in get_sample_classes: {e}")
            return [] 