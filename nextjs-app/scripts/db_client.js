const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class DatabaseClient {
    async saveProfessor(professorData) {
        try {
            const professorRecord = {
                id: professorData.id,
                legacyId: professorData.legacyId?.toString(),
                firstName: professorData.firstName,
                lastName: professorData.lastName,
                department: professorData.department,
                departmentId: professorData.departmentId,
                lockStatus: professorData.lockStatus,
                isSaved: professorData.isSaved || false,
                isProfCurrentUser: professorData.isProfCurrentUser || false,
                
                // School info
                schoolName: professorData.schoolName,
                schoolCity: professorData.schoolCity,
                schoolState: professorData.schoolState,
                schoolCountry: professorData.schoolCountry,
                
                // Rating info
                avgRating: professorData.avgRating,
                numRatings: professorData.numRatings || 0,
                avgDifficulty: professorData.avgDifficulty,
                wouldTakeAgainPercent: professorData.wouldTakeAgainPercent,
                
                // Rating distribution
                ratingTotal: professorData.ratingTotal || 0,
                ratingR1: professorData.ratingR1 || 0,
                ratingR2: professorData.ratingR2 || 0,
                ratingR3: professorData.ratingR3 || 0,
                ratingR4: professorData.ratingR4 || 0,
                ratingR5: professorData.ratingR5 || 0,
                
                // JSON fields
                teacherTags: professorData.teacherTags ? JSON.stringify(professorData.teacherTags) : null,
                courseCodes: professorData.courseCodes ? JSON.stringify(professorData.courseCodes) : null,
                relatedTeachers: professorData.relatedTeachers ? JSON.stringify(professorData.relatedTeachers) : null
            };
            
            const savedProfessor = await prisma.professor.upsert({
                where: { id: professorData.id },
                update: professorRecord,
                create: professorRecord
            });
            
            return { success: true, professor: savedProfessor };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async saveRating(ratingData) {
        try {
            const ratingRecord = {
                id: ratingData.id,
                legacyId: ratingData.legacyId?.toString(),
                professorId: ratingData.professorId,
                
                // Rating data
                comment: ratingData.comment,
                date: ratingData.date ? new Date(ratingData.date) : null,
                class: ratingData.class,
                
                // Individual ratings
                difficultyRating: ratingData.difficultyRating,
                clarityRating: ratingData.clarityRating,
                helpfulRating: ratingData.helpfulRating,
                
                // Course meta
                wouldTakeAgain: ratingData.wouldTakeAgain,
                grade: ratingData.grade,
                attendanceMandatory: ratingData.attendanceMandatory,
                textbookUse: ratingData.textbookUse,
                isForOnlineClass: ratingData.isForOnlineClass,
                isForCredit: ratingData.isForCredit,
                
                // Tags and flags
                ratingTags: ratingData.ratingTags ? JSON.stringify(ratingData.ratingTags) : null,
                flagStatus: ratingData.flagStatus,
                createdByUser: ratingData.createdByUser,
                
                // Thumbs up/down
                thumbsUpTotal: ratingData.thumbsUpTotal || 0,
                thumbsDownTotal: ratingData.thumbsDownTotal || 0,
                
                // Professor response
                teacherNote: ratingData.teacherNote
            };
            
            const savedRating = await prisma.rating.upsert({
                where: { id: ratingData.id },
                update: ratingRecord,
                create: ratingRecord
            });
            
            return { success: true, rating: savedRating };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async professorExists(professorId) {
        try {
            const professor = await prisma.professor.findUnique({
                where: { id: professorId }
            });
            return { exists: !!professor };
        } catch (error) {
            return { exists: false, error: error.message };
        }
    }
    
    async getProfessor(professorId) {
        try {
            const professor = await prisma.professor.findUnique({
                where: { id: professorId },
                include: { ratings: true }
            });
            return { success: true, professor };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async disconnect() {
        await prisma.$disconnect();
    }
}

module.exports = DatabaseClient; 