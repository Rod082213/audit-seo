// app/page.tsx
"use client";

// 1. Import useActionState from "react" instead of useFormState from "react-dom"
import { useActionState, useEffect, useRef } from "react"; 
import { useFormStatus } from "react-dom"; // useFormStatus still comes from react-dom
import { startAudit } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Auditing..." : "Audit Website"}
    </Button>
  );
}

export default function HomePage() {
  // 2. Rename useFormState to useActionState
  const [state, formAction] = useActionState(startAudit, null);
  const formRef = useRef<HTMLFormElement>(null);

  // This will reset the form after a successful submission (which results in a redirect)
  useEffect(() => {
    if (!state?.error) {
      formRef.current?.reset();
    }
  }, [state]);


  return (
    <div className="container flex items-center justify-center py-12 align-self-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">SEO Website Audit</CardTitle>
          <CardDescription>
            Enter a URL to analyze its SEO, performance, and accessibility.
          </CardDescription>
        </CardHeader>
        <form ref={formRef} action={formAction}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="url"
                  name="url"
                  placeholder="https://example.com"
                  required
                />
              </div>
              {state?.error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}