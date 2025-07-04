// app/actions.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import * as cheerio from "cheerio";
import type { Prisma } from "@prisma/client";

// --- Type Definitions ---
const urlSchema = z.string().url({ message: "Please enter a valid URL." });
type FormFactor = "mobile" | "desktop";
export type ActionState = { error?: string; id?: string; } | null;

// --- Helper Functions ---

async function checkLink(url: string, base: string) {
    let absoluteUrl: URL;
    try {
        // FIX 1: The 'e' variable is unused. Prefix with an underscore to tell the linter it's intentional.
        absoluteUrl = new URL(url, base);
    } catch (_e) {
        return { status: 'INVALID_URL' };
    }
    if (absoluteUrl.protocol !== 'http:' && absoluteUrl.protocol !== 'https:') {
        return { status: 'SKIPPED_PROTOCOL' };
    }
    try {
        const response = await fetch(absoluteUrl.href, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000),
            redirect: 'follow',
        });
        return { status: response.status };
    } catch (error: unknown) { // FIX 2: Use 'unknown' instead of 'any' for type safety.
        // Check if the error is an object with a 'name' property
        if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'TimeoutError') {
             return { status: 408 };
        }
        return { status: 500 };
    }
}

async function runLighthouseAudit(url: string, formFactor: FormFactor) {
    let chrome;
    try {
        const lighthouse = (await import("lighthouse")).default;
        const { launch } = await import("chrome-launcher");
        const chromeFlags = ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];
        chrome = await launch({ chromeFlags });
        const options = {
            logLevel: 'info' as const,
            output: 'json' as const,
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            port: chrome.port,
            formFactor: formFactor,
            screenEmulation: {
                mobile: formFactor === 'mobile',
                width: formFactor === 'mobile' ? 360 : 1920,
                height: formFactor === 'mobile' ? 640 : 1080,
                deviceScaleFactor: formFactor === 'mobile' ? 2 : 1,
                disabled: formFactor === 'desktop',
            },
        };
        const runnerResult = await lighthouse(url, options);
        if (!runnerResult) throw new Error("Lighthouse returned no result.");
        const report = runnerResult.lhr;
        return {
            formFactor: formFactor.toUpperCase(),
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

// --- The Main Server Action ---
export async function startAudit(prevState: ActionState, formData: FormData) {
  const urlToAudit = formData.get("url") as string;
  const validatedFields = urlSchema.safeParse(urlToAudit);

  if (!validatedFields.success) {
    return { error: "Invalid URL. Please enter a full URL (e.g., https://example.com)." };
  }
  const url = validatedFields.data;

  const audit = await prisma.audit.create({
    data: { url, status: "RUNNING" },
  });

  try {
    const [htmlContent, mobileResult, desktopResult] = await Promise.all([
      fetch(url).then(res => res.text()).catch(() => null),
      runLighthouseAudit(url, 'mobile'),
      runLighthouseAudit(url, 'desktop')
    ]);

    if (!htmlContent) throw new Error(`Failed to fetch content from ${url}.`);

    await prisma.lighthouseReport.createMany({
      data: [
        { auditId: audit.id, ...mobileResult },
        { auditId: audit.id, ...desktopResult }
      ]
    });

    const $ = cheerio.load(htmlContent);

    await prisma.metaTagReport.create({
      data: {
        auditId: audit.id,
        title: $("title").text() || null,
        description: $('meta[name="description"]').attr("content") || null,
        hasH1: $("h1").length > 0,
      },
    });

    const imageIssues = $('img').map((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt');
      return (!alt) ? { src, alt: '', issue: 'MISSING_ALT' } : null;
    }).get().filter(Boolean);

    if (imageIssues.length > 0) {
      await prisma.imageIssue.createMany({ data: imageIssues.map(issue => ({ ...issue, auditId: audit.id }))});
    }

    const linkPromises = $('a[href]').map((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      return (href) ? { href, text } : null;
    }).get().filter(Boolean);

    const linkCheckResults = await Promise.allSettled(linkPromises.map(link => checkLink(link.href, url)));

    // FIX 3: Use .reduce() for a type-safe way to build the 'brokenLinks' array, removing the need for 'as any'.
    const brokenLinks = linkCheckResults.reduce<Prisma.LinkIssueCreateManyInput[]>((acc, result, i) => {
      if (result.status === 'fulfilled' && result.value.status >= 400) {
        acc.push({
          auditId: audit.id,
          href: linkPromises[i].href,
          text: linkPromises[i].text,
          status: result.value.status,
          issue: 'BROKEN_LINK'
        });
      }
      return acc;
    }, []);

    if (brokenLinks.length > 0) {
      await prisma.linkIssue.createMany({ data: brokenLinks });
    }

    await prisma.audit.update({
      where: { id: audit.id },
      data: { status: "COMPLETED" },
    });

  } catch (error) {
    console.error("Audit failed with error:", error);
    await prisma.audit.update({ where: { id: audit.id }, data: { status: "FAILED" } });
    return { error: "The audit could not be completed. The target site may be blocking automated tools or is currently down." };
  }

  redirect(`/audit/${audit.id}`);
}