# Clawdbot Rocket.Chat Channel Plugin

Neutral, self-host friendly Rocket.Chat channel plugin for **Clawdbot**.

## Authors

- Chad (AI assistant running in Clawdbot) — primary implementer
- Marshal Morse — project owner, requirements, infrastructure, and testing

- **Inbound**: Rocket.Chat Realtime (DDP/WebSocket) `stream-room-messages`
- **Outbound**: Rocket.Chat REST `chat.postMessage`

This repository is intended to be publishable (no secrets committed).

## Install

### Install from npm

```bash
npm install @cloudrise/clawdbot-channel-rocketchat
```

### Configure Clawdbot to load the plugin

You need to tell Clawdbot to load the installed plugin.

**Option A (recommended): install via plugins.installs (npm source)**

Add something like this to your Clawdbot config:

```yaml
plugins:
  installs:
    rocketchat:
      source: npm
      spec: "@cloudrise/clawdbot-channel-rocketchat"
  entries:
    rocketchat:
      enabled: true
```

**Option B: load from a local path**

If you prefer to manage install paths manually:

```yaml
plugins:
  load:
    paths:
      - /absolute/path/to/node_modules/@cloudrise/clawdbot-channel-rocketchat
  entries:
    rocketchat:
      enabled: true
```

Then restart the gateway.

## Configuration

> Use the room **rid** (e.g. `GENERAL`) for per-room settings.

### Minimal (single account)

```yaml
channels:
  rocketchat:
    baseUrl: "https://chat.example.com"
    userId: "<ROCKETCHAT_USER_ID>"
    authToken: "<ROCKETCHAT_AUTH_TOKEN>"
```

### Multiple accounts / multiple Rocket.Chat servers

You can configure multiple Rocket.Chat “accounts” under `channels.rocketchat.accounts` and choose which one to use via `accountId` when sending.

```yaml
channels:
  rocketchat:
    accounts:
      prod:
        name: "Prod RC"
        baseUrl: "https://chat.example.com"
        userId: "<PROD_USER_ID>"
        authToken: "<PROD_AUTH_TOKEN>"

      staging:
        name: "Staging RC"
        baseUrl: "https://chat-staging.example.com"
        userId: "<STAGING_USER_ID>"
        authToken: "<STAGING_AUTH_TOKEN>"
```

Notes:
- The legacy single-account format (top-level `baseUrl/userId/authToken`) still works and is treated as `accountId: default`.
- Per-room settings live under each account (e.g. `channels.rocketchat.accounts.prod.rooms`).

### Reply routing (thread vs channel)

```yaml
channels:
  rocketchat:
    # thread | channel | auto
    replyMode: auto

    rooms:
      GENERAL:
        requireMention: false
        # Optional per-room override
        # replyMode: channel
```

**Auto rules** (deterministic):
- If the inbound message is already in a thread (`tmid` exists) → reply in that thread
- Else if the inbound message is “long” (≥280 chars or contains a newline) → reply in a thread
- Else → reply in channel

### Per-message overrides

Prefix your message:
- `!thread ...` → force the reply to be posted as a thread reply
- `!channel ...` → force the reply to be posted in the channel

(The prefix is stripped before the message is sent to the agent.)

### Typing indicator

```yaml
channels:
  rocketchat:
    # Delay (ms) before emitting typing indicator
    typingDelayMs: 500
```

(When using multiple accounts, this can also be set per account at `channels.rocketchat.accounts.<accountId>.typingDelayMs`.)

Typing indicators are emitted via DDP `stream-notify-room` using `<RID>/user-activity`.
- Channel replies emit typing without `tmid` → shows under channel composer
- Thread replies include `{ tmid: ... }` → shows under thread composer

## Security

Treat Rocket.Chat `authToken` like a password.

## License

MIT
