// src/prisma/prisma-includes.ts
import { Prisma } from '@prisma/client';

export const userSelection = {
  id: true,
  username: true,
  email: true,
} satisfies Prisma.UserSelect;

export const ticketInclude = {
  createdBy: { select: userSelection },
  assignedTo: { select: userSelection },
  approvals: { orderBy: { step: 'asc' } },
} satisfies Prisma.TicketInclude;

export const civilWorkInclude = {
  createdBy: { select: userSelection },
} satisfies Prisma.CivilWorkInclude;
