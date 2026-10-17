import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { borrowers } from "@/db/schema";
import type { BorrowerInput } from "@/lib/borrowers/schema";

export async function createBorrower(organizationId: string, input: BorrowerInput) {
  const [borrower] = await db
    .insert(borrowers)
    .values({
      organizationId,
      displayName: input.displayName,
      email: input.email,
      borrowerCode: input.borrowerCode,
    })
    .returning();
  return borrower;
}

export async function createQuickBorrower(organizationId: string, displayName: string) {
  const [borrower] = await db
    .insert(borrowers)
    .values({ organizationId, displayName })
    .returning();
  return borrower;
}

export async function updateBorrower(
  organizationId: string,
  borrowerId: string,
  input: BorrowerInput,
) {
  const [borrower] = await db
    .update(borrowers)
    .set({
      displayName: input.displayName,
      email: input.email,
      borrowerCode: input.borrowerCode,
      updatedAt: new Date(),
    })
    .where(and(eq(borrowers.organizationId, organizationId), eq(borrowers.id, borrowerId)))
    .returning();

  if (!borrower) throw new Error("Emprunteur introuvable.");
  return borrower;
}

export async function setBorrowerActive(
  organizationId: string,
  borrowerId: string,
  active: boolean,
) {
  const [borrower] = await db
    .update(borrowers)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(borrowers.organizationId, organizationId), eq(borrowers.id, borrowerId)))
    .returning();

  if (!borrower) throw new Error("Emprunteur introuvable.");
  return borrower;
}
