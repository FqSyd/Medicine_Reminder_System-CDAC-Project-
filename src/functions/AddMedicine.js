const { app } = require("@azure/functions");
const { BlobServiceClient } = require("@azure/storage-blob");
const nodemailer = require("nodemailer");

app.http("addmedicine", {
    methods: ["POST"],
    authLevel: "anonymous",

    handler: async (req) => {
        const data = await req.json();

        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        const container = blobServiceClient.getContainerClient("prescriptions");
        const blob = container.getBlockBlobClient("medicines.json");

        let medicines = [];

        try {
            const download = await blob.download();
            const text = await streamToString(download.readableStreamBody);
            medicines = text ? JSON.parse(text) : [];
        } catch {
            medicines = [];
        }

        // Initializing structural tracking parameters
        const newEntry = {
            id: medicines.length ? medicines[medicines.length - 1].id + 1 : 1,
            ...data,
            lastTimeReminderDate: "",
            lastExpiryReminderDate: "",
            lastExpiredTodayDate: ""
        };

        medicines.push(newEntry);

        await blob.uploadData(
            Buffer.from(JSON.stringify(medicines, null, 2)),
            { overwrite: true }
        );

        const mail = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        await mail.sendMail({
            from: process.env.GMAIL_USER,
            to: data.email,
            subject: "✅ Medicine Added",
            text: `Your medicine has been added successfully.\n\nMedicine: ${data.medicine}\nTime: ${data.time}\nExpiry Date: ${data.expiry_date}\n\nYou will receive reminders automatically.`
        });

        return {
            status: 200,
            jsonBody: {
                success: true,
                message: "Medicine added successfully"
            }
        };
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