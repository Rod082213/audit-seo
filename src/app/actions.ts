// app/actions.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import * as cheerio from "cheerio";
// We remove the static imports for lighthouse and chrome-launcher here

// Input validation schema
const urlSchema = z.string().url({ message: "Please enter a valid URL." });

export type AuditResult = {
  id: string;
};

// This is the main function that performs the audit
export async function startAudit(
  prevState: any,
  formData: FormData
): Promise<AuditResult | { error: string }> {
  const urlToAudit = formData.get("url") as string;
  const validatedFields = urlSchema.safeParse(urlToAudit);

  if (!validatedFields.success) {
    return {
      error: "Invalid URL provided. Please enter a full URL (e.g., https://example.com).",
    };
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
    // Run audits...
    const [htmlContent, lighthouseReport] = await Promise.all([
      fetch(url).then(res => res.text()).catch(() => null),
      runLighthouseAudit(url).catch((err) => {
          console.error("Lighthouse failed:", err);
          return null;
      })
    ]);

    if (!htmlContent) {
      await prisma.audit.update({ where: { id: audit.id }, data: { status: 'FAILED' } });
      return { error: `Failed to fetch content from ${url}. The site may be down or blocking requests.` };
    }

    const $ = cheerio.load(htmlContent);
    // ... (rest of the cheerio logic is the same)
    const title = $("title").text();
    const description = $('meta[name="description"]').attr("content") || null;
    const hasH1 = $("h1").length > 0;
    
    await prisma.metaTagReport.create({
        data: { auditId: audit.id, title, description, hasH1 }
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

    // Save Lighthouse Report
    if (lighthouseReport) {
        await prisma.lighthouseReport.create({ data: { auditId: audit.id, ...lighthouseReport }});
    }

    await prisma.audit.update({
      where: { id: audit.id },
      data: { status: "COMPLETED" },
    });

  } catch (error) {
    console.error("Audit failed:", error);
    await prisma.audit.update({
      where: { id: audit.id },
      data: { status: "FAILED" },
    });
    return { error: "An unexpected error occurred during the audit." };
  }

  redirect(`/audit/${audit.id}`);
}

// This self-contained function now dynamically imports lighthouse
async function runLighthouseAudit(url: string) {
  // Dynamically import the libraries only when this function is called
  const lighthouse = (await import("lighthouse")).default;
  const { launch } = await import("chrome-launcher");

  const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);
  
  if (!runnerResult) {
      await chrome.kill();
      throw new Error("Lighthouse runner failed to return a result.");
  }

  const report = runnerResult.lhr;
  
  await chrome.kill();

  return {
      performanceScore: Math.round((report.categories.performance.score || 0) * 100),
      accessibilityScore: Math.round((report.categories.accessibility.score || 0) * 100),
      bestPracticesScore: Math.round((report.categories['best-practices'].score || 0) * 100),
      seoScore: Math.round((report.categories.seo.score || 0) * 100),
      firstContentfulPaint: report.audits['first-contentful-paint'].displayValue,
      largestContentfulPaint: report.audits['largest-contentful-paint'].displayValue,
      cumulativeLayoutShift: report.audits['cumulative-layout-shift'].displayValue,
  };
}


// --- Other actions remain the same ---

export async function getAllAudits() {
    return prisma.audit.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getAuditById(id: string) {
    return prisma.audit.findUnique({
        where: { id },
        include: {
            metaTagReport: true,
            lighthouseReport: true,
            imageIssues: true,
            linkIssues: true,
        },
    });
}