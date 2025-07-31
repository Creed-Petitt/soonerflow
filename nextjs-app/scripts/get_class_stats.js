
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
