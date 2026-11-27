import "dotenv/config";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import { upsertLead } from "./supabase.js";

const AUTH_DIR = process.env.SESSION_STORAGE_PATH || "./auth_info";

function extractText(message) {
  if (!message) return "";
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    ""
  );
}

function jidToPhone(jid) {
  // "5511999999999:12@s.whatsapp.net" -> "5511999999999"
  return (jid || "").split("@")[0].split(":")[0].replace(/\D/g, "");
}

function isLidJid(jid) {
  return typeof jid === "string" && jid.endsWith("@lid");
}

/**
 * Resolve o TELEFONE REAL do remetente.
 *
 * No WhatsApp com endereçamento por LID, `key.remoteJid` vem como "<id>@lid" —
 * um identificador interno, NÃO o telefone. O número real é entregue pelo
 * servidor em `key.senderPn` ("sender phone number"). Sem isso, gravávamos o
 * LID no lugar do telefone (bug da F1).
 *
 * Retorna { phone, resolved }:
 *  - resolved=true  → telefone real (de senderPn ou de um remoteJid não-LID)
 *  - resolved=false → só temos o LID; telefone não é derivável.
 */
function resolveSenderPhone(key) {
  if (key?.senderPn) return { phone: jidToPhone(key.senderPn), resolved: true };
  if (key?.remoteJid && !isLidJid(key.remoteJid)) {
    return { phone: jidToPhone(key.remoteJid), resolved: true };
  }
  return { phone: jidToPhone(key?.remoteJid), resolved: false };
}

function tsToMs(messageTimestamp) {
  if (typeof messageTimestamp === "number") return messageTimestamp * 1000;
  if (messageTimestamp?.toNumber) return messageTimestamp.toNumber() * 1000;
  return Date.now();
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    markOnlineOnConnect: false, // não fica "online" no lugar da secretária
  });

  sock.ev.on("creds.update", saveCreds);

  // Pareamento por CÓDIGO (mais confiável que QR em terminal headless).
  // Defina PAIRING_NUMBER com o número novo (só dígitos, ex: 5511999999999).
  const pairingNumber = process.env.PAIRING_NUMBER?.replace(/\D/g, "");
  if (pairingNumber && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(pairingNumber);
        console.log(
          `\n[whatsapp] CÓDIGO DE PAREAMENTO: ${code}\n` +
            "  No celular do número novo: WhatsApp → Aparelhos conectados →\n" +
            "  Conectar um aparelho → Conectar com número de telefone → digite o código.\n",
        );
      } catch (e) {
        console.error("[whatsapp] falha ao gerar código de pareamento:", e.message);
      }
    }, 3000);
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    // QR só é usado se PAIRING_NUMBER não estiver definido (fallback).
    if (qr && !pairingNumber) {
      console.log("\n[whatsapp] Escaneie o QR com o WhatsApp do NÚMERO NOVO:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("[whatsapp] Conectado ✓ — escutando novas conversas (somente leitura).");
    }

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      if (loggedOut) {
        console.log("[whatsapp] Deslogado. Apague a pasta da sessão e reescaneie o QR.");
      } else {
        console.log(`[whatsapp] Conexão caiu (code=${code}). Reconectando...`);
        start();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return; // só mensagens novas em tempo real

    for (const msg of messages) {
      if (msg.key.fromMe) continue; // ignora o que a secretária envia
      const jid = msg.key.remoteJid || "";
      if (jid.endsWith("@g.us") || jid === "status@broadcast") continue; // ignora grupos/status

      const { phone, resolved } = resolveSenderPhone(msg.key);
      if (!phone) continue;
      if (!resolved) {
        // Só temos o LID (sem senderPn) — não dá pra atribuir o telefone real.
        // Não gravamos um LID mascarado de telefone; registramos e seguimos.
        console.warn(
          `[whatsapp] telefone não-resolúvel (só LID=${jid}, pushName=${msg.pushName || "?"}). Lead ignorado.`,
        );
        continue;
      }

      try {
        await upsertLead({
          phone,
          name: msg.pushName || null,
          firstMessage: extractText(msg.message),
          ts: tsToMs(msg.messageTimestamp),
        });
      } catch (e) {
        console.error("[supabase] erro ao gravar lead:", e.message);
      }
    }
  });
}

start().catch((e) => {
  console.error("[fatal]", e);
  process.exit(1);
});
