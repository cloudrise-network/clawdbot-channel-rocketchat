/**
 * Rocket.Chat channel plugin for Clawdbot
 * 
 * Provides integration with self-hosted Rocket.Chat instances via REST API
 * for sending messages and the Realtime/DDP API for receiving messages.
 */

import type { ClawdbotPluginApi } from "clawdbot/plugin-sdk";
import { emptyPluginConfigSchema } from "clawdbot/plugin-sdk";

import { rocketChatPlugin } from "./src/channel.js";
import { setRocketChatRuntime } from "./src/runtime.js";

// Re-export send/react functions for the message tool (and programmatic use)
export { reactMessageRocketChat, sendMessageRocketChat } from "./src/rocketchat/send.js";

const plugin = {
  id: "rocketchat",
  name: "Rocket.Chat",
  description: "Rocket.Chat channel plugin for Clawdbot",
  configSchema: emptyPluginConfigSchema(),
  register(api: ClawdbotPluginApi) {
    setRocketChatRuntime(api.runtime);
    api.registerChannel({ plugin: rocketChatPlugin });
  },
};

export default plugin;
