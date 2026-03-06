import { Hono } from "hono";
import { listFiles } from "../storage/r2";
import { Bindings } from "../types/bindings";

const projectTree = new Hono<{ Bindings: Bindings }>();

projectTree.get("/:projectId/tree", async (c) => {

  const user = c.get("user");
  const projectId = c.req.param("projectId");

  const bucket = c.env.PROMPT2APP_STORAGE;

  const prefix = `${user.id}/${projectId}/files/`;

  const files = await listFiles(bucket, prefix);

  const paths = files.map((key) => key.replace(prefix, ""));

  return c.json({
    projectId,
    files: paths
  });

});

export default projectTree;