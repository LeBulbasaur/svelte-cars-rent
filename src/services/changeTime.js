import changeBlock from "./changeBlock";

export default async function doesExist(id, newTimeStart, newTimeEnd, currentTime) {
    let formData = new FormData();
    formData.append("id", id);
    formData.append("newTimeStart", newTimeStart);
    formData.append("newTimeEnd", newTimeEnd);
    formData.append("currentTime", currentTime);
    const res = await fetch("./backend/changeTime.php", {
        method: "POST",
        body: formData,
    });
    await changeBlock()
    const data = await res.text();
    return data;
}