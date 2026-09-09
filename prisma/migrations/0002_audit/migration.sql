-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "lastViewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Event_ownerId_idx" ON "Event"("ownerId");

-- CreateIndex
CREATE INDEX "EventMember_userId_idx" ON "EventMember"("userId");

-- CreateIndex
CREATE INDEX "Payment_budgetItemId_idx" ON "Payment"("budgetItemId");

-- Duplicados criados por condições de corrida antes do índice único: remove apenas cópias que nunca foram
-- usadas (não enviadas, sem resposta, sem abertura, sem check-in) quando existe outra cópia usada, ou, entre
-- cópias todas por usar, mantém a mais antiga. Se restarem duplicados ambos com dados, o índice abaixo falha
-- de propósito para serem resolvidos à mão em vez de perder dados (ver README, "Migrações").
DELETE FROM "Guest" g
WHERE g."rsvpStatus" = 'PENDING'
  AND g."sentAt" IS NULL
  AND g."firstOpenedAt" IS NULL
  AND g."checkedInAt" IS NULL
  AND EXISTS (
    SELECT 1 FROM "Guest" o
    WHERE o."eventId" = g."eventId"
      AND o."phone" = g."phone"
      AND o."id" <> g."id"
      AND (
        NOT (o."rsvpStatus" = 'PENDING' AND o."sentAt" IS NULL AND o."firstOpenedAt" IS NULL AND o."checkedInAt" IS NULL)
        OR (o."createdAt", o."id") < (g."createdAt", g."id")
      )
  );

-- CreateIndex
CREATE UNIQUE INDEX "Guest_eventId_phone_key" ON "Guest"("eventId", "phone");

-- CreateIndex
CREATE INDEX "GuestDevice_guestId_idx" ON "GuestDevice"("guestId");

-- CreateIndex
CREATE INDEX "GiftReservation_guestId_idx" ON "GiftReservation"("guestId");

-- CreateIndex
CREATE INDEX "GuestbookEntry_guestId_idx" ON "GuestbookEntry"("guestId");

