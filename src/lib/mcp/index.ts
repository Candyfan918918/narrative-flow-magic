import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMySituations from "./tools/list-my-situations";
import createSituation from "./tools/create-situation";

// The OAuth issuer MUST be the direct Supabase host, never the .lovable.cloud
// proxy — mcp-js rejects a token whose issuer disagrees with the discovery
// document. The project ref is inlined at build time via Vite.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "shutap-mcp",
  title: "Shutap",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in Shutap user. Use `list_my_situations` to read their spills and `create_situation` to record a new one. Situations belong to one of four pillars: relationships, marriage, family, career.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMySituations, createSituation],
});
