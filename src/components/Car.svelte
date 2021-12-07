<script>
    import getSession from "../services/getSession";
    import checkId from "../services/checkId";
    import getReservations from "../services/getReservations";
    import handleReservation from "../services/handleReservation";
    import Swal from "sweetalert2";
    export let car;
    let date = new Date();
    let isReservated = false;
    let queue = 0;
    let buttonText = "Rent";

    const checkReservation = async () => {
        const userId = await checkId(await getSession("getUser"));
        const res = await getReservations();
        await res.forEach((reservation) => {
            if (reservation.carId === car.id) {
                queue++;
            }
            if (userId.blocked === "1") {
                isReservated = true;
                buttonText = "Blocked";
            }
            if (
                reservation.userId === userId.id &&
                reservation.carId === car.id
            ) {
                isReservated = true;
                buttonText = "Pending";
            }
        });
    };
    checkReservation();

    let startDate = date.toISOString().split("T")[0];
    let endDate = date.toISOString().split("T")[0];
    let daysCount = 1;

    const countDays = (start, end) => {
        const date1 = new Date(start);
        const date2 = new Date(end);
        const difference = (date2 - date1) / (1000 * 3600 * 24) + 1;
        const differenceNow = (date1 - date) / (1000 * 3600 * 24) + 1;
        if (difference <= 0 || differenceNow < 0) {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({
                icon: "error",
                title: "Please choose correct dates!",
            });
        } else {
            daysCount = difference;
        }
    };
    const submitRent = async (e) => {
        e.preventDefault();
        const startDate = e.target["start-date"].value;
        const endDate = e.target["end-date"].value;
        const differenceNow =
            (new Date(startDate) - date) / (1000 * 3600 * 24) + 1;
        if (startDate > endDate || differenceNow < 0) {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: "error",
                title: "Please choose correct dates!",
            });
            return;
        }
        if ((await getSession("getUser")) === "") {
            window.location.href = ".#/login";
            return;
        }
        const reservate = await handleReservation(
            car.id,
            await getSession("getUser"),
            startDate,
            endDate
        );

        if (reservate === "added") {
            buttonText = "Pending";
            isReservated = true;
            queue = 0;
            await checkReservation();
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: "success",
                title: "Car has been reservated!",
            });
        } else {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: "error",
                title: "An error occurred while reservating car!",
            });
        }
    };
</script>

<main>
    <div class="p-4 bg-nord0 rounded-lg">
        <a class="block h-48 rounded-lg overflow-hidden">
            <img
                alt="ecommerce"
                class="object-cover object-center w-full h-full block"
                src="img/cars/{car.image}"
            />
        </a>
        <div class="mt-4">
            <h3 class="text-nord15 tracking-widest title-font mb-1">
                {car.mark}
            </h3>
            <h2 class="text-white text-small title-font text-lg font-medium">
                {car.model}
            </h2>
            <p class="mt-1 flex text-xs justify-between">
                <span>Production Year:</span>
                {car.prod_year}
            </p>
            <p class="mt-1 flex text-xs justify-between">
                <span>Mileage:</span>
                {car.mileage} km
            </p>
            <p class="mt-1 flex text-xs justify-between">
                <span>Fuel:</span>
                {car.fuel}
            </p>
            <p class="mt-1 flex text-xs justify-between">
                <span>Color:</span>
                {car.color}
            </p>
            <p class="mt-1 flex text-xs justify-between">
                <span>Rent price:</span>
                {car.price * daysCount} zł
            </p>
            <form
                class="mt-5 flex flex-col text-white text-medium"
                on:submit={submitRent}
            >
                <div class="flex justify-between flex-wrap">
                    <div class="flex-col mb-2">
                        <label for="start-date" class="text-xs">From:</label>
                        <input
                            on:change={(e) => {
                                startDate = e.target.value;
                                countDays(startDate, endDate);
                            }}
                            type="date"
                            value={startDate}
                            name="start-date"
                            class="outline-none text-xs select-none border-none rounded-lg px-2 bg-nord3 focus:shadow-outline"
                        />
                    </div>
                    <div class="flex-col ">
                        <label for="end-date" class="text-xs">To:</label>
                        <input
                            on:change={(e) => {
                                endDate = e.target.value;
                                countDays(startDate, endDate);
                            }}
                            type="date"
                            value={endDate}
                            name="end-date"
                            class="text-xs outline-none select-none border-none rounded-lg px-2 bg-nord3 focus:shadow-outline"
                        />
                    </div>
                </div>
                <input
                    type="submit"
                    value={buttonText}
                    class:active={!isReservated}
                    class:inactive={isReservated}
                    disabled={isReservated}
                />
            </form>
            <p class="mt-1 flex text-xs justify-end italic">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#EBCB8B"
                    class="mx-1"
                    ><path
                        d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"
                    /></svg
                >
                {queue}
            </p>
        </div>
    </div>
</main>

<style>
    .active {
        display: flex;
        justify-content: center;
        cursor: pointer;
        align-items: center;
        margin-top: 1rem;
        background-color: rgba(99, 102, 241);
        border-width: 0px;
        width: 50%;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        margin-left: auto;
        margin-right: auto;
    }
    .inactive {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 1rem;
        background-color: #9ca3af;
        border-width: 0px;
        width: 50%;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        margin-left: auto;
        margin-right: auto;
    }
</style>
