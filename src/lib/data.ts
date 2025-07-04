// lib/data.ts
import { prisma } from "./prisma";

export async function getAllAudits() {
    return prisma.audit.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getAuditById(id: string) {
    return prisma.audit.findUnique({
        where: { id },
        include: {
            metaTagReport: true,
            lighthouseReport: true, // This will be a single object based on your old schema
            imageIssues: true,
            linkIssues: true,
        },
    });
}