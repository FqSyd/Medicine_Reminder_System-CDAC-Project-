async function addMedicine() {
    const timeInput = document.getElementById("time").value; 
    const ampm = document.getElementById("ampm")?.value || "AM";

    if (!timeInput) {
        alert("Please select a time");
        return;
    }

    let [h, m] = timeInput.split(":");
    h = parseInt(h, 10);

    // Prevents mathematical duplication compounding if button is clicked repeatedly
    if (h < 12 && ampm === "PM") {
        h += 12;
    } else if (h === 12 && ampm === "AM") {
        h = 0;
    }

    // Standard padding generation
    const formattedTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    const data = {
        patient_name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        medicine: document.getElementById("medicine").value,
        dosage: document.getElementById("dosage").value,
        time: formattedTime,
        prescription_date: document.getElementById("prescription_date").value,
        expiry_date: document.getElementById("expiry_date").value
    };

    const loading = document.getElementById("loadingContainer");
    if (loading) loading.style.display = "block";

    try {
        const res = await fetch(
            "https://medicine-reminder-function-fq-evdhgwf5g9hcfgbj.centralindia-01.azurewebsites.net/api/addmedicine",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            }
        );

        const result = await res.json();
        alert(result.message);
    } catch (error) {
        console.error("Error adding medicine:", error);
        alert("Failed to save medicine reminder.");
    } finally {
        if (loading) loading.style.display = "none";
    }
}