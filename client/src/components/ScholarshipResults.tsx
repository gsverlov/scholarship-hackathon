import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, Award, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ScholarshipMatch, StudentProfile, EssayResult } from "@shared/schema";

interface ScholarshipResultsProps {
  scholarships: ScholarshipMatch[];
  studentProfile: StudentProfile;
  onScholarshipSelect: (scholarship: ScholarshipMatch) => void;
  onEssayGenerated: (result: EssayResult) => void;
}

export function ScholarshipResults({
  scholarships,
  studentProfile,
  onScholarshipSelect,
  onEssayGenerated,
}: ScholarshipResultsProps) {
  const { toast } = useToast();
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const generateEssayMutation = useMutation({
    mutationFn: async ({
      scholarship,
      profile,
    }: {
      scholarship: ScholarshipMatch;
      profile: StudentProfile;
    }) => {
      const response = await apiRequest<EssayResult>(
        "POST",
        "/api/generate-essay",
        {
          scholarshipDescription: scholarship.full_text,
          studentProfile: profile,
        }
      );
      return { result: response, scholarship };
    },
    onSuccess: ({ result, scholarship }) => {
      toast({
        title: "Essay Generated!",
        description: "Your personalized essay is ready.",
      });
      onScholarshipSelect(scholarship);
      onEssayGenerated(result);
      setGeneratingFor(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate essay. Please try again.",
        variant: "destructive",
      });
      setGeneratingFor(null);
    },
  });

  const handleGenerateEssay = (scholarship: ScholarshipMatch) => {
    setGeneratingFor(scholarship.scholarship);
    generateEssayMutation.mutate({ scholarship, profile: studentProfile });
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return "secondary";
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          Top 5 Scholarship Matches
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          Select a scholarship to generate a personalized winning essay
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {scholarships.map((scholarship, index) => {
          const isGenerating = generatingFor === scholarship.scholarship;
          const matchScore = scholarship.match_score || Math.round((1 - scholarship.distance) * 100);

          return (
            <Card
              key={scholarship.scholarship}
              className="flex flex-col hover-elevate transition-all"
              data-testid={`card-scholarship-${index}`}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl line-clamp-2">
                    {scholarship.scholarship}
                  </CardTitle>
                  <Badge variant={getMatchScoreColor(matchScore)} data-testid={`badge-score-${index}`}>
                    {matchScore}%
                  </Badge>
                </div>
                {scholarship.metadata.award_amount && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>{scholarship.metadata.award_amount}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <CardDescription className="line-clamp-3">
                  {scholarship.full_text.substring(0, 200)}...
                </CardDescription>

                <div className="space-y-2">
                  {scholarship.metadata.minimum_gpa && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Min GPA:</span>
                      <span className="font-medium">{scholarship.metadata.minimum_gpa}</span>
                    </div>
                  )}

                  {scholarship.metadata.degree_levels && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-medium line-clamp-1">
                        {scholarship.metadata.degree_levels}
                      </span>
                    </div>
                  )}

                  {scholarship.reasoning && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {scholarship.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => handleGenerateEssay(scholarship)}
                  disabled={isGenerating || generateEssayMutation.isPending}
                  data-testid={`button-generate-${index}`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Essay...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Essay
                    </>
                  )}
                </Button>

                {scholarship.url && (
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                    data-testid={`button-view-${index}`}
                  >
                    <a
                      href={scholarship.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Details
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
