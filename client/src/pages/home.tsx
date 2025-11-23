import { useState } from "react";
import { ProfileForm } from "@/components/ProfileForm";
import { ScholarshipResults } from "@/components/ScholarshipResults";
import { EssayDisplay } from "@/components/EssayDisplay";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import type { StudentProfile, ScholarshipMatch, EssayResult } from "@shared/schema";

type WorkflowStep = "profile" | "match" | "select" | "generate";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("profile");
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [scholarships, setScholarships] = useState<ScholarshipMatch[]>([]);
  const [selectedScholarship, setSelectedScholarship] = useState<ScholarshipMatch | null>(null);
  const [essayResult, setEssayResult] = useState<EssayResult | null>(null);

  const handleProfileSubmit = (profile: StudentProfile, matches: ScholarshipMatch[]) => {
    setStudentProfile(profile);
    setScholarships(matches);
    setCurrentStep("match");
  };

  const handleScholarshipSelect = (scholarship: ScholarshipMatch) => {
    setSelectedScholarship(scholarship);
    setCurrentStep("select");
  };

  const handleEssayGenerated = (result: EssayResult) => {
    setEssayResult(result);
    setCurrentStep("generate");
  };

  const handleStartOver = () => {
    setCurrentStep("profile");
    setStudentProfile(null);
    setScholarships([]);
    setSelectedScholarship(null);
    setEssayResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8">
          <h1 className="text-4xl font-semibold text-foreground">ScholarshipAI</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Match with scholarships and generate winning essays powered by AI
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        <ProgressIndicator currentStep={currentStep} />

        <div className="mt-8">
          {currentStep === "profile" && (
            <ProfileForm onSubmit={handleProfileSubmit} />
          )}

          {currentStep === "match" && scholarships.length > 0 && studentProfile && (
            <ScholarshipResults
              scholarships={scholarships}
              studentProfile={studentProfile}
              onScholarshipSelect={handleScholarshipSelect}
              onEssayGenerated={handleEssayGenerated}
            />
          )}

          {(currentStep === "select" || currentStep === "generate") && essayResult && (
            <EssayDisplay
              essayResult={essayResult}
              onStartOver={handleStartOver}
            />
          )}
        </div>
      </div>
    </div>
  );
}
