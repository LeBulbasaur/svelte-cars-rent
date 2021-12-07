<script>
    import getReservations from "../services/getReservations";
    import handleApplication from "../services/handleApplication";
    import getSession from "../services/getSession";
    import changeTime from "../services/changeTime";

    window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth",
    });

    const handleData = async () => {
        const user = await getSession("getUser");
        const res = await getReservations();
        const data = await res
            .filter((reservation) => {
                let isHeld = false;
                const current = new Date(reservation.current_time);
                const end = new Date(reservation.rent_end);
                if (current > end) isHeld = true;
                if (reservation.userName === user) {
                    reservation.isHeld = isHeld;
                    return reservation;
                }
            })
            .sort((a, b) => b.status.localeCompare(a.status));
        return data;
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
        const res = await handleApplication(userId, carId, "delete");
        const data = await res;
        if (data === "deleted") window.location.reload();
    };
</script>

<main class="mt-10 text-nord6 flex justify-center select-none">
    {#await handleData()}
        <h1>Waiting...</h1>
    {:then items}
        {#if items.length === 0}
            <div class="flex flex-col justify-center items-center">
                <h1 class="text-nord6 text-4xl bold mt-10">
                    No vehicles booked!
                </h1>
                <h1 class="text-nord6 text-2xl bold mt-10">
                    Rent a car now 👻
                </h1>
            </div>
        {:else}
            <table class="w-3/4">
                <th class="py-4">Car 🏎️</th>
                <th class="py-4">Rent Time 📅 </th>
                <th class="py-4">Status ⌛</th>
                {#each items as reservation}
                    <tr>
                        <td class="border-b-2 border-nord0 py-4">
                            <p class="flex justify-center items-center">
                                {reservation.carName}
                            </p>
                        </td>
                        <td class="border-b-2 border-nord0 py-4">
                            <p class="flex justify-center items-center">
                                {reservation.rent_start} / {reservation.rent_end}
                            </p>
                        </td>
                        <td class="border-b-2 border-nord0 py-4">
                            {#if reservation.status === "0"}
                                <p
                                    class="flex justify-center items-center text-nord13"
                                >
                                    pending
                                </p>
                            {:else if reservation.isHeld}
                                <p
                                    class="flex justify-center items-center text-nord11"
                                >
                                    expired
                                </p>
                                <p
                                    class="flex justify-center items-center text-nord5 cursor-pointer hover:underline"
                                    onclick="window.open(
                                        'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={reservation.userName}{reservation.carName}{reservation.id}',
                                        'targetWindow', 'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=550px, height=550px, top=25px left=120px'); return false;"
                                >
                                    get QR Code
                                </p>
                            {:else}
                                <p
                                    class="flex justify-center items-center text-nord14"
                                >
                                    active
                                </p>
                                <p
                                    class="flex justify-center items-center text-nord5 cursor-pointer hover:underline"
                                    onclick="window.open(
                                        'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={reservation.userName}{reservation.carName}{reservation.id}',
                                        'targetWindow', 'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=550px, height=550px, top=25px left=120px'); return false;"
                                >
                                    get QR Code
                                </p>
                            {/if}
                        </td>
                        <td class="border-b-2 border-nord0 py-4">
                            <p class="flex justify-center items-center">
                                <button
                                    class="text-white bg-nord11 border-0 flex justify-center py-1 w-2/3 px-2 focus:outline-none rounded sm:text-md text-sm"
                                    on:click={() =>
                                        undoReservation(
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
</main>
