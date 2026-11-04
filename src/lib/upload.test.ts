import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { UploadError, validateImage, validateModel } from "./upload";

const glb = new Uint8Array(readFileSync("public/models/demo-pro.glb"));

describe("validateModel", () => {
  it("aceita GLB real", () => expect(validateModel("x.glb", glb)).toBe("glb"));
  it("recusa extensão errada", () => expect(() => validateModel("x.exe", glb)).toThrow(UploadError));
  it("recusa GLB sem assinatura", () => expect(() => validateModel("x.glb", new TextEncoder().encode("<html>"))).toThrow(/assinatura/));
  it("recusa GLB truncado", () => expect(() => validateModel("x.glb", glb.slice(0, glb.length - 10))).toThrow(/corrompido/));
  it("recusa arquivo grande demais", () => expect(() => validateModel("x.glb", glb, 100)).toThrow(/maior/));
  it("recusa glTF com recurso externo", () => {
    const json = { asset: { version: "2.0" }, buffers: [{ uri: "https://evil.example/a.bin", byteLength: 1 }] };
    expect(() => validateModel("x.gltf", new TextEncoder().encode(JSON.stringify(json)))).toThrow(/externos/);
  });
  it("aceita glTF autocontido", () => {
    const json = { asset: { version: "2.0" }, buffers: [{ uri: "data:application/octet-stream;base64,AA==", byteLength: 1 }] };
    expect(validateModel("x.gltf", new TextEncoder().encode(JSON.stringify(json)))).toBe("gltf");
  });
});

describe("validateImage", () => {
  it("reconhece PNG", () => expect(validateImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]))).toBe("png"));
  it("reconhece JPG", () => expect(validateImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg"));
  it("recusa GIF/SVG", () => expect(() => validateImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toThrow(UploadError));
});
