-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MetaTagReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "description" TEXT,
    "hasH1" BOOLEAN NOT NULL,
    "auditId" TEXT NOT NULL,
    CONSTRAINT "MetaTagReport_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LighthouseReport" (
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

-- CreateTable
CREATE TABLE "ImageIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "issue" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    CONSTRAINT "ImageIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "href" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" INTEGER,
    "issue" TEXT,
    "auditId" TEXT NOT NULL,
    CONSTRAINT "LinkIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MetaTagReport_auditId_key" ON "MetaTagReport"("auditId");

-- CreateIndex
CREATE UNIQUE INDEX "LighthouseReport_auditId_key" ON "LighthouseReport"("auditId");
