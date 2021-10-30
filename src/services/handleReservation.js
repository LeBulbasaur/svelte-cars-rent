import checkId from "./checkId"

export default async function handleReservation(carId, username, startTime, endTime) {
    const userId = await checkId(username)
    let formData = new FormData();
    formData.append("carId", carId);
    formData.append("userId", userId);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    const res = await fetch("./backend/handleReservation.php", {
        method: "POST",
        body: formData,
    });
    const data = await res.text();
    return data
}