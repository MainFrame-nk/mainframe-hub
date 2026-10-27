import crypto from "node:crypto";

// Берем мастер-пароль из .env и доводим его до 32 байт для алгоритма AES-256
const getSecretKey = () => {
  const password = process.env.VAULT_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("CRITICAL SECURITY ERROR: VAULT_PASSWORD is not set in .env!");
  }
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

// --- ПОТОКОВОЕ ШИФРОВАНИЕ БОЛЬШИХ ФАЙЛОВ И АУДИО (AES-256-CTR) ---

// Детерминированный IV (16 байт) из уникального storageKey файла + секрета
function getFileIvForOffset(storageKey: string, byteOffset: number = 0): Buffer {
  const baseHash = crypto
    .createHmac("sha256", getSecretKey())
    .update(storageKey)
    .digest();
  const iv = Buffer.from(baseHash.subarray(0, 16));

  // В режиме AES-CTR каждые 16 байт увеличивают 128-битный счетчик на 1
  const blockIndex = BigInt(Math.floor(byteOffset / 16));
  if (blockIndex > BigInt(0)) {
    const low64 = iv.readBigUInt64BE(8);
    const sum = low64 + blockIndex;
    iv.writeBigUInt64BE(sum & BigInt("0xffffffffffffffff"), 8);
  }
  return iv;
}

// Поток для шифрования файла на лету при загрузке на сервер
export function createFileEncryptStream(storageKey: string) {
  const iv = getFileIvForOffset(storageKey, 0);
  return crypto.createCipheriv("aes-256-ctr", getSecretKey(), iv);
}

// Расшифровка любого куска (Buffer) файла с любого смещения (для Range стриминга!)
export function decryptFileChunk(
  encryptedChunk: Buffer,
  storageKey: string,
  startByteOffset: number = 0
): Buffer {
  const blockOffset = Math.floor(startByteOffset / 16) * 16;
  const skipBytes = startByteOffset % 16;
  const iv = getFileIvForOffset(storageKey, blockOffset);

  const decipher = crypto.createDecipheriv("aes-256-ctr", getSecretKey(), iv);

  if (skipBytes > 0) {
    // Сдвигаем внутреннее состояние CTR внутри 16-байтного блока
    const dummy = Buffer.alloc(skipBytes);
    decipher.update(dummy);
  }

  return Buffer.concat([decipher.update(encryptedChunk), decipher.final()]);
}

// Хеширование пароля для публичных ссылок /s/[token]
export function hashSharePassword(password: string): string {
  return crypto.createHmac("sha256", getSecretKey()).update(password.trim()).digest("hex");
}