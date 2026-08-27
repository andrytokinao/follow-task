
import { MessageDto, MessageDayGroup } from '../models/messaging.model';
import {MessageApp} from "../type/issue";

export function groupMessagesByDay(messages: MessageApp[]): MessageDayGroup[] {
  const groups = new Map<string, MessageApp[]>();

  const sorted = [...messages].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  );

  for (const msg of sorted) {
    const iso = new Date(msg.created).toISOString().slice(0, 10); // YYYY-MM-DD
    if (!groups.has(iso)) groups.set(iso, []);
    groups.get(iso)!.push(msg);
  }

  return Array.from(groups.entries()).map(([isoDate, msgs]) => ({
    isoDate,
    dateLabel: formatDayLabel(isoDate),
    messages: msgs,
  }));
}

function formatDayLabel(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Aujourd'hui";
  if (sameDay(date, yesterday)) return 'Hier';

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
