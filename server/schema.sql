CREATE TABLE IF NOT EXISTS posts (
    id BIGINT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    tag VARCHAR(80) NOT NULL DEFAULT 'Thoughts',
    emoji VARCHAR(16) NOT NULL DEFAULT '☕',
    display_date VARCHAR(80) NOT NULL DEFAULT '',
    excerpt VARCHAR(500) NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    quote VARCHAR(500) NOT NULL DEFAULT '',
    likes INTEGER NOT NULL DEFAULT 0 CHECK (likes>=0),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_archived_created_idx ON posts (is_archived,created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);