export const TICKET_CATEGORY_ENUMS = [
  "Soporte_IT",
  "Solicitud_Suministro",
  "Mantenimiento",
  "Reporte_Incidente",
] as const;

export type TicketCategoryEnum = (typeof TICKET_CATEGORY_ENUMS)[number];

export const normalizeTicketCategory = (value: string): string =>
  value.trim().replace(/\s+/g, "_").replace(/_{2,}/g, "_");

export const isKnownTicketCategory = (value: string): value is string => {
  const normalized = normalizeTicketCategory(value);
  return (TICKET_CATEGORY_ENUMS as readonly string[]).includes(normalized);
};

export const getTicketCategoryEnum = (
  value: string
): TicketCategoryEnum | null => {
  const normalized = normalizeTicketCategory(value) as TicketCategoryEnum;
  return (TICKET_CATEGORY_ENUMS as readonly string[]).includes(normalized)
    ? normalized
    : null;
};
