export default async function getSession(action, username) {
    let formData = new FormData();
    formData.append("action", action);
    formData.append("username", username);
    const res = await fetch("./backend/setSession.php", {
        method: "POST",
        body: formData,
    });
    const data = await res.text();
    return data
}