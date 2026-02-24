import type { Bindings } from "../types/bindings";

export class MyDurableObject {
  constructor(
    private state: DurableObjectState,
    private env: Bindings
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/message") {
      const body = (await request.json()) as { message: string };

      const messages =
        (await this.state.storage.get<any[]>("messages")) || [];

      messages.push(body);

      await this.state.storage.put("messages", messages);

      return new Response(JSON.stringify({ messages }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Session active");
  }
}