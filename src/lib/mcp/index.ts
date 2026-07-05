import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchCourses from "./tools/search-courses";
import listMyAssignments from "./tools/list-my-assignments";
import askAiTutor from "./tools/ask-ai-tutor";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "eduzambia-mcp",
  title: "EduZambia MCP",
  version: "0.1.0",
  instructions:
    "Tools for EduZambia (Nexus Learning). Use `search_courses` to find ECZ-aligned courses, `list_my_assignments` to see the signed-in student's assignments, and `ask_ai_tutor` to get tutor answers for Zambian curriculum questions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchCourses, listMyAssignments, askAiTutor],
});
