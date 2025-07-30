const DatabaseClient = require('./db_client.js');

async function saveProfessor() {
    const dbClient = new DatabaseClient();
    
    try {
        // Get the data file path from command line arguments
        const dataFile = process.argv[2];
        
        if (!dataFile) {
            console.error('Usage: node save_professor.js <data_file>');
            process.exit(1);
        }
        
        // Read the professor data
        const fs = require('fs');
        const professorData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        
        // Save to database
        const result = await dbClient.saveProfessor(professorData);
        
        if (result.success) {
            console.log(JSON.stringify({
                success: true,
                professor: {
                    id: result.professor.id,
                    name: `${result.professor.firstName} ${result.professor.lastName}`,
                    department: result.professor.department
                }
            }));
        } else {
            console.error(JSON.stringify({
                success: false,
                error: result.error
            }));
            process.exit(1);
        }
        
    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message
        }));
        process.exit(1);
    } finally {
        await dbClient.disconnect();
    }
}

saveProfessor(); 