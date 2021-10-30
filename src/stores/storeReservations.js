import { writable } from "svelte/store";

export let storeReservations = writable([])

async function load() {
    const res = await fetch("./backend/getReservations.php", {
        method: "GET"
    })
    const data = await res.json()
    storeReservations.set(data)
}

load()