# SquirrelBot

[Discord Server](https://discord.gg/SpVcZxyy6m) (not much here lol)

Work in progress advanced moderation and management bot - aiming to be lightweight and support the latest features of Discord! The idea is pretty similar to [Zeppelin](https://github.com/ZeppelinBot/Zeppelin) with each server having its own text based config. However, SquirrelBot splits each server's configurations into a file for each plugin to keep things more tidy and uses TOML instead of YAML. Slash commands will also (hopefully) be treated as first-class citizens - though it's likely not feasible to support everything.

The overall goal is to implement a set of plugins focused on moderation and utility - but keeping focused on Discord without getting carried away with third party integrations. Essentially, this bot *should not* and *will not* try to do everything.

## License

> SquirrelBot - Discord moderation and management bot
>
> Copyright (C) 2024-2025 TheKodeToad and SquirrelBot contributors
>
> This program is free software: you can redistribute it and/or modify
> it under the terms of the GNU Affero General Public License as published
> by the Free Software Foundation, either version 3 of the License, or
> (at your option) any later version.
>
> This program is distributed in the hope that it will be useful,
> but WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
> GNU Affero General Public License for more details.
>
> You should have received a copy of the GNU Affero General Public License
> along with this program.  If not, see <https://www.gnu.org/licenses/>.

## To-do
- [ ] Support for non-English languages
  - is this viable? maybe just for slash commands as localising prefix options would be a nightmare - but so would localising duration parsing
- [x] Log things properly instead of just using console
- 🚧 Unit testing
- 🚧 Moderation
  - [x] Ban
  - [x] Kick
  - [x] Timeout
  - [ ] Voice mute
  - [x] Warn
  - [x] Case recording
  - [ ] Case editing
  - [ ] Timed restriction presets (stop posting in certain channel etc.)
- 🚧 Logging
  - [x] Basic message logging
  - [ ] Log Discord bans/kicks/mutes
  - [ ] Log all Discord things
- 🚧 Utility
  - [x] Invite info
  - [ ] User info
  - [ ] Server info
  - [ ] Grant/revoke role
  - [ ] Set channel props without needing manage channel perm
  - [ ] Emoji helper
- ❌ Automator ("reflex"? to avoid being sued by Apple®) - automatic actions focused on moderation but could also be replying to keywords without taking action
- 🚧 Reminders
  - [x] Create reminder
  - [ ] List or delete reminders
  - [ ] Timezone setting - allow specifying reminder date in full or as time and/or weekday
- ❌ Tags - post preset message with a command
- ❌ Sticky and Static Messages ("billboard"?) - auto-reposted sticky notices in channels and static messages with support for selecting roles
- ❌ Persistent Nickname and Roles
- ❌ Starboard
- ❌ Welcome DM
- ❌ Command Rate Limit
