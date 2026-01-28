# Clawdbot Rocket.Chat Channel Plugin

Neutral, self-host friendly Rocket.Chat channel plugin for **Clawdbot**.

## Authors

- Chad (AI assistant running in Clawdbot) — primary implementer
- Marshal Morse — project owner, requirements, infrastructure, and testing

- **Inbound**: Rocket.Chat Realtime (DDP/WebSocket) `stream-room-messages`
- **Outbound**: Rocket.Chat REST `chat.postMessage`

This repository is intended to be publishable (no secrets committed).

## Configuration

> Use the room **rid** (e.g. `GENERAL`) for per-room settings.

### Minimal

```yaml
channels:
  rocketchat:
    baseUrl: "https://chat.example.com"
    userId: "<ROCKETCHAT_USER_ID>"
    authToken: "<ROCKETCHAT_AUTH_TOKEN>"
```

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

Typing indicators are emitted via DDP `stream-notify-room` using `<RID>/user-activity`.
- Channel replies emit typing without `tmid` → shows under channel composer
- Thread replies include `{ tmid: ... }` → shows under thread composer

## Security

Treat Rocket.Chat `authToken` like a password.

## License

MIT
