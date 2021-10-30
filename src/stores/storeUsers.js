import { writable } from "svelte/store";

export let storeUsers = writable([])

async function load() {
    const res = await fetch("./backend/getUsers.php", {
        method: "GET"
    })
    const data = await res.json()
    storeUsers.set(data)
}

load()