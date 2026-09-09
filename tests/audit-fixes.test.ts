import { describe, expect, it } from "vitest";
import { parseMoney } from "@/lib/form";
import { pickDeviceSlot } from "@/lib/device-slots";
import { clientIpFromHeaders } from "@/lib/guest-access";
import { resolveRole } from "@/lib/access";
import { csvCell, csvPhoneCell } from "@/lib/csv";
import { luminance } from "@/lib/color";

describe("parseMoney", () => {
  it("lê formatos portugueses e ingleses", () => {
    expect(parseMoney("1.250,00")).toBe(1250);
    expect(parseMoney("1,000.50")).toBe(1000.5);
    expect(parseMoney("2.500")).toBe(2500);
    expect(parseMoney("2.5")).toBe(2.5);
    expect(parseMoney("89,90")).toBe(89.9);
    expect(parseMoney("1 000")).toBe(1000);
    expect(parseMoney("1000")).toBe(1000);
    expect(parseMoney(" 45 € ")).toBe(45);
  });
  it("rejeita valores inválidos ou negativos", () => {
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("-5")).toBeNull();
    expect(parseMoney("1.2.3.4,5,6")).toBeNull();
  });
});

describe("pickDeviceSlot", () => {
  const d = (id: string, t: number) => ({ id, lastSeenAt: new Date(t) });
  it("cria enquanto houver lugares", () => {
    expect(pickDeviceSlot([], 2)).toEqual({ kind: "create" });
    expect(pickDeviceSlot([d("a", 1)], 2)).toEqual({ kind: "create" });
  });
  it("substitui o mais antigo ao atingir o limite", () => {
    expect(pickDeviceSlot([d("a", 10), d("b", 5), d("c", 20)], 3)).toEqual({ kind: "replace", id: "b" });
  });
  it("com limite 0 comporta-se como 1", () => {
    expect(pickDeviceSlot([], 0)).toEqual({ kind: "create" });
    expect(pickDeviceSlot([d("a", 1)], 0)).toEqual({ kind: "replace", id: "a" });
  });
});

describe("clientIpFromHeaders", () => {
  it("usa o último salto do X-Forwarded-For (o proxy de confiança)", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.5, 203.0.113.9" }))).toBe("203.0.113.9");
  });
  it("cai para x-real-ip e depois para indefinido", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIpFromHeaders(new Headers())).toBeUndefined();
  });
});

describe("resolveRole", () => {
  const event = { ownerId: "u1" };
  it("dono, editor, receção e sem acesso", () => {
    expect(resolveRole("u1", event, null)).toBe("OWNER");
    expect(resolveRole("u2", event, { role: "EDITOR" })).toBe("EDITOR");
    expect(resolveRole("u3", event, { role: "STAFF" })).toBe("STAFF");
    expect(resolveRole("u4", event, null)).toBeNull();
  });
});

describe("csv", () => {
  it("entrecoma quando há retorno de carro e neutraliza fórmulas", () => {
    expect(csvCell("Obrigado\r=WEBSERVICE(A1)")).toBe('"Obrigado\r=WEBSERVICE(A1)"');
    expect(csvCell("=1+1")).toBe("\"'=1+1\"");
    expect(csvCell("Ana")).toBe("Ana");
  });
  it("telefone como fórmula de texto", () => {
    expect(csvPhoneCell("+351912345678")).toBe('"=""+351912345678"""');
  });
});

describe("luminance", () => {
  it("distingue cores claras e escuras", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1, 2);
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffe066") > 0.4).toBe(true);
    expect(luminance("#541b38") < 0.4).toBe(true);
  });
});
