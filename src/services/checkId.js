export default async function checkId(username) {
    let formData = new FormData();
    formData.append("username", username);
    const res = await fetch("./backend/checkId.php", {
        method: "POST",
        body: formData,
    });
    const data = await res.json();
    return data;
}