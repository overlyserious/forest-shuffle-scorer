"use client";

import { useState, useEffect } from "react";
import { BookOpen, Code2, CheckCircle, ArrowRight, ArrowLeft, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FieldExplainer } from "./FieldExplainer";
import { ErrorExplainer } from "./ErrorExplainer";
import type { TutorialStepConfig } from "@/lib/tutorial-flow";
import type { ForestShuffleAPI } from "@/lib/api-client";

interface TutorialStepProps {
  step: TutorialStepConfig;
  api: ForestShuffleAPI;
  gameId: string | null;
  currentPlayer: string | null;
  onComplete: (stepId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep: boolean;
}

export function TutorialStep({
  step,
  api,
  gameId,
  currentPlayer,
  onComplete,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  isLastStep,
}: TutorialStepProps) {
  const [formValues, setFormValues] = useState<Record<string, string | number>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<Error | null>(null);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [previewCode, setPreviewCode] = useState<string>("");
  const [resultData, setResultData] = useState<any>(null);

  // Initialize form values with defaults
  useEffect(() => {
    const initialValues: Record<string, string | number> = {};
    step.fields.forEach((field) => {
      // Generate fresh timestamps for client_id fields
      if (field.name === 'client_id') {
        initialValues[field.name] = `${step.action}-${Date.now()}`;
      } else if (field.name === 'actor' && currentPlayer) {
        initialValues[field.name] = currentPlayer;
      } else {
        initialValues[field.name] = field.defaultValue;
      }
    });
    setFormValues(initialValues);
    setExecutionSuccess(false);
    setExecutionError(null);
    generatePreviewCode(initialValues);
  }, [step, currentPlayer]);

  // Generate preview code whenever form values change
  useEffect(() => {
    generatePreviewCode(formValues);
  }, [formValues]);

  const handleFieldChange = (fieldName: string, value: string | number) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    
    // Clear field error when user changes value
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const generatePreviewCode = (values: Record<string, string | number>) => {
    let endpoint = '';
    let method = '';
    let body: any = null;

    switch (step.action) {
      case 'create-game':
        endpoint = '/games';
        method = 'POST';
        body = {
          name: values.name,
          owner_id: values.owner_id,
          max_players: Number(values.max_players),
          client_id: values.client_id,
        };
        break;

      case 'add-player':
        endpoint = `/games/${gameId}/players`;
        method = 'POST';
        body = {
          player_client_id: values.player_client_id,
          display_name: values.display_name,
          client_id: values.client_id,
        };
        break;

      case 'start-game':
        endpoint = `/games/${gameId}/start`;
        method = 'POST';
        body = {
          client_id: values.client_id,
        };
        break;

      case 'get-state':
        endpoint = `/games/${gameId}/state`;
        method = 'GET';
        break;

      case 'draw-cards':
        endpoint = `/games/${gameId}/actions/draw`;
        method = 'POST';
        body = {
          actor: values.actor,
          sources: [values.source_1, values.source_2],
          client_id: values.client_id,
        };
        break;

      case 'end-turn':
        endpoint = `/games/${gameId}/actions/end-turn`;
        method = 'POST';
        body = {
          actor: values.actor,
          client_id: values.client_id,
        };
        break;
    }

    const code = generateFetchCode(endpoint, method, body);
    setPreviewCode(code);
  };

  const generateFetchCode = (endpoint: string, method: string, body: any) => {
    const apiUrl = api.baseUrl;
    const fullUrl = `${apiUrl}${endpoint}`;

    if (method === 'GET') {
      return `// Making a GET request to retrieve data
const response = await fetch("${fullUrl}", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
});

const data = await response.json();
console.log(data);`;
    }

    return `// Making a ${method} request with data
const response = await fetch("${fullUrl}", {
  method: "${method}",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${JSON.stringify(body, null, 2)}),
});

const data = await response.json();
console.log(data);`;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    step.fields.forEach((field) => {
      if (field.validation) {
        const error = field.validation(formValues[field.name]);
        if (error) {
          errors[field.name] = error;
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const executeAction = async () => {
    if (!validateForm()) {
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionSuccess(false);
    setResultData(null);

    try {
      let result: any;

      switch (step.action) {
        case 'create-game':
          result = await api.createGame({
            name: String(formValues.name),
            owner_id: String(formValues.owner_id),
            max_players: Number(formValues.max_players),
            client_id: String(formValues.client_id),
          });
          break;

        case 'add-player':
          if (!gameId) throw new Error('No game ID available');
          result = await api.addPlayer(gameId, {
            player_client_id: String(formValues.player_client_id),
            display_name: String(formValues.display_name),
            client_id: String(formValues.client_id),
          });
          break;

        case 'start-game':
          if (!gameId) throw new Error('No game ID available');
          result = await api.startGame(gameId, {
            client_id: String(formValues.client_id),
          });
          break;

        case 'get-state':
          if (!gameId) throw new Error('No game ID available');
          result = await api.getGameState(gameId);
          break;

        case 'draw-cards':
          if (!gameId) throw new Error('No game ID available');
          result = await api.drawCards(gameId, {
            actor: String(formValues.actor),
            sources: [String(formValues.source_1), String(formValues.source_2)] as ("DECK" | "CLEARING")[],
            client_id: String(formValues.client_id),
          });
          break;

        case 'end-turn':
          if (!gameId) throw new Error('No game ID available');
          result = await api.endTurn(gameId, {
            actor: String(formValues.actor),
            client_id: String(formValues.client_id),
          });
          break;
      }

      setResultData(result);
      setExecutionSuccess(true);
      onComplete(step.id);
    } catch (error) {
      setExecutionError(error as Error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Step Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">{step.title}</h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          {step.explanation}
        </p>
      </div>

      {/* Learning Points */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-blue-900">What You'll Learn</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                API Concepts:
              </h4>
              <ul className="space-y-1">
                {step.apiConcepts.map((concept, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                Key Learnings:
              </h4>
              <ul className="space-y-1">
                {step.learningPoints.map((point, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configure Request</CardTitle>
            <CardDescription>
              Fill in the values for this API call
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step.fields.map((field) => (
              <FieldExplainer
                key={field.name}
                field={field}
                value={formValues[field.name] || field.defaultValue}
                onChange={(value) => handleFieldChange(field.name, value)}
                error={fieldErrors[field.name]}
              />
            ))}

            <Separator className="my-4" />

            <Button
              onClick={executeAction}
              disabled={isExecuting || executionSuccess}
              className="w-full"
              size="lg"
            >
              {isExecuting ? (
                <>
                  <PlayCircle className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : executionSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed!
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Execute API Call
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Code Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  <CardTitle>Preview: Request Code</CardTitle>
                </div>
                <Badge variant="outline">Before Execution</Badge>
              </div>
              <CardDescription>
                This is the JavaScript code that will be executed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {previewCode}
              </pre>
            </CardContent>
          </Card>

          {/* Result/Error Display */}
          {executionSuccess && resultData && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-green-900">Success!</CardTitle>
                </div>
                <Badge variant="outline" className="w-fit">After Execution</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-green-100 border-green-300">
                  <AlertTitle className="text-green-900">
                    {step.successMessage}
                  </AlertTitle>
                  <AlertDescription className="text-green-700">
                    {step.nextStepHint}
                  </AlertDescription>
                </Alert>

                <div>
                  <h4 className="text-sm font-semibold text-green-900 mb-2">
                    API Response:
                  </h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-64 overflow-y-auto">
                    {JSON.stringify(resultData, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {executionError && (
            <ErrorExplainer
              error={executionError}
              context={`trying to ${step.title.toLowerCase()}`}
              onRetry={() => {
                setExecutionError(null);
                setExecutionSuccess(false);
              }}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous Step
        </Button>

        <Button
          onClick={onNext}
          disabled={!canGoNext || !executionSuccess}
          size="lg"
        >
          {isLastStep ? 'Complete Tutorial' : 'Next Step'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}