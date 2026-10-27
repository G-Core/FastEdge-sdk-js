-- Same rows as the Rust example's schema.sql.
INSERT INTO "example_users" ("id", "email", "nickname", "meta") VALUES
    (1, 'ann@example.com', NULL,    '{"plan": "pro"}'),
    (2, 'bob@example.com', 'bobby', '{"plan": "free"}')
ON CONFLICT ("id") DO NOTHING;
