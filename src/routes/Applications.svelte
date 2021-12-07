<script>
    import getReservations from "../services/getReservations";
    import handleApplication from "../services/handleApplication";
    import changeTime from "../services/changeTime";
    import getSession from "../services/getSession";
    import checkRank from "../services/checkRank";
    import Swal from "sweetalert2";

    window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth",
    });
    const checkIfClient = async () => {
        const logged = await getSession("getUser");
        if ((await checkRank(logged)) === "client") {
            return true;
        } else {
            return false;
        }
    };

    $: isHaram = checkIfClient();
    const handleData = async (filter) => {
        const res = await getReservations();
        if (filter === "users") {
            const data = await res.sort((a, b) =>
                a.userName.localeCompare(b.userName)
            );
            return data;
        } else {
            const data = await res.sort((a, b) =>
                a.carName.localeCompare(b.carName)
            );
            return data;
        }
    };
    let filter = localStorage.getItem("filter")
        ? localStorage.getItem("filter")
        : "cars";

    $: reservationData = handleData(filter);
    const changeApplicationStatus = async (userId, carId, resId) => {
        const d = new Date();
        const currentDate =
            d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
        const change = await changeTime(resId, currentDate, "none", "none");
        const res = await handleApplication(userId, carId, "update");
        const data = await res;
        if (data === "added") window.location.reload();
    };

    const undoReservation = async (userId, carId, resId) => {
        const d = new Date();
        const currentDate =
            d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
        const change = await changeTime(
            resId,
            currentDate,
            currentDate,
            currentDate
        );
        const res = await handleApplication(userId, carId, "remove");
        const data = await res;
        if (data === "removed") window.location.reload();
    };
    const refuseReservation = async (userId, carId, resId) => {
        const d = new Date();
        const currentDate =
            d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
        const change = await changeTime(
            resId,
            currentDate,
            currentDate,
            currentDate
        );
        const res = await handleApplication(userId, carId, "delete");
        const data = await res;
        if (data === "deleted") window.location.reload();
    };

    const modifyTime = async (startDate, endDate, currentDate, resId) => {
        let start = new Date(startDate);
        let end = new Date(endDate);
        if (end < start) {
            reservationData = handleData(filter);
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: "error",
                title: "Dates cannot be set!",
            });
            return;
        }
        const res = await changeTime(resId, startDate, endDate, currentDate);
        if (res === "changed") {
            reservationData = handleData(filter);
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: "success",
                title: "Time changed successfully",
            });
        } else {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: "error",
                title: "Something went wrong!",
            });
        }
    };
</script>

