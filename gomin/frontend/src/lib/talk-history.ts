export type UnsavedConversation = { id: string; title: string; updated_at: string };

export function groupTalkHistory(conversations: UnsavedConversation[], timeZone?: string) {
  const formatter = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone });
  const groups = new Map<string, UnsavedConversation[]>();
  for (const conversation of [...conversations].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at) || b.id.localeCompare(a.id))) {
    const date = formatter.format(new Date(conversation.updated_at));
    const group = groups.get(date) ?? [];
    group.push(conversation);
    groups.set(date, group);
  }
  return [...groups].map(([date, items]) => ({ date, items }));
}
