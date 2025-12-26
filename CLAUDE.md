# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server with Turbopack (binds to 0.0.0.0:3000)
npm run build        # Production build
npm run lint         # Run Biome linter + TypeScript type check
npm run format       # Format code with Biome
```

## Project Overview

This is a Next.js 15 frontend for the Forest Shuffle board game. It has two main features:

1. **API Simulator** (`/`) - An educational tool that teaches users how to interact with a Forest Shuffle backend API. Shows a split-screen with UI controls on the left and live-generated fetch code on the right. Includes a guided tutorial mode that walks through game creation, adding players, starting games, drawing cards, and ending turns.

2. **Image Scorer** (`/image-scorer`) - Upload a photo of a finished game, calibrate card size, place markers on cards, label them, and reconstruct the forest structure to calculate scores.

## Architecture

- **API Client** (`src/lib/api-client.ts`): `ForestShuffleAPI` class wraps all backend calls. Key feature: logs every API call as executable JavaScript code for the educational display. Backend expected at `http://localhost:8080`.

- **Tutorial System** (`src/lib/tutorial-flow.ts`): Defines `TUTORIAL_STEPS` array - each step has fields config, validation, API action type, and educational content. Steps: create-game → add-player → start-game → get-state → draw-cards → end-turn.

- **Card Types** (`src/types/cards.ts`): MVP card set with 3 tree species (Oak, Birch, Sycamore) and 4 dweller types (Bird, Insect, Plant, Deer). Cards have positions (Top, Bottom, Left, Right) and scoring rules (Fixed, PerTree, PerSymbol).

- **Spatial Inference** (`src/lib/spatial-inference.ts`): Algorithms for the image scorer to reconstruct forest structure from card positions.

## Tech Stack

- Next.js 15 with App Router
- TypeScript with strict mode
- Tailwind CSS + shadcn/ui components (in `src/components/ui/`)
- Biome for linting/formatting (double quotes, space indentation)
- Radix UI primitives
