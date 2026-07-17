-- OIDC/SSO: lokales Passwort optional machen (reine OIDC-Nutzer haben keins)
-- und stabile Verknüpfung zur Authentik-Identität ergänzen.
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "oidc_sub" TEXT;
CREATE UNIQUE INDEX "users_oidc_sub_key" ON "users"("oidc_sub");
