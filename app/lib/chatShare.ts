export type ShareableChatTurn = {
  role: "user" | "copilot" | "error";
  text: string;
};

type ProviderShareOptions = {
  chatId: string;
  chatUrl: string;
  turns: ShareableChatTurn[];
};

type MessageBlock = {
  type: "header" | "section" | "divider";
  text?: string;
  fields?: Record<string, string>;
};

export type ProviderSharePayload = {
  body: string;
  metadata: Record<string, string | number>;
  blocks: MessageBlock[];
};

const DEFAULT_SHARE_TITLE = "OpsOrch Copilot chat";
const MAX_TURN_LENGTH = 280;

function normalizeTitleText(text: string) {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_TURN_LENGTH) return collapsed;
  return `${collapsed.slice(0, MAX_TURN_LENGTH - 1)}…`;
}

function formatTurnText(text: string) {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length <= MAX_TURN_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_TURN_LENGTH - 1).trimEnd()}…`;
}

function getRoleLabel(role: ShareableChatTurn["role"]) {
  if (role === "user") return "You";
  if (role === "copilot") return "Copilot";
  return "Error";
}

function selectShareTurns(turns: ShareableChatTurn[]) {
  const firstUserTurn = turns.find((turn) => turn.role === "user" && turn.text.trim().length > 0);
  const lastResponseTurn =
    [...turns].reverse().find((turn) => turn.role === "copilot" && turn.text.trim().length > 0) ||
    [...turns].reverse().find((turn) => turn.role !== "user" && turn.text.trim().length > 0);

  return [firstUserTurn, lastResponseTurn].filter(
    (turn, index, list): turn is ShareableChatTurn => Boolean(turn) && list.indexOf(turn) === index,
  );
}

export function buildChatSharePath(chatId: string) {
  return `/chats/${encodeURIComponent(chatId)}`;
}

export function buildChatShareTitle(turns: ShareableChatTurn[]) {
  const firstUserTurn = turns.find((turn) => turn.role === "user" && turn.text.trim().length > 0);
  if (!firstUserTurn) return DEFAULT_SHARE_TITLE;
  const normalized = normalizeTitleText(firstUserTurn.text);
  return normalized.length <= 72 ? normalized : `${normalized.slice(0, 71)}…`;
}

export function buildChatShareTranscript(turns: ShareableChatTurn[]) {
  return selectShareTurns(turns)
    .map((turn) => `### ${getRoleLabel(turn.role)}\n${formatTurnText(turn.text) || "_No content_"}`)
    .join("\n\n");
}

export function buildProviderSharePayload({
  chatId,
  chatUrl,
  turns,
}: ProviderShareOptions): ProviderSharePayload {
  const title = buildChatShareTitle(turns);
  const transcript = buildChatShareTranscript(turns);
  const selectedTurns = selectShareTurns(turns);
  const firstQuestion = selectedTurns.find((turn) => turn.role === "user");
  const lastConclusion = selectedTurns.find((turn) => turn.role !== "user");
  const questionText = firstQuestion ? formatTurnText(firstQuestion.text) : "";
  const conclusionText = lastConclusion ? formatTurnText(lastConclusion.text) : "";
  const body = [
    `OpsOrch Copilot: ${title}`,
    "",
    questionText ? `Question:\n${questionText}` : "",
    "",
    conclusionText ? `Latest conclusion:\n${conclusionText}` : "",
    "",
    `Open chat: [${title}](${chatUrl})`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    body,
    metadata: {
      chatId,
      chatUrl,
      shareTitle: title,
      turnCount: turns.length,
    },
    blocks: [
      { type: "header", text: "OpsOrch Copilot Chat" },
      { type: "section", text: `*${title}*` },
      {
        type: "section",
        fields: {
          "Chat ID": chatId,
          Turns: String(turns.length),
        },
      },
      { type: "divider" },
      ...(firstQuestion ? [{ type: "section" as const, text: `*Initial question*\n${formatTurnText(firstQuestion.text) || "_No content_"}` }] : []),
      ...(lastConclusion ? [{ type: "section" as const, text: `*Latest conclusion*\n${formatTurnText(lastConclusion.text) || "_No content_"}` }] : []),
      { type: "divider" },
      { type: "section", text: `[Open full chat](${chatUrl})` },
      ...(transcript ? [{ type: "section" as const, text: transcript }] : []),
    ],
  };
}
