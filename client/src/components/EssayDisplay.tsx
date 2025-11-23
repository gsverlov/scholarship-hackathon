import { useState } from "react";
import { Copy, Download, RefreshCw, Check, FileText, Target, Lightbulb, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { EssayResult } from "@shared/schema";

interface EssayDisplayProps {
  essayResult: EssayResult;
  onStartOver: () => void;
}

export function EssayDisplay({ essayResult, onStartOver }: EssayDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(essayResult.essay);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Essay copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy essay. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([essayResult.essay], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${essayResult.scholarship_name.replace(/[^a-zA-Z0-9]/g, "_")}_essay.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Essay saved to your device.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Your Personalized Essay
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          Generated using AI-powered strategy matching
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="space-y-2 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Scholarship</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium line-clamp-2" data-testid="text-scholarship-name">
              {essayResult.scholarship_name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2 pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Strategy</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium line-clamp-2" data-testid="text-strategy">
              {essayResult.selected_strategy.cluster_name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2 pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Approach</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {essayResult.matching_clusters.slice(0, 2).map((cluster, idx) => (
                <Badge key={cluster} variant="secondary" className="text-xs" data-testid={`badge-cluster-${idx}`}>
                  {cluster.length > 15 ? cluster.substring(0, 15) + "..." : cluster}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Essay</CardTitle>
              <CardDescription className="mt-1">
                {essayResult.essay.split(/\s+/).length} words
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                data-testid="button-copy"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                data-testid="button-download"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-lg max-w-none font-serif leading-relaxed"
            data-testid="essay-content"
          >
            {essayResult.essay.split("\n\n").map((paragraph, index) => (
              <p key={index} className="mb-4 text-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted p-6 rounded-lg">
        <h3 className="font-semibold mb-2">Writing Strategy Used</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {essayResult.selected_strategy.description_archetype}
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-primary hover:underline" data-testid="toggle-strategy-details">
            View Strategy Details
          </summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <div>
              <strong className="text-foreground">Instructions:</strong>
              <p className="mt-1">{essayResult.selected_strategy.writing_strategy.broad_instructions}</p>
            </div>
            <div>
              <strong className="text-foreground">Structure:</strong>
              <p className="mt-1 whitespace-pre-line">
                {essayResult.selected_strategy.writing_strategy.structural_template}
              </p>
            </div>
          </div>
        </details>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={onStartOver}
          data-testid="button-start-over"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </div>
    </div>
  );
}
