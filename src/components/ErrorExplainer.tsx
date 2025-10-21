"use client";

import { AlertCircle, Lightbulb, Wrench } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorExplanation {
  plainEnglish: string;
  technicalReason: string;
  howToFix: string[];
  learnMore?: string;
}

interface ErrorExplainerProps {
  error: Error;
  context?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

// Map common API errors to beginner-friendly explanations
function explainError(error: Error): ErrorExplanation {
  const message = error.message.toLowerCase();

  // Game not found
  if (message.includes('game not found') || message.includes('404')) {
    return {
      plainEnglish: 'The game you\'re trying to access doesn\'t exist.',
      technicalReason: 'The API returned a 404 Not Found error, which means the game_id you provided doesn\'t match any game in the database.',
      howToFix: [
        'Check that you created a game first',
        'Verify the game_id is correct (check for typos)',
        'Make sure you\'re using the most recent game_id from your "Create Game" response'
      ],
      learnMore: '404 errors are HTTP status codes that mean "resource not found". They\'re the API\'s way of saying "I looked, but I don\'t have that."'
    };
  }

  // Player not found
  if (message.includes('player not found')) {
    return {
      plainEnglish: 'You\'re trying to perform an action as a player who hasn\'t joined the game.',
      technicalReason: 'The player_id in your request doesn\'t match any player who has been added to this game.',
      howToFix: [
        'Check which players have been added to the game',
        'Make sure the player_id is spelled correctly (case-sensitive!)',
        'Add the player to the game first using the "Add Player" endpoint'
      ],
      learnMore: 'In REST APIs, you often need to create resources (like players) before you can use them in other operations.'
    };
  }

  // Not player's turn
  if (message.includes('not your turn') || message.includes('not the current player')) {
    return {
      plainEnglish: 'It\'s not this player\'s turn right now.',
      technicalReason: 'Forest Shuffle is turn-based. The game state tracks whose turn it is, and the API rejects actions from other players.',
      howToFix: [
        'Check the game state to see whose turn it is (current_player_id field)',
        'Make sure the "actor" field matches the current player',
        'Wait for the current player to end their turn first'
      ],
      learnMore: 'APIs enforce business rules. Here, the API prevents out-of-turn actions to maintain game integrity.'
    };
  }

  // Invalid action
  if (message.includes('invalid action') || message.includes('cannot perform')) {
    return {
      plainEnglish: 'This action isn\'t allowed in the current game state.',
      technicalReason: 'The game has rules about what actions are valid at what times. This action violated one of those rules.',
      howToFix: [
        'Check the current game phase (setup vs playing)',
        'Verify you\'ve completed required previous steps',
        'Review the game rules for when this action is allowed'
      ],
      learnMore: 'State machines: APIs often have rules about valid state transitions. Not all actions are valid at all times.'
    };
  }

  // Missing required field
  if (message.includes('required') || message.includes('missing')) {
    return {
      plainEnglish: 'Your request is missing a required piece of information.',
      technicalReason: 'The API endpoint requires certain fields in the request body, and one or more are missing.',
      howToFix: [
        'Check the API documentation for required fields',
        'Make sure your request body includes all required fields',
        'Verify field names are spelled exactly as expected (case-sensitive)'
      ],
      learnMore: 'Request validation: APIs check incoming requests to ensure they have all necessary data before processing.'
    };
  }

  // Network error
  if (message.includes('fetch') || message.includes('network')) {
    return {
      plainEnglish: 'Unable to connect to the API server.',
      technicalReason: 'The browser couldn\'t establish a connection to the API endpoint. The server might be down, or the URL might be wrong.',
      howToFix: [
        'Check that the backend API server is running',
        'Verify the API URL is correct (check protocol, host, and port)',
        'Look for CORS errors in the browser console'
      ],
      learnMore: 'Network errors happen before your request even reaches the server. They\'re client-side connection issues.'
    };
  }

  // Invalid card
  if (message.includes('card') && (message.includes('invalid') || message.includes('not found'))) {
    return {
      plainEnglish: 'The card you\'re trying to use doesn\'t exist or isn\'t in your hand.',
      technicalReason: 'The card_id you provided either doesn\'t exist in the game, or the player doesn\'t have access to it.',
      howToFix: [
        'Check the game state to see what cards are in the player\'s hand',
        'Copy the card_id exactly as it appears (including dashes and numbers)',
        'Make sure you\'re using a card that belongs to the current player'
      ],
      learnMore: 'Resource validation: APIs verify that the resources you reference actually exist and you have permission to use them.'
    };
  }

  // Generic fallback
  return {
    plainEnglish: 'Something went wrong with your API request.',
    technicalReason: 'The API returned an error, but it doesn\'t match any common patterns. Check the raw error message below for details.',
    howToFix: [
      'Read the raw error message carefully',
      'Check that all your request parameters are correct',
      'Try the action again - it might be a temporary issue',
      'If the error persists, this might be a bug in the API'
    ],
    learnMore: 'When debugging API issues, the raw error message often contains valuable clues about what went wrong.'
  };
}

export function ErrorExplainer({
  error,
  context,
  onRetry,
  onGoBack,
}: ErrorExplainerProps) {
  const explanation = explainError(error);

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
          <div>
            <CardTitle className="text-red-900">
              The API Returned an Error
            </CardTitle>
            {context && (
              <CardDescription className="text-red-700 mt-1">
                While {context}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Raw Error */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Raw Error Message:
          </p>
          <Alert variant="destructive">
            <AlertDescription className="font-mono text-sm">
              {error.message}
            </AlertDescription>
          </Alert>
        </div>

        {/* Plain English Explanation */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-semibold text-gray-700">
              What This Means:
            </p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {explanation.plainEnglish}
          </p>
          <p className="text-xs text-gray-500 mt-2 italic">
            {explanation.technicalReason}
          </p>
        </div>

        {/* How to Fix */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-semibold text-gray-700">
              How to Fix:
            </p>
          </div>
          <ul className="space-y-1">
            {explanation.howToFix.map((fix, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2">•</span>
                <span>{fix}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Learn More */}
        {explanation.learnMore && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle className="text-blue-900 text-sm">
              💡 Learning Moment
            </AlertTitle>
            <AlertDescription className="text-blue-700 text-sm">
              {explanation.learnMore}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default" size="sm">
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline" size="sm">
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}