// app/audit/[id]/page.tsx
import { getAuditById } from "@/lib/data"; // THE KEY FIX IS THIS IMPORT
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle, Smartphone, Monitor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LighthouseReport } from "@prisma/client";

const ScoreGauge = ({ score, title }: { score: number, title: string }) => {
  const getScoreColor = (s: number) => {
    if (s >= 90) return "text-green-500";
    if (s >= 50) return "text-yellow-500";
    return "text-red-500";
  };
  const colorClass = getScoreColor(score);
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full" viewBox="0 0 36 36">
          <path className="text-muted/30" stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path className={colorClass} stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" strokeDasharray={`${score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold ${colorClass}`}>{score}</div>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
    </div>
  );
};

const LighthouseReportTab = ({ report }: { report: LighthouseReport }) => (
    <>
        <div className="grid grid-cols-2 gap-y-8 gap-x-4 py-4 sm:grid-cols-4">
            <ScoreGauge score={report.performanceScore} title="Performance" />
            <ScoreGauge score={report.accessibilityScore} title="Accessibility" />
            <ScoreGauge score={report.bestPracticesScore} title="Best Practices" />
            <ScoreGauge score={report.seoScore} title="SEO" />
        </div>
        <Separator className="my-6" />
        <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
            <div><p className="font-bold text-2xl">{report.firstContentfulPaint}</p><p className="text-sm text-muted-foreground">First Contentful Paint</p></div>
            <div><p className="font-bold text-2xl">{report.largestContentfulPaint}</p><p className="text-sm text-muted-foreground">Largest Contentful Paint</p></div>
            <div><p className="font-bold text-2xl">{report.cumulativeLayoutShift}</p><p className="text-sm text-muted-foreground">Cumulative Layout Shift</p></div>
        </div>
    </>
)

export default async function AuditResultPage({ params }: { params: { id: string } }) {
  const audit = await getAuditById(params.id);

  if (!audit) {
    notFound();
  }

  const { metaTagReport, lighthouseReports, imageIssues, linkIssues } = audit;

  const mobileReport = lighthouseReports.find(r => r.formFactor === 'MOBILE');
  const desktopReport = lighthouseReports.find(r => r.formFactor === 'DESKTOP');

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-2 mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Audit Report</h1>
        <p className="text-lg text-muted-foreground">Showing results for: <a href={audit.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary break-all underline-offset-4 hover:underline">{audit.url}</a></p>
      </div>

      <div className="grid gap-8">
        {(mobileReport && desktopReport) ? (
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Core Web Vitals & Lighthouse Scores</CardTitle>
                    <CardDescription>Performance metrics for mobile and desktop.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="mobile" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="mobile"><Smartphone className="mr-2 h-4 w-4" />Mobile</TabsTrigger>
                            <TabsTrigger value="desktop"><Monitor className="mr-2 h-4 w-4" />Desktop</TabsTrigger>
                        </TabsList>
                        <TabsContent value="mobile" className="mt-4"><LighthouseReportTab report={mobileReport} /></TabsContent>
                        <TabsContent value="desktop" className="mt-4"><LighthouseReportTab report={desktopReport} /></TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        ) : (
          <Card><CardHeader><CardTitle>Lighthouse Report Pending</CardTitle><CardContent><p>The report is generating, failed, or data is missing.</p></CardContent></CardHeader></Card>
        )}
        {metaTagReport && (
          <Card>
            <CardHeader><CardTitle className="text-xl">Meta Tag Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-6 text-sm">
              <div className="flex items-start gap-4">
                {metaTagReport.title ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />}
                <div><p className="font-semibold">Title Tag</p><p className="text-muted-foreground break-words">{metaTagReport.title || "Missing"}</p></div>
              </div>
              <div className="flex items-start gap-4">
                {metaTagReport.description ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />}
                <div><p className="font-semibold">Meta Description</p><p className="text-muted-foreground break-words">{metaTagReport.description || "Missing"}</p></div>
              </div>
              <div className="flex items-start gap-4">
                {metaTagReport.hasH1 ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />}
                <div><p className="font-semibold">H1 Heading</p><p className="text-muted-foreground">{metaTagReport.hasH1 ? "Found" : "Missing"}</p></div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Image SEO</CardTitle>
            <CardDescription>{imageIssues.length > 0 ? `Found ${imageIssues.length} image(s) missing alt text.` : "All images seem to have alt text. Good job!"}</CardDescription>
          </CardHeader>
          {imageIssues.length > 0 && (
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Preview</TableHead><TableHead className="w-[80%]">Image Source (URL)</TableHead><TableHead>Issue</TableHead></TableRow></TableHeader>
                <TableBody>
                  {imageIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell><img src={issue.src.startsWith('http') ? issue.src : new URL(issue.src, audit.url).href} alt="Missing Alt Text" className="h-10 w-10 object-cover rounded-md bg-muted" /></TableCell>
                      <TableCell className="break-all font-mono text-xs">{issue.src}</TableCell>
                      <TableCell><Badge variant="destructive">Missing Alt</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Link Health</CardTitle>
                <CardDescription>{linkIssues.length > 0 ? `Found ${linkIssues.length} broken link(s).` : "No broken links were found. Great!"}</CardDescription>
            </CardHeader>
            {linkIssues.length > 0 && (
                <CardContent>
                    <Table><TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Link Text</TableHead><TableHead className="w-[50%]">URL</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {linkIssues.map((issue) => (
                                <TableRow key={issue.id}>
                                    <TableCell><Badge variant={issue.status >= 500 ? "destructive" : "secondary"}>{issue.status}</Badge></TableCell>
                                    <TableCell className="font-medium">{issue.text || "N/A"}</TableCell>
                                    <TableCell className="break-all font-mono text-xs">{issue.href}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            )}
        </Card>
      </div>
    </div>
  );
}