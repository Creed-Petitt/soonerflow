
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportQualifiedProfessors() {
    try {
        // Get professors with minimum ratings threshold
        const professors = await prisma.professor.findMany({
            where: {
                numRatings: {
                    gte: 10
                }
            },
            orderBy: {
                numRatings: 'desc'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                department: true,
                numRatings: true,
                avgRating: true
            }
        });
        
        // Save to JSON file
        const outputPath = path.join(__dirname, 'qualified_professors.json');
        fs.writeFileSync(outputPath, JSON.stringify(professors, null, 2));
        console.log(`Exported ${professors.length} qualified professors to ${outputPath}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportQualifiedProfessors();
