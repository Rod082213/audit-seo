// app/actions.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import * as cheerio from "cheerio";

// --- Input validation and types ---
const urlSchema = z.string().url({ message: "Please enter a valid URL." });
type ActionState = { error?: string; } | null;
export type AuditResult = { id: string; };

// --- Main Server Action, this is the ONLY function that should be called from a client form ---
export async function startAudit(
  prevState: ActionState,
  formData: FormData
): Promise<AuditResult | { error: string }> {
  const urlToAudit = formData.get("url") as string;
  const validatedFields = urlSchema.safeParse(urlToAudit);

  if (!validatedFields.success) {
    return { error: "Invalid URL provided. Please enter a full URL (e.g., https://example.com)." };
  }
  const url = validatedFields.data;

  let audit;
  try {
    audit = await prisma.audit.create({
      data: { url, status: "RUNNING" },
    });
  } catch (dbError) {
    console.error("Database error:", dbError);
    return { error: "Failed to create audit record." };
  }

  try {
    const [htmlContent, lighthouseReport] = await Promise.all([
      fetch(url).then(res => res.text()).catch(() => null),
      runLighthouseAudit(url).catch((err) => {
        console.error("Lighthouse failed:", err);
        return null;
      })
    ]);

    if (!htmlContent) {
      await prisma.audit.update({ where: { id: audit.id }, data: { status: 'FAILED' } });
      return { error: `Failed to fetch content from ${url}.` };
    }

    const $ = cheerio.load(htmlContent);
    await prisma.metaTagReport.create({
      data: { auditId: audit.id, title: $("title").text() || null, description: $('meta[name="description"]').attr("content") || null, hasH1: $("h1").length > 0 }
    });

    const imageIssues = $('img').map((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt');
      if (!alt) { return { src, alt: '', issue: 'MISSING_ALT' }; }
      return null;
    }).get().filter(Boolean);

    if (imageIssues.length > 0) {
      await prisma.imageIssue.createMany({
        data: imageIssues.map(issue => ({ ...issue, auditId: audit.id }))
      });
    }

    if (lighthouseReport) {
      // @ts-expect-error - This will fail if you updated the schema for mobile/desktop. 
      // The schema expects a `formFactor` field which is not provided here.
      await prisma.lighthouseReport.create({ data: { auditId: audit.id, ...lighthouseReport } });
    }

    await prisma.audit.update({
      where: { id: audit.id },
      data: { status: "COMPLETED" },
    });

  } catch (error) {
    console.error("Audit failed:", error);
    await prisma.audit.update({ where: { id: audit.id }, data: { status: "FAILED" } });
    return { error: "An unexpected error occurred during the audit." };
  }

  redirect(`/audit/${audit.id}`);
}

// --- Helper function, kept here because it's only used by startAudit ---
async function runLighthouseAudit(url: string) {
  let chrome;
  try {
    const lighthouse = (await import("lighthouse")).default;
    const { launch } = await import("chrome-launcher");
    chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'] });
    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };
    const runnerResult = await lighthouse(url, options);
    if (!runnerResult) throw new Error("Lighthouse runner failed to return a result.");
    const report = runnerResult.lhr;
    return {
      performanceScore: Math.round((report.categories.performance.score || 0) * 100),
      accessibilityScore: Math.round((report.categories.accessibility.score || 0) * 100),
      bestPracticesScore: Math.round((report.categories['best-practices'].score || 0) * 100),
      seoScore: Math.round((report.categories.seo.score || 0) * 100),
      firstContentfulPaint: report.audits['first-contentful-paint'].displayValue,
      largestContentfulPaint: report.audits['largest-contentful-paint'].displayValue,
      cumulativeLayoutShift: report.audits['cumulative-layout-shift'].displayValue,
    };
  } finally {
    if (chrome) await chrome.kill();
  }
}

// FIX: REMOVED getAuditById and getAllAudits from this file.
// They must be moved to a separate file that does NOT have "use server"; at the top,
// for example, 'lib/data.ts'.