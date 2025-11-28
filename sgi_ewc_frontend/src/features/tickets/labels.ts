import { TicketPriority, TicketStatus } from '../../types/Ticket';
import { useLanguage } from '../../contexts/LanguageContext';

export function useTicketLabels() {
  const { t } = useLanguage();
  const statusLabel = (status: TicketStatus): string => t(`tickets.status.${status}`);
  const priorityLabel = (priority: TicketPriority): string => t(`tickets.priority.${priority}`);
  return { statusLabel, priorityLabel, t };
}
