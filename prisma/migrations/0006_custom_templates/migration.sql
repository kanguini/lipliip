-- CreateTable
CREATE TABLE "CustomTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "tag" TEXT NOT NULL DEFAULT '',
    "types" TEXT[],
    "imageMediaId" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT '#541b38',
    "bgColor" TEXT NOT NULL DEFAULT '#fbf5f7',
    "textColor" TEXT NOT NULL DEFAULT '#30262e',
    "sampleNames" TEXT NOT NULL DEFAULT 'Sofia & Miguel',
    "sampleCaption" TEXT NOT NULL DEFAULT 'Uma vida inteira começa aqui.',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTemplate_pkey" PRIMARY KEY ("id")
);
