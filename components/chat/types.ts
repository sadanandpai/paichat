export type ChatPersona = {
  name: string;
  tagline?: string;
  initials: string;
  image?: string;
};

export type ChatCopy = {
  placeholder: string;
  emptyTitle: string;
  emptySubtitle?: string;
};

/**
 * Contract every chat UI adapter implements. Nothing here references a UI kit,
 * so swapping adapters only touches the import in `chat.tsx`.
 */
export type ChatViewProps = {
  api: string;
  threadId: string;
  persona: ChatPersona;
  copy: ChatCopy;
};
