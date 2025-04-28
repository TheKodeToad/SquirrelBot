# SquirrelBot

[Discord Server](https://discord.gg/SpVcZxyy6m) (not much here lol)

Work in progress advanced moderation and management bot - aiming to be lightweight and support the latest features of Discord! The idea is pretty similar to [Zeppelin](https://github.com/ZeppelinBot/Zeppelin) with each server having its own text based config. However, SquirrelBot splits each server's configurations into a file for each plugin to keep things more tidy and uses TOML instead of YAML. Slash commands will also (hopefully) be treated as first-class citizens - though it's likely not feasible to support everything.

The overall goal is to implement a set of plugins focused on moderation and utility - but keeping focused on Discord without getting carried away with third party integrations. Essentially, this bot *should not* and *will not* try to do everything.

## To-do
- [ ] Support for non-English languages
- [x] Log things properly instead of just using console
- ❌ Unit testing
- 🚧 Moderation
  - [x] Ban
  - [x] Kick
  - [x] Mute (probably should be changed just to timeout and role functionality moved to `?restrict` command)
  - [ ] Voice Mute
  - [ ] Warn
  - [x] Case recording
  - [ ] Case editing
  - [ ] Restrictions (stop posting in certain channel etc.)
- 🚧 Logging
- 🚧 Utility - invite info, user info, server info, grant role, set channel props without needing manage channel perm, emoji helper
- ❌ Automator - automatic actions focused on moderation but could also be replying to keywords without taking action
- 🚧 Reminders
  - [x] Create reminder
  - [ ] List or delete reminders
  - [ ] Timezone setting - allow specifying reminder date in full or as time and/or weekday
- ❌ Tags - post preset message with a command
- ❌ Sticky and Static Messages - auto-reposted sticky notices in channels and static messages with support for selecting roles
- ❌ Persistent Nickname and Roles
- ❌ Starboard
- ❌ Welcome DM
- ❌ Command Rate Limit
- 
