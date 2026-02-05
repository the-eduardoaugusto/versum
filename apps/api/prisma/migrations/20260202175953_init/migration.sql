-- CreateEnum
CREATE TYPE "Testament" AS ENUM ('OLD', 'NEW');

-- CreateEnum
CREATE TYPE "ReadingMode" AS ENUM ('DISCOVERY', 'JOURNEY');

-- CreateEnum
CREATE TYPE "MagicLinkStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'INVALIDATED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "bio" VARCHAR(500),
    "picture_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_links" (
    "id" UUID NOT NULL,
    "publicId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "used_at" TIMESTAMP(3),
    "invalidated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_books" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "order" SMALLINT NOT NULL,
    "testament" "Testament" NOT NULL,
    "total_chapters" SMALLINT NOT NULL,

    CONSTRAINT "bible_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_chapters" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "number" SMALLINT NOT NULL,
    "total_verses" SMALLINT NOT NULL,

    CONSTRAINT "bible_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_verses" (
    "id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "number" SMALLINT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "bible_verses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "verse_id" UUID NOT NULL,
    "mode" "ReadingMode" NOT NULL,
    "read_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "verse_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "verse_id" UUID NOT NULL,
    "selected_text" TEXT NOT NULL,
    "annotation" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "magic_links_publicId_key" ON "magic_links"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "magic_links_token_key" ON "magic_links"("token");

-- CreateIndex
CREATE INDEX "magic_links_email_publicId_idx" ON "magic_links"("email", "publicId");

-- CreateIndex
CREATE INDEX "magic_links_expires_at_idx" ON "magic_links"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "bible_books_name_key" ON "bible_books"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bible_books_order_key" ON "bible_books"("order");

-- CreateIndex
CREATE INDEX "bible_books_testament_order_idx" ON "bible_books"("testament", "order");

-- CreateIndex
CREATE UNIQUE INDEX "bible_chapters_book_id_number_key" ON "bible_chapters"("book_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verses_chapter_id_number_key" ON "bible_verses"("chapter_id", "number");

-- CreateIndex
CREATE INDEX "readings_user_id_read_at_idx" ON "readings"("user_id", "read_at" DESC);

-- CreateIndex
CREATE INDEX "readings_verse_id_idx" ON "readings"("verse_id");

-- CreateIndex
CREATE INDEX "likes_verse_id_idx" ON "likes"("verse_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_verse_id_key" ON "likes"("user_id", "verse_id");

-- CreateIndex
CREATE INDEX "marks_user_id_created_at_idx" ON "marks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "marks_verse_id_idx" ON "marks"("verse_id");

-- CreateIndex
CREATE INDEX "marks_is_public_idx" ON "marks"("is_public");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_chapters" ADD CONSTRAINT "bible_chapters_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "bible_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verses" ADD CONSTRAINT "bible_verses_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "bible_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_verse_id_fkey" FOREIGN KEY ("verse_id") REFERENCES "bible_verses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_verse_id_fkey" FOREIGN KEY ("verse_id") REFERENCES "bible_verses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_verse_id_fkey" FOREIGN KEY ("verse_id") REFERENCES "bible_verses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
