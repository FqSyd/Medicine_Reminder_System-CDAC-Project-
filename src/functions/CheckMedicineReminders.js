const { app } = require("@azure/functions");
const { BlobServiceClient } = require("@azure/storage-blob");
const nodemailer = require("nodemailer");

app.timer("checkMedicineReminders", {
    // ⏰ Runs every minute to check for precise time matches
    schedule: "0 * * * * *",

    handler: async () => {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        const container = blobServiceClient.getContainerClient("prescriptions");
        const blob = container.getBlobClient("medicines.json");

        let medicines = [];

        try {
            const download = await blob.download();
            const text = await streamToString(download.readableStreamBody);
            medicines = text ? JSON.parse(text) : [];
        } catch (error) {
            console.error("Error reading from blob storage:", error);
            return;
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        // Formats current time to 24-hour HH:MM format (matching app.js output)
        const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const mail = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        let hasUpdates = false;

        for (let m of medicines) {
            if (!m.email) continue;

            // ⏰ 1. SPECIFIC TIME REMINDER (Triggers daily at the user-defined input time)
            if (m.time === currentHHMM && m.lastTimeReminderDate !== todayStr) {
                try {
                    await mail.sendMail({
                        from: process.env.GMAIL_USER,
                        to: m.email,
                        subject: "💊 Medicine Reminder",
                        text: `Hi ${m.patient_name || 'Patient'},\n\nIt is time to take your medicine:\n\nMedicine: ${m.medicine}\nDosage: ${m.dosage}\nScheduled Time: ${m.time}`
                    });
                    m.lastTimeReminderDate = todayStr; // Locks execution for the rest of today
                    hasUpdates = true;
                } catch (err) {
                    console.error("Failed to send scheduled medicine reminder:", err);
                }
            }

            // Expiry Date Calculations
            if (!m.expiry_date) continue;
            
            // Safe local date formatting logic
            const [year, month, day] = m.expiry_date.split('-');
            const exp = new Date(year, month - 1, day);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            exp.setHours(0, 0, 0, 0);

            const diffDays = Math.round((exp - today) / (1000 * 60 * 60 * 24));

            // 🔒 MORNING EXPRY WINDOW: Only checks when the clock reads exactly 9:00 AM
            if (now.getHours() === 9 && now.getMinutes() === 0) {
                
                // 🟡 2. EXPIRING TOMORROW (Sent exactly 1 day prior)
                if (diffDays === 1 && m.lastExpiryReminderDate !== todayStr) {
                    try {
                        await mail.sendMail({
                            from: process.env.GMAIL_USER,
                            to: m.email,
                            subject: "⚠️ Medicine Expiring Tomorrow",
                            text: `Warning: Your medicine (${m.medicine}) will expire tomorrow. Please arrange a replacement.`
                        });
                        m.lastExpiryReminderDate = todayStr; // Locks alert for today
                        hasUpdates = true;
                    } catch (err) {
                        console.error("Failed to send expiry warning:", err);
                    }
                }

                // 🔴 3. EXPIRED TODAY (Sent exactly on the expiration calendar day)
                if (diffDays === 0 && m.lastExpiredTodayDate !== todayStr) {
                    try {
                        await mail.sendMail({
                            from: process.env.GMAIL_USER,
                            to: m.email,
                            subject: "❌ Medicine Expired Today",
                            text: `Alert: Your medicine (${m.medicine}) has expired today. Do not consume it.`
                        });
                        m.lastExpiredTodayDate = todayStr; // Locks alert for today
                        hasUpdates = true;
                    } catch (err) {
                        console.error("Failed to send expired alert:", err);
                    }
                }
            }
        }

        // Saves only if tracking strings were changed to limit storage writes
        if (hasUpdates) {
            await blob.uploadData(
                Buffer.from(JSON.stringify(medicines, null, 2)),
                { overwrite: true }
            );
        }
    }
});

async function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", d => chunks.push(d.toString()));
        stream.on("end", () => resolve(chunks.join("")));
        stream.on("error", reject);
    });
}