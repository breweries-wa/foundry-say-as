# Say As

A Foundry VTT module that does one thing: **change who a chat message was said by**, from the message's kebab menu.

You typed as the wrong character. Someone points it out. Select the right token, right-click the message, and pick **Say As Selected Token**. Done.

Foundry v13+ (verified on v14). System agnostic. No dependencies.

## Usage

Right-clicking a chat message you sent adds up to two options:

- **Say As Selected Token** — reattributes the message to your currently selected token, or to your assigned character if no token is selected. Shown whenever something is selected to attribute to.
- **Say Out Of Character** — reattributes the message to you, out of character. Shown only when the message is currently attributed to a character.

**Roll messages work.** `/roll 1d20 # search check` sent as the wrong character can be corrected like any other message.

## What it does not do

Nothing else. It does not edit message text, add markdown, show typing indicators, or change portraits. If you want those, use [Scorpious187's Chat Edit](https://github.com/nscarpinatodev/scorpious187s-chatedit), which this was carved out of.

## Notes and limitations

- **You can only reassign messages you sent.** Foundry exposes this as `message.isAuthor`; a GM cannot correct another player's message through this menu.
- **The speaker comes from your selected token**, so the target must be on the scene you are viewing.
- **Whispers are excluded**, since changing a whisper's speaker does not change who can see it and the result would be misleading.
- **System chat cards are excluded.** Messages carrying flags for the active system (item cards, action cards) can re-derive their actor from those flags, so reassigning the speaker alone would leave the two disagreeing.
- **Message style is preserved on rolls.** For ordinary messages the module keeps the original emote/IC/OOC behaviour, but a roll's content is generated dice HTML, so its style is left untouched.
- If [Polyglot](https://foundryvtt.com/packages/polyglot) is active, the message's language follows the new speaker. If PF2e Dorako UI is active, its cached avatar follows too.

## Why this exists

Upstream blocks every context-menu action on roll messages, because editing a roll's `content` would desync it from its `rolls` array. That guard is right for content editing but was also blocking speaker reassignment, which only ever writes `speaker` and `style`. Upstream also only offered "Make In Character" on messages that were already out of character, so correcting a wrong-character message meant a round trip through OOC.

This module keeps only the reassignment path, drops both restrictions, and renames the action to something that makes sense when you are switching between two characters rather than toggling in and out of character.

## Credit

This is a fork of [Scorpious187's Chat Edit](https://github.com/nscarpinatodev/scorpious187s-chatedit), itself a fork of [alakshana's Chat Edit](https://github.com/etiquettestartshere/chatedit) by way of [rydoq's Chat Edit Anduril](https://github.com/rydoq/chatedit-new). The speaker reassignment logic, the Polyglot and Dorako UI integrations, and the build setup are all their work. Original thanks from alakshana carried forward: to DF Chat Enhancements and flamewave000, to Karakara's Chat Enhancements and Julia, and to Zhell, Flix, mxzf, esheyw, ChaosOS, Ethaks, and Mana.

MIT licensed, as upstream.
