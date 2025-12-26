import { NextRequest, NextResponse } from "next/server";

// Types for the response
type DetectedCardVision = {
  id: string;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  cardType: "tree" | "dweller" | "unknown";
  cardName: string | null;
  position: "TOP" | "BOTTOM" | "LEFT" | "RIGHT" | null; // For dwellers
  attachedTo: string | null; // ID of tree this dweller is attached to
  confidence: number;
};

type VisionDetectionResult = {
  cards: DetectedCardVision[];
  relationships: Array<{
    treeId: string;
    dwellerId: string;
    slot: "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
  }>;
  rawAnalysis: string;
};

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, imageUrl } = await request.json();

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: "Either imageBase64 or imageUrl is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Prepare image content
    const imageContent = imageBase64
      ? {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: "image/jpeg" as const,
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
          },
        }
      : {
          type: "image" as const,
          source: {
            type: "url" as const,
            url: imageUrl,
          },
        };

    const prompt = `Analyze this image of a Forest Shuffle card game in progress.

Forest Shuffle is a card game where players build forests by playing tree cards and attaching dweller cards (animals, plants, insects) to the trees.

**Card Layout:**
- Tree cards are placed vertically in a row
- Dweller cards are tucked into slots around trees: TOP (above), BOTTOM (below), LEFT, or RIGHT
- Dwellers are partially hidden under the tree they're attached to

**Your Task:**
Identify all visible cards and their positions. For each card, estimate its CENTER position as a percentage of the image dimensions (0.0 to 1.0).

**Card Types to look for:**
- Trees: Oak (brown/orange border), Birch (white/light border), Sycamore (green border)
- Dwellers: Birds (top slot), Insects (bottom slot), Plants (left slot), Deer (right slot)

Respond with a JSON object in this exact format:
{
  "cards": [
    {
      "id": "card-1",
      "x": 0.25,
      "y": 0.5,
      "cardType": "tree",
      "cardName": "Oak",
      "position": null,
      "attachedTo": null,
      "confidence": 0.9
    },
    {
      "id": "card-2",
      "x": 0.25,
      "y": 0.3,
      "cardType": "dweller",
      "cardName": "Tawny Owl",
      "position": "TOP",
      "attachedTo": "card-1",
      "confidence": 0.8
    }
  ],
  "relationships": [
    {
      "treeId": "card-1",
      "dwellerId": "card-2",
      "slot": "TOP"
    }
  ],
  "summary": "Brief description of what you see"
}

Important:
- x=0 is left edge, x=1 is right edge
- y=0 is top edge, y=1 is bottom edge
- If you can't identify a card's name, use cardName: null
- Set confidence lower for partially visible or unclear cards
- Only include cards you can actually see, even if partially`;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              imageContent,
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Claude API error:", error);
      return NextResponse.json(
        { error: `Claude API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textContent = data.content?.find((c: { type: string }) => c.type === "text");
    const rawResponse = textContent?.text || "";

    // Parse JSON from response
    let result: VisionDetectionResult;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      const parsed = JSON.parse(jsonMatch[0]);
      result = {
        cards: parsed.cards || [],
        relationships: parsed.relationships || [],
        rawAnalysis: parsed.summary || rawResponse,
      };
    } catch {
      // If parsing fails, return the raw response for debugging
      result = {
        cards: [],
        relationships: [],
        rawAnalysis: rawResponse,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Vision detection error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Detection failed" },
      { status: 500 }
    );
  }
}
