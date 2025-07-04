/*
  Warnings:

  - You are about to drop the `ImageIssue` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `formFactor` to the `LighthouseReport` table without a default value. This is not possible if the table is not empty.
  - Made the column `issue` on table `LinkIssue` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `LinkIssue` required. This step will fail if there are existing NULL values in that column.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ImageIssue";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LighthouseReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formFactor" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "LighthouseReport_auditId_formFactor_key" ON "LighthouseReport"("auditId", "formFactor");
CREATE TABLE "new_LinkIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "href" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "issue" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    CONSTRAINT "LinkIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LinkIssue" ("auditId", "href", "id", "issue", "status", "text") SELECT "auditId", "href", "id", "issue", "status", "text" FROM "LinkIssue";
DROP TABLE "LinkIssue";
ALTER TABLE "new_LinkIssue" RENAME TO "LinkIssue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
