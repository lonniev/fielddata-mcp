/**
 * Every word FieldData's own pages say, in English: the bedrock the other
 * languages translate.
 *
 * Keys are "<area>.<file>.<name>" (areas: views, ui, lib). A `{{name}}` is
 * filled with a word or number; a `<name/>` or `<name>…</name>` is drawn as an
 * element. A translation keeps each one exactly as written and may move it.
 * "FieldData", vendor names, units and emoji stay as they are.
 */

export const en = {
};

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

export default en as Messages;
