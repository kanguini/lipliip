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

-- Duplicados criados por condições de corrida antes do índice único: remove apenas cópias posteriores
-- que nunca foram usadas (não enviadas, sem resposta, sem abertura, sem check-in). Se restarem duplicados com dados,
-- o índice abaixo falha de propósito para serem resolvidos à mão em vez de perder dados.
DELETE FROM "Guest" g
USING "Guest" first
WHERE first."eventId" = g."eventId"
  AND first."phone" = g."phone"
  AND first."id" <> g."id"
  AND (first."createdAt", first."id") < (g."createdAt", g."id")
  AND g."rsvpStatus" = 'PENDING'
  AND g."sentAt" IS NULL
  AND g."firstOpenedAt" IS NULL
  AND g."checkedInAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Guest_eventId_phone_key" ON "Guest"("eventId", "phone");

-- CreateIndex
CREATE INDEX "GuestDevice_guestId_idx" ON "GuestDevice"("guestId");

-- CreateIndex
CREATE INDEX "GiftReservation_guestId_idx" ON "GiftReservation"("guestId");

-- CreateIndex
CREATE INDEX "GuestbookEntry_guestId_idx" ON "GuestbookEntry"("guestId");

