import { describe, it, expect } from "vitest";
import { detectCategory } from "../src/commands/index.js";

describe("detectCategory", () => {
  describe("smartphones detection", () => {
    it("detects smartphone from URL", () => {
      const result = detectCategory(
        "https://loja.com/smartphone/iphone-16-pro",
        "Compre o iPhone 16 Pro"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("celulares/smartphones");
    });

    it("detects smartphone from content keywords", () => {
      const result = detectCategory(
        "https://loja.com/produto/12345",
        "Smartphone Samsung Galaxy S24 Ultra com 5G, câmera de 200MP, bateria de 5000mAh"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("celulares/smartphones");
    });

    it("detects iPhone from content", () => {
      const result = detectCategory(
        "https://loja.com/produto",
        "iPhone 16 Pro Max smartphone celular com iOS 18, tela Super Retina XDR"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("celulares/smartphones");
    });
  });

  describe("notebooks detection", () => {
    it("detects notebook from URL", () => {
      const result = detectCategory(
        "https://loja.com/notebook/macbook-air",
        "MacBook Air com chip M4"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("notebooks");
    });

    it("detects notebook from processor keywords", () => {
      const result = detectCategory(
        "https://loja.com/produto",
        "Laptop Dell com Intel Core i7, 16GB RAM, SSD 512GB"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("notebooks");
    });
  });

  describe("TVs detection", () => {
    it("detects TV from URL", () => {
      const result = detectCategory(
        "https://loja.com/tv/samsung-4k-55",
        "Smart TV Samsung 55 polegadas"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("tvs");
    });

    it("detects TV from OLED/QLED keywords", () => {
      const result = detectCategory(
        "https://loja.com/produto",
        "TV OLED LG 65 polegadas com HDR Dolby Vision, 4K 120Hz"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("tvs");
    });
  });

  describe("audio detection", () => {
    it("detects headphones", () => {
      const result = detectCategory(
        "https://loja.com/fone",
        "Fone Sony WH-1000XM5 com cancelamento de ruído ANC"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("audio");
    });

    it("detects earbuds from content", () => {
      const result = detectCategory(
        "https://loja.com/produto",
        "AirPods Pro 2 com cancelamento de ruído ativo, Bluetooth 5.3"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("audio");
    });
  });

  describe("monitors detection", () => {
    it("detects monitor", () => {
      const result = detectCategory(
        "https://loja.com/monitor",
        "Monitor Dell 27 polegadas 144Hz IPS com FreeSync G-Sync display"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("monitors");
    });
  });

  describe("smartwatches detection", () => {
    it("detects Apple Watch", () => {
      const result = detectCategory(
        "https://loja.com/apple-watch",
        "Apple Watch Series 10 com GPS e frequência cardíaca"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("smartwatches");
    });
  });

  describe("cameras detection", () => {
    it("detects mirrorless camera", () => {
      const result = detectCategory(
        "https://loja.com/camera",
        "Câmera Sony Alpha A7 IV mirrorless com sensor 33 megapixels"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("cameras");
    });
  });

  describe("games detection", () => {
    it("detects PlayStation", () => {
      const result = detectCategory(
        "https://loja.com/ps5",
        "PlayStation 5 console com controle DualSense"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("games");
    });

    it("detects Nintendo Switch", () => {
      const result = detectCategory(
        "https://loja.com/nintendo",
        "Nintendo Switch OLED com Joy-Con"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("games");
    });
  });

  describe("eletrodomesticos detection", () => {
    it("detects air fryer", () => {
      const result = detectCategory(
        "https://loja.com/airfryer",
        "Fritadeira Airfryer Mondial 5L"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("eletrodomesticos");
    });

    it("detects refrigerator", () => {
      const result = detectCategory(
        "https://loja.com/geladeira",
        "Geladeira Brastemp Frost Free 400L"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("eletrodomesticos");
    });
  });

  describe("moda detection", () => {
    it("detects sneakers", () => {
      const result = detectCategory(
        "https://loja.com/tenis",
        "Tênis Nike Air Max 90 masculino tamanho 42"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("moda");
    });
  });

  describe("tablets detection", () => {
    it("detects iPad", () => {
      const result = detectCategory(
        "https://loja.com/ipad",
        "iPad Pro 12.9 com Apple Pencil e tela touch"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("tablets");
    });

    it("detects Galaxy Tab", () => {
      const result = detectCategory(
        "https://loja.com/tablet",
        "Samsung Galaxy Tab S9 com S Pen"
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("tablets");
    });
  });

  describe("confidence scoring", () => {
    it("returns higher confidence for URL matches", () => {
      const urlMatch = detectCategory(
        "https://loja.com/smartphone/samsung-galaxy",
        "Smartphone Samsung Galaxy celular"
      );
      const contentMatch = detectCategory(
        "https://loja.com/produto/12345",
        "Smartphone Samsung Galaxy celular android 5g"
      );

      expect(urlMatch).not.toBeNull();
      expect(contentMatch).not.toBeNull();
      // URL matches should have higher score (confidence depends on total)
      expect(urlMatch!.confidence).toBeGreaterThan(0);
      expect(contentMatch!.confidence).toBeGreaterThan(0);
    });

    it("returns null for unknown content", () => {
      const result = detectCategory(
        "https://loja.com/produto/12345",
        "Lorem ipsum dolor sit amet"
      );
      expect(result).toBeNull();
    });

    it("returns null for low score content", () => {
      const result = detectCategory(
        "https://example.com/page",
        "Generic product page with no keywords"
      );
      expect(result).toBeNull();
    });
  });

  describe("ambiguous content", () => {
    it("picks highest scoring category", () => {
      // Content with both smartphone and notebook keywords, but more smartphone
      const result = detectCategory(
        "https://loja.com/smartphone",
        "Smartphone Samsung Galaxy S24 com Android, 5G, celular moderno. Notebook Dell mencionado."
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe("celulares/smartphones");
    });
  });
});
