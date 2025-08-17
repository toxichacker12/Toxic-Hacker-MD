const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info")
    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) {
                startBot()
            } else {
                console.log("Logged out. Please re-scan the QR.")
            }
        } else if (connection === "open") {
            console.log("✅ Bot is now connected!")
        }
    })

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0]
        if (!msg.message) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text

        if (text) {
            console.log("📩 New message:", text)

            if (text.toLowerCase() === "ping") {
                await sock.sendMessage(from, { text: "pong 🏓" })
            } else if (text.toLowerCase() === "menu") {
                await sock.sendMessage(from, { text: "✨ Toxic Hacker MD Bot Menu ✨\n\n1. ping\n2. menu\n3. help" })
            }
        }
    })
}

startBot()
