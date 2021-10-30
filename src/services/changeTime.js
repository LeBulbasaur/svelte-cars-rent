export default async function doesExist(id, newTime) {
    let formData = new FormData();
    formData.append("id", id);
    formData.append("newTime", newTime);
    const res = await fetch("./backend/changeTime.php", {
        method: "POST",
        body: formData,
    });
    const data = await res.text();
    return data;
}