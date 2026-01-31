# Changelog

## 0.2.4
- Fix: allow inline model directives (e.g. `/model …`, `/chatgpt …`) to apply even when the message also contains normal prompt text.
- Fix: strip directive tokens from the prompt sent to the model (prevents wasting tokens / confusion).
- Rocket.Chat convenience: normalize `--model …`, `--chatgpt …`, and `-chatgpt …` forms.

## 0.2.0
- Multi-account support via `channels.rocketchat.accounts.<accountId>`.
- Select account at send-time via `accountId` (API/CLI) while keeping legacy single-account config compatible.

## 0.1.0
- Initial public release.
- Inbound: Rocket.Chat realtime (DDP) message subscription.
- Outbound: Rocket.Chat REST chat.postMessage.
- Reply routing: replyMode=auto + per-message overrides (!thread/!channel).
- Typing indicators via DDP stream-notify-room (<RID>/user-activity).