<main class="mt-10 text-nord6 flex justify-center select-none">
    {#await isHaram then haram}
        {#if !haram}
            {#await reservationData}
                <h1>Waiting...</h1>
            {:then items}
                {#if items.length === 0}
                    <div class="flex flex-col justify-center items-center">
                        <h1 class="text-nord6 text-4xl bold mt-10">
                            No vehicle requests!
                        </h1>
                        <h1 class="text-nord6 text-2xl bold mt-10">
                            Just wait for clients 🦍
                        </h1>
                    </div>
                {:else}
                    <table class="w-3/4">
                        <th class="py-4">
                            <span
                                on:click={() => {
                                    localStorage.setItem("filter", "users");
                                    reservationData = handleData(
                                        localStorage.getItem("filter")
                                    );
                                }}
                                class="cursor-pointer"
                            >
                                Username 😎
                            </span>
                        </th>
                        <th class="py-4">
                            <span
                                on:click={() => {
                                    localStorage.setItem("filter", "cars");
                                    reservationData = handleData(
                                        localStorage.getItem("filter")
                                    );
                                }}
                                class="cursor-pointer"
                            >
                                Car 🏎️
                            </span></th
                        >
                        <th class="py-4">Rent Time 📅</th>
                        <th class="py-4">Simulate Time 📅</th>
                        {#each items as reservation}
                            <tr>
                                <td class="border-b-2 border-nord0 py-4">
                                    <p class="flex justify-center items-center">
                                        {reservation.userName}
                                    </p>
                                </td>
                                <td class="border-b-2 border-nord0 py-4">
                                    <p
                                        class="flex justify-center items-center text-nord13 text-center"
                                    >
                                        {reservation.carName}
                                    </p>
                                </td>
                                <td class="border-b-2 border-nord0 py-4">
                                    <div
                                        class="flex justify-center items-center"
                                    >
                                        {#if reservation.status === "1"}
                                            <div class="flex flex-col">
                                                <div class="flex-col mb-2">
                                                    <label
                                                        for="start-date"
                                                        class="text-xs"
                                                        >From:</label
                                                    >
                                                    <input
                                                        on:change={(e) => {
                                                            modifyTime(
                                                                e.target.value,
                                                                reservation.rent_end,
                                                                reservation.current_time,
                                                                reservation.id,
                                                                reservation.userId
                                                            );
                                                        }}
                                                        type="date"
                                                        value={reservation.rent_start}
                                                        name="start-date"
                                                        class="outline-none text-xs select-none border-none rounded-lg px-2 bg-nord3 focus:shadow-outline"
                                                    />
                                                </div>
                                                <div class="flex-col ">
                                                    <label
                                                        for="end-date"
                                                        class="text-xs"
                                                        >To:</label
                                                    >
                                                    <input
                                                        on:change={(e) => {
                                                            modifyTime(
                                                                reservation.rent_start,
                                                                e.target.value,
                                                                reservation.current_time,
                                                                reservation.id,
                                                                reservation.userId
                                                            );
                                                        }}
                                                        type="date"
                                                        value={reservation.rent_end}
                                                        name="end-date"
                                                        class="text-xs outline-none select-none border-none rounded-lg px-2 bg-nord3 focus:shadow-outline"
                                                    />
                                                </div>
                                            </div>
                                        {:else}
                                            <p class="italic">pending</p>
                                        {/if}
                                    </div>
                                </td>
                                <td class="border-b-2 border-nord0 py-4">
                                    <div
                                        class="flex flex-col mb-2 justify-center items-center"
                                    >
                                        <div>
                                            <label
                                                for="start-date"
                                                class="text-xs"
                                                >Current Time:</label
                                            >
                                            <input
                                                on:change={(e) => {
                                                    modifyTime(
                                                        reservation.rent_start,
                                                        reservation.rent_end,
                                                        e.target.value,
                                                        reservation.id,
                                                        reservation.userId
                                                    );
                                                }}
                                                type="date"
                                                value={reservation.current_time}
                                                name="start-date"
                                                disabled={reservation.status ===
                                                    "0"}
                                                class="outline-none text-xs select-none border-none rounded-lg px-2 bg-nord3 focus:shadow-outline"
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td class="border-b-2 border-nord0 py-4">
                                    <p class="flex justify-center items-center">
                                        {#if reservation.status === "0"}
                                            <button
                                                class="text-white bg-green-500 flex justify-center border-0 py-1 w-2/3 px-2 focus:outline-none hover:bg-green-600 rounded sm:text-md text-sm"
                                                on:click={() =>
                                                    changeApplicationStatus(
                                                        reservation.userId,
                                                        reservation.carId,
                                                        reservation.id
                                                    )}
                                            >
                                                ✔️
                                            </button>
                                        {:else}
                                            <button
                                                class="text-white bg-nord8 flex justify-center border-0 py-1 w-2/3 px-2 focus:outline-none rounded sm:text-md text-sm"
                                                on:click={() =>
                                                    undoReservation(
                                                        reservation.userId,
                                                        reservation.carId,
                                                        reservation.id
                                                    )}
                                            >
                                                ↩️
                                            </button>
                                        {/if}
                                    </p>
                                </td>
                                <td class="border-b-2 border-nord0 py-4">
                                    <p class="flex justify-center items-center">
                                        <button
                                            class="text-white bg-nord11 border-0 flex justify-center py-1 w-2/3 px-2 focus:outline-none rounded sm:text-md text-sm"
                                            on:click={() =>
                                                refuseReservation(
                                                    reservation.userId,
                                                    reservation.carId,
                                                    reservation.id
                                                )}
                                        >
                                            ❌
                                        </button>
                                    </p>
                                </td>
                            </tr>
                        {/each}
                    </table>
                {/if}
            {/await}
        {:else}
            <h1 class="text-nord6 text-4xl bold mt-10 px-10 text-center">
                You have reached the world's edge, none but devils play past
                here 👺
            </h1>
        {/if}
    {/await}
</main>
