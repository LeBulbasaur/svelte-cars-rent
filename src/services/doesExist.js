export default async function doesExist(username) {
    let formData = new FormData();
    formData.append("username", username);
    const res = await fetch("./backend/doesExist.php", {
        method: "POST",
        body: formData,
    });
    const data = await res.text();
    return data ? true : false;
}