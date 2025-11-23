import { Check } from "lucide-react";

type WorkflowStep = "profile" | "match" | "select" | "generate";

interface ProgressIndicatorProps {
  currentStep: WorkflowStep;
}

const steps = [
  { id: "profile", label: "Profile", order: 1 },
  { id: "match", label: "Match", order: 2 },
  { id: "select", label: "Select", order: 3 },
  { id: "generate", label: "Generate", order: 4 },
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentOrder = steps.find((s) => s.id === currentStep)?.order || 1;

  return (
    <nav aria-label="Progress" data-testid="progress-indicator">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = step.order < currentOrder;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.order > currentOrder;

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary bg-background text-primary"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                  data-testid={`step-${step.id}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" data-testid={`check-${step.id}`} />
                  ) : (
                    <span className="text-sm font-medium">{step.order}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    isCompleted ? "bg-primary" : "bg-border"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
