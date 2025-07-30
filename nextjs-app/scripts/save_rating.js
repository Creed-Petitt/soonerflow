const DatabaseClient = require('./db_client.js');

async function saveRating() {
    const dbClient = new DatabaseClient();
    
    try {
        // Get the data file path from command line arguments
        const dataFile = process.argv[2];
        
        if (!dataFile) {
            console.error('Usage: node save_rating.js <data_file>');
            process.exit(1);
        }
        
        // Read the rating data
        const fs = require('fs');
        const ratingData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        
        // Save to database
        const result = await dbClient.saveRating(ratingData);
        
        if (result.success) {
            console.log(JSON.stringify({
                success: true,
                rating: {
                    id: result.rating.id,
                    professorId: result.rating.professorId,
                    class: result.rating.class
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

saveRating(); 