import type { Bindings } from "./bindings";
import type { AuthUser } from "../services/auth";

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    user: AuthUser;
  };
};
