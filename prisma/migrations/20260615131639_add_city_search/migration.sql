-- CreateTable
CREATE TABLE "NovaPoshtaCity" (
    "id" SERIAL NOT NULL,
    "ref" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NovaPoshtaCity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NovaPoshtaCity_ref_key" ON "NovaPoshtaCity"("ref");

-- CreateIndex
CREATE INDEX "NovaPoshtaCity_name_idx" ON "NovaPoshtaCity"("name");

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX city_name_trgm_idx ON "NovaPoshtaCity" USING gin (name gin_trgm_ops);
