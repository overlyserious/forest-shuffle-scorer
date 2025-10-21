"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  onStepClick?: (stepNumber: number) => void;
}

export function ProgressTracker({
  currentStep,
  totalSteps,
  completedSteps,
  onStepClick,
}: ProgressTrackerProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="w-full py-4 px-6 bg-white border-b">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(`step-${step}`);
          const isCurrent = step === currentStep;
          const isClickable = step <= currentStep;

          return (
            <div key={step} className="flex items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick?.(step)}
                disabled={!isClickable}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                  isCurrent && "ring-4 ring-blue-200 bg-blue-600 text-white scale-110",
                  isCompleted && !isCurrent && "bg-green-600 text-white hover:bg-green-700",
                  !isCompleted && !isCurrent && "bg-gray-200 text-gray-500",
                  isClickable && !isCurrent && "cursor-pointer",
                  !isClickable && "cursor-not-allowed opacity-50"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm">{step}</span>
                )}
              </button>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2">
                  <div
                    className={cn(
                      "h-full transition-all",
                      isCompleted ? "bg-green-600" : "bg-gray-200"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step Label */}
      <div className="text-center mt-3">
        <p className="text-sm font-medium text-gray-700">
          Step {currentStep} of {totalSteps}
        </p>
        <div className="mt-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden max-w-md mx-auto">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}