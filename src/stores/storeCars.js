import { writable } from "svelte/store";

export let storeCars = writable([])

async function load() {
    const res = await fetch("./backend/getCars.php", {
        method: "GET"
    })
    const data = await res.json()
    storeCars.set(data)
}

load()