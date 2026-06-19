💊 Smart Medicine Reminder & Expiry Tracker System (Project Summary)

An automated, serverless healthcare solution designed to help patients manage daily medication timings and prevent the accidental consumption of expired drugs. 

---

⚡ The Project Gist
Instead of manually checking pill bottles, a patient registers their medicine details once through a modern web app portal. The system takes over completely:
* Sends a **Medicine Intake Reminder** email exactly at the user's scheduled time (e.g., 7:30 PM).
* Sends a **Warning Email at 9:00 AM exactly 1 day prior to expiration**.
* Sends a **Final Alert at 9:00 AM on the day of expiration** warning the user to discard the medicine.

All email notifications are engineered with **Date-Stamping Locks**, meaning they fire exactly **once**—guaranteeing **zero spam** even though the backend checks parameters continuously.

---

## ☁️ The Azure Cloud Infrastructure Components

The entire project is hosted on Microsoft Azure using a completely decoupled, serverless microservices architecture to eliminate hosting costs and maintenance overhead:

1. **Azure Blob Storage (`medicines.json`):** Serves as our lightweight, zero-maintenance database. It stores the medicine arrays and updates live tracking flags dynamically.
2. **Azure Functions (Node.js v4 Runtime model):**
   * `AddMedicine` (HTTP Trigger): An API endpoint that receives data from the webpage frontend and appends new medicine records cleanly into Blob Storage.
   * `CheckMedicineReminders` (Timer Trigger): A background cron-job service that runs automatically every minute to monitor scheduling conditions, calculate expiration day intervals, and dispatch alerts.
3. **Application Configuration (`WEBSITE_TIME_ZONE`):** Explicitly mapped to `India Standard Time` within Azure App Settings to keep cloud calculations in sync with the user's local clock.
4. **Gmail SMTP & Nodemailer Relay:** Secured cloud-to-email transit channel used to safely execute the delivery of reminders into patient inboxes.

---

## 💡 Engineering Blueprint: Why Node.js Instead of Python?

While Python is a traditional choice for backend scripts, **Node.js was intentionally selected due to platform availability constraints within the Azure Free Trial tier:**

* **The Serverless Constraint:** To keep operational costs at absolute zero, the project needed to run on an Azure **Serverless Consumption Plan**.
* **Free Trial Plan Limits:** Under the active Azure Free Trial template, the serverless consumption engine restricted runtime environments strictly to **Node.js** and **Java**—completely omitting Python from the free consumption workspace tier.
* **The Asynchronous Benefit:** Shifting to Node.js turned into a major performance advantage. Node’s asynchronous, non-blocking I/O model handles reading/writing data streams from Azure Blob Storage and firing network requests via `nodemailer` concurrently, resulting in faster execution speeds and lower memory consumption.

---

## 🛠️ Tech Stack At A Glance
* **Frontend:** HTML5, CSS3 (Glassmorphism design layout), Vanilla JavaScript.
* **Backend:** Node.js, Azure Functions (v4 Programming Model).
* **Cloud Storage:** Azure Blob Storage.
* **Communications:** Nodemailer + Gmail SMTP Engine.
