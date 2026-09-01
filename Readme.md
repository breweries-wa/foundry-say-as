# Breweries' Chat Edit
A module for editing and styling chat messages. It is a lightweight chat editor, with no module dependencies and no external libraries. It is *not* a 'chat enhancement' module (though it might be mistaken for one). Its intent is to bring the Foundry chat message experience to the bare minimum of acceptability for text roleplay.

> **This is a fork** of [Scorpious187's Chat Edit](https://github.com/nscarpinatodev/scorpious187s-chatedit), which is itself a fork of [alakshana's Chat Edit](https://github.com/etiquettestartshere/chatedit) by way of [rydoq's Chat Edit Anduril](https://github.com/rydoq/chatedit-new). Nearly all of the work here belongs to them; see Additional Info below.
>
> **What this fork changes:**
> - **Speaker reassignment works on roll messages.** Upstream blocks *all* context-menu actions on rolls because editing a roll's `content` would desync it from its `rolls` array. But "Make In/Out of Character" only ever writes `speaker` and `style`, never `content`, so that restriction does not apply to them. Content editing is still blocked on rolls, as it should be.
> - **"Make In Character" is offered on messages that are already in character.** Upstream only showed it on OOC messages, so correcting a message sent as the *wrong* character required a round-trip through OOC. Now it is a single action: select the right token, right-click, Make In Character.
> - **A roll's `style` is left untouched during reassignment.** The emote heuristic compares message content against the speaker's name, which is meaningless for generated dice HTML and would restyle the roll card.
> - **Dropped the `scorpious187s-lib` dependency.** No source file in this module references it; it was added upstream to register the module with the author's cross-module update notifier. Removing it makes this a single-manifest install.

## Features
<p style="text-align: center"><img src="https://i.imgur.com/p2E8Jtg.png" style="border: none" alt="An image showing message editing in Foundry and markdown support"></p>

Allows the editing of chat messages that *you* created (GMs cannot edit messages from other users); change the speaker (potential speakers include only owned tokens on the currently viewed scene), alias, and style, and process chat messages with Foundry's built-in markdown processor (Showdown) for *emphasis*, **bold**, and ~~more~~.

If <a href= "https://foundryvtt.com/packages/polyglot">Polyglot</a> is enabled, allows the user to change the language the token is speaking. The default language shows at the top of the list if the token speaks it. If the user is a GM and are speaking out of character, they may select from any language. And if the token speaks no languages, the user may select from any language. It sounds complicated, but it should work just the same as Polyglot.

## Settings
- Allow Editing (on by default). *World setting*.
- Show Edited Messages: show message, show icon, do not show (shows icon by default). *World setting*. - The show message option has a visual bug where as the timestamp changes, the game adds or removes a whitespace. I recommend using the icon.
- Markdown Styling (on by default). *Client setting*.

## Foundry Compatibility
Supports Foundry v13 and v14 (minimum v13, verified on v14). If you want a version that supports v11 or v12 of Foundry, please download from the original mod here: https://github.com/etiquettestartshere/chatedit. Note it will not have Polyglot support.

## System Requirements
This module is, to the best of my abilities, designed to be system agnostic. The most obvious failure point would be allowing messages that are not supposed to be edited to be edited, or the (edited) message or icon displaying incorrectly depending on system's chat cards. The original mod was tested on dnd5e and swb and I've tested it on PF2e. If you find that it does not function as desired on another system, please make a github issue about it and compatibility will be investigated.

## Limitations
Does not correctly support certain markdown styles, such as sorted or unsorted lists. This is due to, I believe, how foundry handles line breaks. Personally I have no use for them and am only after inline styling, so if someone wants this to work correctly I would be open to pull requests.

## Hooks
The below hooks are intended for module developers or world script enjoyers who may be touching or processing ChatMessages, to ensure that their changes happen before or after this module's changes, or for whatever other reason.
```js
/**
 * Hook called before the markdown processing is completed and applied. Return `false` to prevent processing.
 * @param {ChatMessage} message       The ChatMessage to be processed.
 * @param {string} parsed             The message content after being parsed by Showdown.
 * @param {showdown.Converter} parser The Showdown parser.
 * @param {string} userid             The id of the user who created or is processing the message.
 */
Hooks.call("chatedit.preProcessChatMessage", message, parsed, parser, userid);
```
```js
/**
 * Hook called after the message is processed.
 * @param {ChatMessage} message       The ChatMessage to be processed.
 * @param {string} parsed             The message content after being parsed by Showdown.
 * @param {showdown.Converter} parser The Showdown parser.
 * @param {string} userid             The id of the user who created or is processing the message.
 */
Hooks.callAll("chatedit.processChatMessage", message, parsed, parser, userid);
```
```js
/**
 * Hook called before the edit is completed and applied. Return `false` to prevent processing.
 * @param {ChatMessage} message      The ChatMessage to be processed.
 * @param {string} parsed            The message content after being parsed by Showdown.
 * @param {object} [changed]         Differential data that will be used to update the document.
 * @param {string} [changed.content] The message content as edited by the application.
 * @param {object} [changed.speaker] The speaker object as edited by the application.
 * @param {number} [changed.style]   The edited type (version 11) or style (version 12) of the message document.
 * @param {string} [changed.flags]   The message flags, which may contain module data.
 * @param {object} data              The formData from the application.
 * @param {string} userid            The id of the user who created or is processing the message.
 */
Hooks.call("chatedit.preEditChatMessage", message, { content, speaker, style, flags }, data, userid);
```
```js
/**
 * Hook called after the edit is completed.
 * @param {ChatMessage} message      The ChatMessage to be processed.
 * @param {string} parsed            The message content after being parsed by Showdown.
 * @param {object} [changed]         Differential data that will be used to update the document.
 * @param {string} [changed.content] The message content as edited by the application.
 * @param {object} [changed.speaker] The speaker object as edited by the application.
 * @param {number} [changed.style]   The edited type (version 11) or style (version 12) of the message document.
 * @param {string} [changed.flags]   The message flags, which may contain module data.
 * @param {object} data              The formData from the application.
 * @param {string} userid            The id of the user who created or is processing the message.
 */
Hooks.callAll("chatedit.editChatMessage", message, { content, speaker, style, flags }, data, userid);
```

### Future Plans
I would like to fix the visual problem on the edit window with the extra spaces at the start of lines. Other than that, I don't have any other plans besides keeping this up to date with Foundry's newest release.
___

###### **Technical Details**

**Scope:** A custom application for appv2 to edit chat messages, accessible from chat message context menus, and an implementation of Showdown as bundled by Foundry on preCreate hooks to add markdown parsing to message content. If "Show Edited Messages" is enabled, messages that are edited will be flagged once by a `chatedit: { edited: Boolean }` flag. The only other data modified is the `content` and `speaker` of chat messages when they are edited, or processed by Showdown. Now includes support for changing languages in editing through the Polyglot module.

**License:** MIT license.

**Fork Additional Info:** No chat editing mod was available for v13 so rather than continue to complain about it I decided to just make one myself. Thankfully, there was already one out there with an MIT license, so all I had to do was edit the code to work with the newer Foundry versions and appv2. Therefore, most of the work here can be credited to the original author alakshana, whom I can't thank enough for the original mod. I've really only edited some code to work for v13, changed the editor window to show markdown instead of html, and added Polyglot integration. Original thanks from them below:

**Original Additional Info:** Thank you to the original (to my knowledge) chat editor module DF Chat Enhancements and its author flamewave000, and to Karakara's Chat Enhancements and its author Julia. This module carries forward some ideas originally from (to my knowledge) DF Chat Enhancements, and a few ideas from Karakara's, too (though the approach of this module varies). Thanks also to dnd5e, from which I took a tiny bit of css for the context menu groups. Thanks also to Zhell, Flix, mxzf, esheyw, ChaosOS, and Ethaks for putting up with me as I struggled to bring a chat editor module into the modern era. Thanks especially to Mana, who told me to use Showdown rather than bundling an external markdown library.
