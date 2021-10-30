<script>
    import getReservations from "../services/getReservations";
    import handleApplication from "../services/handleApplication";
    import changeTime from "../services/changeTime";
    import Swal from "sweetalert2";

    window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth",
    });

    let reservationData;
    const handleData = async () => {
        const res = await getReservations();
        const data = await res.sort((a, b) =>
            a.carName.localeCompare(b.carName)
        );
        return data;
    };
    reservationData = handleData();
    const changeApplicationStatus = async (userId, carId) => {
        const res = await handleApplication(userId, carId, "update");
        const data = await res;
        if (data === "added") window.location.reload();
    };

    const undoReservation = async (userId, carId) => {
        const res = await handleApplication(userId, carId, "remove");
        const data = await res;
        if (data === "removed") window.location.reload();
    };
    const refuseReservation = async (userId, carId) => {
        const res = await handleApplication(userId, carId, "delete");
        const data = await res;
        if (data === "deleted") window.location.reload();
    };

    const shortenRent = async (time, startDate, endDate, resId) => {
        let start = new Date(startDate);
        let modifiedDate = new Date(endDate);
        modifiedDate.setDate(modifiedDate.getDate() + time);
        if (modifiedDate < start) {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: "error",
                title: "The number of days cannot be reduced!",
            });
            return;
        }
        const res = await changeTime(
            resId,
            modifiedDate.toISOString().split("T")[0]
        );
        if (res === "changed") {
            reservationData = handleData();
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
                <th class="py-4">Username 😎</th>
                <th class="py-4">Car 🏎️</th>
                <th class="py-4">Rent Time 📅</th>
                <th class="py-4 flex flex-col items-center">
                    <p>Modify Time</p>
                    <p>(± days) ✂️</p>
                </th>
                {#each items as reservation}
                    <tr>
                        <td class="border-b-2 border-nord0 py-4">
                            <p class="flex justify-center items-center">
                                {reservation.userName}
                            </p>
                        </td>
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
                            <div class="flex justify-center items-center">
                                {#if reservation.status === "1"}
                                    <button
                                        class="text-white mx-1 bg-green-500 flex justify-center border-0 px-2 focus:outline-none hover:bg-green-600 rounded sm:text-md text-sm"
                                        on:click={() =>
                                            shortenRent(
                                                1,
                                                reservation.rent_start,
                                                reservation.rent_end,
                                                reservation.id
                                            )}
                                    >
                                        +
                                    </button>
                                    <button
                                        class="text-white mx-1 bg-red-500 flex justify-center border-0 px-2 focus:outline-none hover:bg-red-600 rounded sm:text-md text-sm"
                                        on:click={() =>
                                            shortenRent(
                                                -1,
                                                reservation.rent_start,
                                                reservation.rent_end,
                                                reservation.id
                                            )}
                                    >
                                        -
                                    </button>
                                {:else}
                                    <p class="italic">pending</p>
                                {/if}
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
                                                reservation.carId
                                            )}
                                    >
                                        Accept
                                    </button>
                                {:else}
                                    <button
                                        class="text-white bg-nord11 flex justify-center border-0 py-1 w-2/3 px-2 focus:outline-none rounded sm:text-md text-sm"
                                        on:click={() =>
                                            undoReservation(
                                                reservation.userId,
                                                reservation.carId
                                            )}
                                    >
                                        Undo
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
                                            reservation.carId
                                        )}
                                >
                                    Cancel
                                </button>
                            </p>
                        </td>
                    </tr>
                {/each}
            </table>
        {/if}
    {/await}
</main>
