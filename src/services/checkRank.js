export default async function checkRank(username) {
    let formData = new FormData();
    formData.append("username", username);
    const res = await fetch("./backend/checkRank.php", {
        method: "POST",
        body: formData,
    });
    const data = await res.text();
    return data;
}