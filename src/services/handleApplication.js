import changeBlock from "./changeBlock";

export default async function handleApplication(userId, carId, action) {
    await changeBlock()
    let formData = new FormData();
    formData.append("userId", userId);
    formData.append("carId", carId);
    if (action === "update") {
        const res = await fetch("./backend/handleApplication.php", {
            method: "POST",
            body: formData,
        });
        const data = await res.text();
        return data
    }
    else if (action === "remove") {
        const res = await fetch("./backend/removeReservation.php", {
            method: "POST",
            body: formData,
        });
        const data = await res.text();
        return data
    }
    else if (action === "delete") {
        const res = await fetch("./backend/destroyReservation.php", {
            method: "POST",
            body: formData,
        });
        const data = await res.text();
        return data
    }
}