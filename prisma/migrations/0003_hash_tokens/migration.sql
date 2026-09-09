-- Sessões e dispositivos passaram a guardar o hash SHA-256 (hex, 64 caracteres) do token.
-- Linhas criadas antes desta versão guardam o token em claro (base64url, 43 ou 32 caracteres):
-- são re-hasheadas no lugar para que as cookies existentes continuem válidas.
UPDATE "Session" SET "token" = encode(sha256(convert_to("token", 'UTF8')), 'hex') WHERE length("token") <> 64;
UPDATE "GuestDevice" SET "deviceToken" = encode(sha256(convert_to("deviceToken", 'UTF8')), 'hex') WHERE length("deviceToken") <> 64;
