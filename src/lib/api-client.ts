import type {
  Game,
  Player,
  Event,
  StateResponse,
  CreateGameRequest,
  AddPlayerRequest,
  StartGameRequest,
  DrawCardRequest,
  PlayTreeRequest,
  PlayDwellerRequest,
  EndTurnRequest,
  CodeExecution,
} from "@/types/api";

export class ForestShuffleAPI {
  private baseUrl: string;
  private codeExecutions: CodeExecution[] = [];
  private listeners: ((executions: CodeExecution[]) => void)[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private logCodeExecution(
    action: string,
    code: string,
    request?: unknown,
    response?: unknown,
    error?: string,
  ) {
    const execution: CodeExecution = {
      timestamp: new Date(),
      action,
      code,
      request,
      response,
      error,
    };
    this.codeExecutions.push(execution);
    this.notifyListeners();
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener([...this.codeExecutions]);
    }
  }

  public onCodeExecutionUpdate(
    listener: (executions: CodeExecution[]) => void,
  ) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getCodeExecutions(): CodeExecution[] {
    return [...this.codeExecutions];
  }

  public clearCodeExecutions() {
    this.codeExecutions = [];
    this.notifyListeners();
  }

  private generateCode(
    method: string,
    endpoint: string,
    body?: unknown,
  ): string {
    const url = `${this.baseUrl}${endpoint}`;
    let code = `fetch('${url}'`;

    if (method !== "GET" || body) {
      code += ", {\n";
      code += `  method: '${method}',\n`;
      code += "  headers: { 'Content-Type': 'application/json' }";
      if (body) {
        code += `,\n  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, "\n  ")})`;
      }
      code += "\n}";
    }

    code += ")\n  .then(res => res.json())\n  .then(data => {\n";
    code += "    console.log(data);\n";
    code += "    return data;\n";
    code += "  })\n  .catch(error => {\n";
    code += "    console.error('Error:', error);\n";
    code += "    throw error;\n";
    code += "  });";

    return code;
  }

  async healthCheck(): Promise<{ status: string }> {
    const endpoint = "/health";
    const code = this.generateCode("GET", endpoint);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      const data = await response.json();
      this.logCodeExecution("Health Check", code, undefined, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "Health Check",
        code,
        undefined,
        undefined,
        String(error),
      );
      throw error;
    }
  }

  async createGame(request: CreateGameRequest): Promise<{ game: Game }> {
    const endpoint = "/games";
    const code = this.generateCode("POST", endpoint, request);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create game");
      }

      this.logCodeExecution("Create Game", code, request, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "Create Game",
        code,
        request,
        undefined,
        String(error),
      );
      throw error;
    }
  }

  async addPlayer(
    gameId: string,
    request: AddPlayerRequest,
  ): Promise<{ event: Event; player: Player }> {
    const endpoint = `/games/${gameId}/players`;
    const code = this.generateCode("POST", endpoint, request);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add player");
      }

      this.logCodeExecution("Add Player", code, request, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "Add Player",
        code,
        request,
        undefined,
        String(error),
      );
      throw error;
    }
  }

  async startGame(
    gameId: string,
    request: StartGameRequest,
  ): Promise<{
    message: string;
    starting_player: string;
    player_count: number;
    events_written: number;
  }> {
    const endpoint = `/games/${gameId}/start`;
    const code = this.generateCode("POST", endpoint, request);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start game");
      }

      this.logCodeExecution("Start Game", code, request, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "Start Game",
        code,
        request,
        undefined,
        String(error),
      );
      throw error;
    }
  }

  async drawCards(
    gameId: string,
    request: DrawCardRequest,
  ): Promise<{
    cards_drawn: string[];
    winter_cards_revealed: number;
    events_written: number;
  }> {
    const endpoint = `/games/${gameId}/actions/draw`;
    const code = this.generateCode("POST", endpoint, request);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to draw cards");
      }

      this.logCodeExecution("Draw Cards", code, request, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "Draw Cards",
        code,
        request,
        undefined,
        String(error),
      );
      throw error;
    }
  }

  async playTree(
    gameId: string,
    request: PlayTreeRequest,
  ): Promise<{
    message: string;
    tree_name: string;
    tree_index: number;
    bonus_card_added_to_clearing: string;
    events_written: number;
  }> {
    const endpoint = `/games/${gameId}/actions/play-tree`;
    const code = this.generateCode("POST", endpoint, request);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to play tree");
      }

      this.logCodeExecution("Play Tree", code, request, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "Play Tree",
        code,
        request,
        undefined,
        String(error),
      );
      throw error;
    }
  }

  async playDweller(
    gameId: string,
    request: PlayDwellerRequest,
  ): Promise<{
    message: string;
    dweller_name: string;
    attached_to_tree: string;
    tree_index: number;
    position: string;
    events_written: number;
  }> {
    const endpoint = `/games/${gameId}/actions/play-dweller`;
    const code = this.generateCode("POST", endpoint, request);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to play dweller");
      }

      this.logCodeExecution("Play Dweller", code, request, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "Play Dweller",
        code,
        request,
        undefined,
        String(error),
      );
      throw error;
    }
  }

  async endTurn(
    gameId: string,
    request: EndTurnRequest,
  ): Promise<{
    message: string;
    next_player: string;
    clearing_emptied: boolean;
    game_ended: boolean;
    events_written: number;
  }> {
    const endpoint = `/games/${gameId}/actions/end-turn`;
    const code = this.generateCode("POST", endpoint, request);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to end turn");
      }

      this.logCodeExecution("End Turn", code, request, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "End Turn",
        code,
        request,
        undefined,
        String(error),
      );
      throw error;
    }
  }

  async getGameState(gameId: string): Promise<StateResponse> {
    const endpoint = `/games/${gameId}/state`;
    const code = this.generateCode("GET", endpoint);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get game state");
      }

      this.logCodeExecution("Get Game State", code, undefined, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "Get Game State",
        code,
        undefined,
        undefined,
        String(error),
      );
      throw error;
    }
  }


async getGameStateSilent(gameId: string): Promise<StateResponse> {
  const endpoint = `/games/${gameId}/state`;
  
  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get game state");
    }

    // Note: No logCodeExecution call - this is silent
    return data;
  } catch (error) {
    // Still throw the error, just don't log it
    throw error;
  }
}

  async getEvents(
    gameId: string,
    from = 0,
    limit = 100,
  ): Promise<{
    events: Event[];
    from: number;
    returned: number;
    has_more: boolean;
  }> {
    const endpoint = `/games/${gameId}/events?from=${from}&limit=${limit}`;
    const code = this.generateCode("GET", endpoint);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get events");
      }

      this.logCodeExecution("Get Events", code, undefined, data);
      return data;
    } catch (error) {
      this.logCodeExecution(
        "Get Events",
        code,
        undefined,
        undefined,
        String(error),
      );
      throw error;
    }
  }
}
