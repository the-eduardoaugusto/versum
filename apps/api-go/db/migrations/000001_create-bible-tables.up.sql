CREATE TABLE bible_books (
    "id" varchar(36) PRIMARY KEY,
    "order" integer NOT NULL UNIQUE,
    "name" varchar(100) NOT NULL UNIQUE,
    "abbreviation" varchar(10) NOT NULL UNIQUE,
    "testament" varchar(10) NOT NULL,
);
CREATE TABLE bible_chapters (
    "id" varchar(36) PRIMARY KEY,
    "book_id" varchar(36) NOT NULL REFERENCES bible_books(id) ON DELETE CASCADE,
    "number" integer NOT NULL,
    UNIQUE ("book_id", "number")
);
CREATE TABLE bible_verses (
    "id" varchar(36) PRIMARY KEY,
    "chapter_id" varchar(36) NOT NULL REFERENCES bible_chapters(id) ON DELETE CASCADE,
    "number" integer NOT NULL,
    "text" text NOT NULL,
    UNIQUE ("chapter_id", "number")
)