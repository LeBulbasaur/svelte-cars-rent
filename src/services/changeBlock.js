import getReservations from "./getReservations"
const setBlocked = async (value, userId) => {
    let formData = new FormData();
    formData.append("block", value);
    formData.append("userId", userId);
    const res = await fetch("./backend/changeBlock.php", {
        method: "POST",
        body: formData,
    });
}
export default async function changeBlock() {
    const reservations = await getReservations()
    const blockArray = []
    for (const reservation of reservations) {
        await setBlocked("0", reservation.userId)
        const end = new Date(reservation.rent_end)
        const curr = new Date(reservation.current_time)
        if (curr > end) {
            blockArray.push(reservation.userId)
        }
    }
    for (const user of blockArray) {
        await setBlocked("1", user)
    }
}