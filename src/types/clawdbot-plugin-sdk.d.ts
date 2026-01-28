declare module "clawdbot/plugin-sdk" {
  // The host Clawdbot package may not ship TypeScript types for plugin-sdk.
  // We keep this minimal for publishing build output.
  // If upstream adds types later, this can be removed.
  export const DEFAULT_ACCOUNT_ID: string;

  export type ChannelAccountSnapshot = Record<string, unknown>;
  export type ClawdbotConfig = Record<string, any>;

  export type RuntimeEnv = {
    config?: any;
    channel?: any;
    logging?: any;
    runtime?: any;
  };

  export type ChannelPlugin<TAccount = any> = any;

  export type ClawdbotPluginApi = {
    runtime: RuntimeEnv;
    registerChannel: (opts: any) => void;
  };

  export function emptyPluginConfigSchema(): any;
}
