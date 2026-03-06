import { Hono } from "hono";
import { getFile } from "../storage/r2";
import { Bindings } from "../types/bindings";

const fileContent = new Hono<{ Bindings: Bindings }>();

// for viewing the files 
fileContent.get("/:projectId/:path{.+}", async (c) => {

  const user = c.get("user");

  const projectId = c.req.param("projectId");

  const path = c.req.param("path");

  const key = `${user.id}/${projectId}/files/${path}`;
  
  const content = await getFile(c.env.PROMPT2APP_STORAGE, key);

  return c.json({
    path,
    content
  });

});

// for updating the files 
fileContent.put("/:projectId/*", async (c) => {

  const user = c.get("user");

  const projectId = c.req.param("projectId");

  const path = c.req.param("*");

  const { content } = await c.req.json();

  const key = `${user.id}/${projectId}/files/${path}`;

  await c.env.PROMPT2APP_STORAGE.put(key, content);

  return c.json({
    success: true
  });

});

// for deleting the files 
fileContent.delete("/:projectId/:path{.+}", async (c) => {

  const user = c.get("user");

  const projectId = c.req.param("projectId");

  const path = c.req.param("path");

  const key = `${user.id}/${projectId}/files/${path}`;

  await c.env.PROMPT2APP_STORAGE.delete(key);

  return c.json({
    success: true
  });

});

export default fileContent;