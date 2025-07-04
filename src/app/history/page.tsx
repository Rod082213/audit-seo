// app/history/page.tsx
import { getAllAudits } from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const statusColorMap: { [key: string]: "default" | "destructive" | "secondary" | "outline" } = {
    'COMPLETED': 'default',
    'FAILED': 'destructive',
    'RUNNING': 'secondary',
    'PENDING': 'outline'
};

export default async function HistoryPage() {
  const audits = await getAllAudits();

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
          <CardDescription>
            A list of all your past website audits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium break-all">{audit.url}</TableCell>
                  <TableCell>
                    <Badge variant={statusColorMap[audit.status] || 'secondary'}>
                        {audit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(audit.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm" disabled={audit.status !== 'COMPLETED'}>
                      <Link href={`/audit/${audit.id}`}>View Report</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {audits.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>No audits found.</p>
                    <Button asChild className="mt-4">
                        <Link href="/">Start Your First Audit</Link>
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}