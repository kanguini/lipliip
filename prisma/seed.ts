/**
 * Dados de demonstração: `npm run db:seed`
 * Conta: demo@lipliip.pt / demo12345
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "node:crypto";

const db = new PrismaClient();
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const token = () => randomBytes(24).toString("base64url");

async function main() {
  const email = "demo@lipliip.pt";
  await db.user.deleteMany({ where: { email } });
  const user = await db.user.create({ data: { name: "Ana Demo", email, passwordHash: await bcrypt.hash("demo12345", 10) } });

  const wedding = await db.event.create({
    data: {
      ownerId: user.id,
      type: "WEDDING",
      templateId: "rubi",
      title: "Casamento de Ana & João",
      hostNames: "Ana & João",
      message: "Com a bênção das nossas famílias, temos a alegria de vos convidar para celebrar connosco o dia do nosso casamento.",
      date: new Date("2027-06-14T15:00:00"),
      endTime: "02:00",
      venueName: "Quinta da Serra",
      venueAddress: "Estrada da Serra 12, Sintra",
      dressCode: "Formal",
      rsvpDeadline: new Date("2027-05-14"),
      programJson: JSON.stringify([
        { time: "15:00", title: "Cerimónia", description: "Igreja de São Martinho" },
        { time: "17:00", title: "Copo de água", description: "Jardins da Quinta" },
        { time: "20:00", title: "Jantar" },
        { time: "23:00", title: "Bolo e festa" },
      ]),
      contributionIban: "PT50 0000 0000 0000 0000 0000 0",
      contributionNote: "Estamos a juntar para a lua de mel 🌴",
      gifts: {
        create: [
          { name: "Máquina de café", description: "Modelo com moinho integrado", price: 249, storeUrl: "https://example.com/cafe" },
          { name: "Jogo de toalhas", price: 60, quantity: 3 },
          { name: "Robot de cozinha", price: 599 },
          { kind: "CASH", name: "Lua de mel em Bali", description: "Contribua com o valor que quiser" },
        ],
      },
      guests: {
        create: [
          { name: "Maria Santos", phone: "+351912345678", maxCompanions: 1, groupName: "Família", token: token(), checkinCode: code() },
          { name: "Rui Costa", phone: "+351913333333", maxCompanions: 0, groupName: "Amigos", token: token(), checkinCode: code() },
          { name: "Carla Mendes", phone: "+244923456789", maxCompanions: 2, groupName: "Trabalho", token: token(), checkinCode: code(), rsvpStatus: "ACCEPTED", companions: 1, respondedAt: new Date() },
        ],
      },
    },
    include: { guests: true },
  });

  await db.event.create({
    data: {
      ownerId: user.id,
      type: "BIRTHDAY",
      templateId: "festa",
      title: "30 anos da Ana",
      hostNames: "Ana faz 30!",
      message: "Três décadas merecem uma grande festa. Conto contigo!",
      date: new Date("2027-09-05T20:00:00"),
      venueName: "Casa da Ana",
      venueAddress: "Rua das Flores 45, Porto",
      verificationRequired: false,
      guests: { create: [{ name: "Pedro Alves", phone: "+351914444444", token: token(), checkinCode: code() }] },
    },
  });

  console.log("Seed concluído. Conta demo: demo@lipliip.pt / demo12345");
  console.log("Links de convite do casamento:");
  for (const g of wedding.guests) console.log(`  ${g.name}: http://localhost:3000/c/${g.token}`);
}

main().finally(() => db.$disconnect());
