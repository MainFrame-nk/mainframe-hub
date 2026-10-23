import crypto from "node:crypto";

// Берем мастер-пароль из .env и доводим его до 32 байт для алгоритма AES-256
const getSecretKey = () => {
  const password = process.env.VAULT_PASSWORD || "mainframe-secret-2026";
  return crypto.createHash("sha256").update(password).digest();
};

const IV_LENGTH = 16; // Initialization Vector для AES

// Функция шифрования текста
export function encryptText(text: string): string {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", getSecretKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    // Возвращаем склеенный вектор и шифротекст через двоеточие
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (e) {
    console.error("Ошибка шифрования:", e);
    return text;
  }
}

// Функция расшифровки текста
export function decryptText(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
  try {
    const [ivHex, encryptedHex] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getSecretKey(), iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    // Если не удалось расшифровать (например, старая незашифрованная заметка), возвращаем как есть
    return encryptedText;
  }
}