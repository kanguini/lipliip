-- Semeia o preço de ativação de um evento (35.000 Kz), definido pelo dono da plataforma.
-- Cria a linha única de definições se ainda não existir; caso exista, atualiza apenas o preço.
-- O administrador pode alterar este valor (e os dados bancários) a qualquer momento em /admin/settings.
INSERT INTO "PlatformSettings" ("id", "eventPrice", "currency", "updatedAt")
VALUES ('default', 35000, 'AOA', now())
ON CONFLICT ("id") DO UPDATE SET "eventPrice" = 35000, "updatedAt" = now();
