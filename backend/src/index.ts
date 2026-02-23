export class MyDurableObject {
  constructor(
    private state: DurableObjectState,
    private env: any
  ) {}

  async fetch(request: Request): Promise<Response> {
    console.log("🔥 Durable Object called");
    return new Response("Hello from Durable Object!");
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    console.log("⚡ Worker fetch called");

    const id = env.MY_DURABLE_OBJECT.idFromName("test-id");
    const obj = env.MY_DURABLE_OBJECT.get(id);
    return obj.fetch(request);
  },
};