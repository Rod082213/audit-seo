/*
  Warnings:

  - You are about to drop the column `formFactor` on the `LighthouseReport` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ImageIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "issue" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    CONSTRAINT "ImageIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LighthouseReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performanceScore" INTEGER NOT NULL,
    "accessibilityScore" INTEGER NOT NULL,
    "bestPracticesScore" INTEGER NOT NULL,
    "seoScore" INTEGER NOT NULL,
    "firstContentfulPaint" TEXT NOT NULL,
    "largestContentfulPaint" TEXT NOT NULL,
    "cumulativeLayoutShift" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    CONSTRAINT "LighthouseReport_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LighthouseReport" ("accessibilityScore", "auditId", "bestPracticesScore", "cumulativeLayoutShift", "firstContentfulPaint", "id", "largestContentfulPaint", "performanceScore", "seoScore") SELECT "accessibilityScore", "auditId", "bestPracticesScore", "cumulativeLayoutShift", "firstContentfulPaint", "id", "largestContentfulPaint", "performanceScore", "seoScore" FROM "LighthouseReport";
DROP TABLE "LighthouseReport";
ALTER TABLE "new_LighthouseReport" RENAME TO "LighthouseReport";
CREATE UNIQUE INDEX "LighthouseReport_auditId_key" ON "LighthouseReport"("auditId");
CREATE TABLE "new_LinkIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "href" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" INTEGER,
    "issue" TEXT,
    "auditId" TEXT NOT NULL,
    CONSTRAINT "LinkIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LinkIssue" ("auditId", "href", "id", "issue", "status", "text") SELECT "auditId", "href", "id", "issue", "status", "text" FROM "LinkIssue";
DROP TABLE "LinkIssue";
ALTER TABLE "new_LinkIssue" RENAME TO "LinkIssue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
