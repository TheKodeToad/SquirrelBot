import { type BackendContext } from "#backend.ts";

// currently this just aliases context
// this alias exists to be able to add more stuff later
export interface BackendHTTPContext extends BackendContext {}
