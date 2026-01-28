# Changelog

## 0.1.0
- Initial public release.
- Inbound: Rocket.Chat realtime (DDP) message subscription.
- Outbound: Rocket.Chat REST chat.postMessage.
- Reply routing: replyMode=auto + per-message overrides (!thread/!channel).
- Typing indicators via DDP stream-notify-room (<RID>/user-activity).
