import { MODULE, SAYAS_CONST, SETTINGS, localize } from "./const.mjs";

let PolyglotProvider = null;

Hooks.once("polyglot.init", () => {
  PolyglotProvider = game.polyglot;
});

/**
 * Keep PF2e Dorako UI's cached avatar flags in step with the new speaker.
 * No-op unless the message already carries Dorako UI flags.
 * @param {object} speaker      The reassigned speaker data.
 * @param {ChatMessage} message The message being reassigned.
 */
function changeDorakoUIImage(speaker, message) {
  if (message.flags["pf2e-dorako-ui"] == null) return;

  const token = game.scenes.viewed.tokens.get(speaker.token);
  const actor = game.actors.get(speaker.actor);

  const tokenAvatar = speaker.token ? {
    "image": token.texture.src,
    "name": speaker.alias,
    "scale": token.texture.scaleX,
    "isSmall": actor.size == "sm",
    "type": "token"
  } : null;
  const actorAvatar = speaker.actor ? {
    "image": actor.img,
    "name": speaker.alias,
    "type": "actor"
  } : null;

  message.updateSource({
    "flags.pf2e-dorako-ui.userAvatar": null,
    "flags.pf2e-dorako-ui.combatantAvatar": null,
    "flags.pf2e-dorako-ui.tokenAvatar": tokenAvatar,
    "flags.pf2e-dorako-ui.actorAvatar": actorAvatar,
    "flags.pf2e-dorako-ui.subjectAvatar": null
  });
}

export class SayAs {

  static init() {
    if (!game.settings.get(MODULE, SETTINGS.ENABLED)) return;
    // Right click options for chat messages in the sidebar and popout chatlogs.
    Hooks.on("getChatMessageContextOptions", SayAs._contextMenu);
  }

  /**
   * The ChatMessage field used for message style. (The v11 "type" / v12+
   * "style" split is gone now that we require v13+.)
   */
  static styleType() {
    return "style";
  }

  /* -------------------------------------------- */
  /* Conditions                                   */
  /* -------------------------------------------- */

  /**
   * Whether this message's speaker may be reassigned.
   *
   * Reassignment only ever writes `speaker` and `style`, never `content`, so
   * it is safe on roll messages -- rewriting a roll's content would desync it
   * from its `rolls` array, but relabelling who said it does not.
   *
   * Messages carrying system flags are excluded: system chat cards can
   * re-derive their actor from those flags, so reassigning the speaker alone
   * would leave the two disagreeing.
   * @param {string} id The id of the ChatMessage to be tested.
   * @returns {boolean} True if the message's speaker can be reassigned.
   */
  static _canReassign(id) {
    const message = game.messages.get(id);
    if (!message?.isAuthor) return false;
    if (message.whisper.length) return false;
    return foundry.utils.isEmpty(message.flags?.[game.system.id]);
  }

  /**
   * Whether the message currently has a character as its speaker.
   * @param {string} id The id of the ChatMessage to be tested.
   * @returns {boolean} True if the message is attributed to a character.
   */
  static _hasCharacterSpeaker(id) {
    if (!SayAs._canReassign(id)) return false;
    const message = game.messages.get(id);
    return message.speaker.actor != null || message.speaker.token != null;
  }

  /* -------------------------------------------- */
  /* Reassignment                                 */
  /* -------------------------------------------- */

  /**
   * Attribute the message to the controlled token, or failing that to the
   * user's assigned character.
   * @param {string} id The id of the ChatMessage to reassign.
   */
  static _speakAsSelected(id) {
    // A controlled token is a placeable (use its TokenDocument as speaker);
    // game.user.character is an Actor. Resolve both so we build the speaker
    // and query Polyglot consistently regardless of which one we have.
    const token = canvas.tokens.controlled[0] ?? null;
    const actor = token?.actor ?? game.user.character;
    if (!actor) return ui.notifications.warn(localize("SAYAS.NoTarget"));

    const message = game.messages.get(id);
    const speaker = token
      ? ChatMessage.getSpeaker({ token: token.document })
      : ChatMessage.getSpeaker({ actor });

    // A roll's content is generated dice HTML, so the emote test below is
    // meaningless there and forcing an IC style would restyle the roll card --
    // reassign the speaker only and leave the style alone.
    if (message.isRoll) message.update({ speaker });
    else {
      const style = message.content.startsWith(speaker.alias)
        ? SAYAS_CONST.CHAT_MESSAGE_STYLES.EMOTE
        : SAYAS_CONST.CHAT_MESSAGE_STYLES.IC;
      message.update({ [SayAs.styleType()]: style, speaker });
    }

    if (PolyglotProvider) {
      const defaultLanguage = PolyglotProvider.defaultLanguage;
      const [known] = game.polyglot.getUserLanguages([actor]);
      const language = (known?.has(defaultLanguage)
        ? defaultLanguage
        : known?.values().next().value) ?? defaultLanguage;
      message.setFlag("polyglot", "language", language);
    }
    changeDorakoUIImage(speaker, message);
  }

  /**
   * Attribute the message to the user themselves, out of character.
   * @param {string} id The id of the ChatMessage to reassign.
   */
  static _attributeToMe(id) {
    const message = game.messages.get(id);
    const speaker = {
      alias: game.user.name,
      scene: null,
      actor: null,
      token: null
    };

    // As above, leave a roll's style untouched.
    if (message.isRoll) message.update({ speaker });
    else message.update({
      [SayAs.styleType()]: SAYAS_CONST.CHAT_MESSAGE_STYLES.OOC,
      speaker
    });

    if (PolyglotProvider) message.unsetFlag("polyglot", "language");
    changeDorakoUIImage(speaker, message);
  }

  /* -------------------------------------------- */
  /* Context Menu                                 */
  /* -------------------------------------------- */

  /**
   * Add the reassignment options to the chat message context menu.
   * @param {HTMLElement} html   HTML contents.
   * @param {Array} menuItems    The context menu items.
   * @returns {Array} The context menu items.
   */
  static _contextMenu(html, menuItems) {
    menuItems.push(
      {
        name: "SAYAS.SpeakAsSelected",
        icon: '<i class="fa-solid fa-masks-theater"></i>',
        // Offered for any reassignable message, including ones already spoken
        // by a character: the common case is a message sent as the wrong
        // character, which would otherwise need a round trip through OOC.
        condition: (li) => {
          return SayAs._canReassign(li.dataset.messageId)
            && !!(canvas.tokens.controlled[0] ?? game.user.character);
        },
        callback: (li) => SayAs._speakAsSelected(li.dataset.messageId),
        group: MODULE
      },
      {
        name: "SAYAS.AttributeToMe",
        icon: '<i class="fa-solid fa-computer"></i>',
        condition: (li) => SayAs._hasCharacterSpeaker(li.dataset.messageId),
        callback: (li) => SayAs._attributeToMe(li.dataset.messageId),
        group: MODULE
      }
    );
    return menuItems;
  }
}
