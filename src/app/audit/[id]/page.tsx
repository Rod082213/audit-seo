// app/audit/[id]/page.tsx
import { getAuditById } from "@/app/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

// A small component for the score gauges
const ScoreGauge = ({ score, title }: { score: number, title: string }) => {
  const getScoreColor = (s: number) => {
    if (s >= 90) return "bg-green-500";
    if (s >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full" viewBox="0 0 36 36">
            <path
                className="text-muted"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
                className={getScoreColor(score).replace('bg-','text-')}
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-semibold">
          {score}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
};


// FIX: Removed the explicit type definition and let TypeScript infer it.
export default async function AuditResultPage({ params }: { params: { id: string } }) {
  const audit = await getAuditById(params.id);

  if (!audit) {
    notFound();
  }

  // This check is necessary to ensure `lighthouseReport` is not an array if you
  // haven't updated your schema for mobile/desktop yet.
  if (Array.isArray(audit.lighthouseReport)) {
    // Handle the case where it's an array, or show an error/default state.
    // For now, we'll just prevent the page from crashing.
    return <div>Error: Unexpected report format.</div>;
  }

  const { metaTagReport, lighthouseReport, imageIssues, linkIssues } = audit;

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tighter">Audit Report</h1>
        <p className="text-muted-foreground break-all">
          Showing results for:{" "}
          <a
            href={audit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {audit.url}
          </a>
        </p>
      </div>

      <div className="grid gap-6">
        {/* Lighthouse Scores */}
        {lighthouseReport && (
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals & Lighthouse Scores</CardTitle>
              <CardDescription>
                Performance metrics reported by Google Lighthouse.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4">
                    <ScoreGauge score={lighthouseReport.performanceScore} title="Performance" />
                    <ScoreGauge score={lighthouseReport.accessibilityScore} title="Accessibility" />
                    <ScoreGauge score={lighthouseReport.bestPracticesScore} title="Best Practices" />
                    <ScoreGauge score={lighthouseReport.seoScore} title="SEO" />
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="font-bold text-lg">{lighthouseReport.firstContentfulPaint}</p>
                        <p className="text-sm text-muted-foreground">First Contentful Paint</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg">{lighthouseReport.largestContentfulPaint}</p>
                        <p className="text-sm text-muted-foreground">Largest Contentful Paint</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg">{lighthouseReport.cumulativeLayoutShift}</p>
                        <p className="text-sm text-muted-foreground">Cumulative Layout Shift</p>
                    </div>
                </div>
            </CardContent>
          </Card>
        )}

        {/* Meta Tag Report */}
        {metaTagReport && (
          <Card>
            <CardHeader>
              <CardTitle>Meta Tag Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                    {metaTagReport.title ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" /> : <XCircle className="h-5 w-5 text-red-500 mt-1" />}
                    <div>
                        <p className="font-medium">Title Tag</p>
                        <p className="text-sm text-muted-foreground">{metaTagReport.title ? `"${metaTagReport.title}"` : "Missing"}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    {metaTagReport.description ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" /> : <XCircle className="h-5 w-5 text-red-500 mt-1" />}
                    <div>
                        <p className="font-medium">Meta Description</p>
                        <p className="text-sm text-muted-foreground">{metaTagReport.description ? `"${metaTagReport.description}"` : "Missing"}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    {metaTagReport.hasH1 ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" /> : <XCircle className="h-5 w-5 text-red-500 mt-1" />}
                    <div>
                        <p className="font-medium">H1 Heading</p>
                        <p className="text-sm text-muted-foreground">{metaTagReport.hasH1 ? "Found" : "Missing"}</p>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Image SEO</CardTitle>
            <CardDescription>
              {imageIssues.length > 0
                ? `${imageIssues.length} image(s) are missing alt text.`
                : "All images seem to have alt text. Good job!"}
            </CardDescription>
          </CardHeader>
          {imageIssues.length > 0 && (
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image Preview</TableHead>
                    <TableHead>Issue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imageIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="break-all font-medium">
                        <img src={issue.src.startsWith('http') ? issue.src : audit.url + issue.src} alt="Missing Alt Text" className="h-10 w-10 object-cover rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">Missing Alt Text</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>

         {/* Link Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Link Analysis</CardTitle>
            <CardDescription>
                Found {linkIssues.length} links on the page. 
                <span className="block text-xs mt-1">(Note: This version does not check for broken links (404s) in real-time.)</span>
            </CardDescription>
          </CardHeader>
          {linkIssues.length > 0 && (
            <CardContent>
              <div className="h-64 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Link Text</TableHead>
                        <TableHead>URL Destination</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {linkIssues.map((link) => (
                        <TableRow key={link.id}>
                            <TableCell className="font-medium">{link.text || 'N/A'}</TableCell>
                            <TableCell className="break-all">{link.href}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>

      </div>
    </div>
  );
}