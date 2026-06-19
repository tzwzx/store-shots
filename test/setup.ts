// Register happy-dom globally before tests run, so the DOM environment matches what consumers use.
// server.test.ts relies on this registered state and temporarily unregisters it in beforeAll to
// exercise the server with Bun's native fetch / Response.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
