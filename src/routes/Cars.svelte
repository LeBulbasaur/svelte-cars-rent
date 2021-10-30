<script>
    import Car from "../components/Car.svelte";
    import { storeCars } from "../stores/storeCars";

    let filteredCars;
    let dropdown = false;

    window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth",
    });

    const getOptions = async () => {
        const marks = new Set(
            await $storeCars.map((car) => {
                return car.mark;
            })
        );
        const years = new Set(
            await $storeCars.map((car) => {
                return car.prod_year;
            })
        );
        const fuels = new Set(
            await $storeCars.map((car) => {
                return car.fuel;
            })
        );
        const colors = new Set(
            await $storeCars.map((car) => {
                return car.color;
            })
        );
        return [
            { category: "Mark", items: Array.from(marks).sort() },
            { category: "Production", items: Array.from(years).sort() },
            { category: "Fuel", items: Array.from(fuels).sort() },
            { category: "Colors", items: Array.from(colors) },
        ];
    };

    const showMenu = async () => {
        dropdown = !dropdown;
    };

    const submitFilter = async (e) => {
        e.preventDefault();
        const mark = e.target["mark"].value;
        const prodYear = e.target["production"].value;
        const fuel = e.target["fuel"].value;
        const color = e.target["colors"].value;
        filteredCars = await $storeCars;
        filteredCars = filteredCars.filter((car) => {
            if (mark === "all") return car;
            if (car.mark === mark) return car;
        });
        filteredCars = filteredCars.filter((car) => {
            if (prodYear === "all") return car;
            if (car.prod_year === prodYear) return car;
        });
        filteredCars = filteredCars.filter((car) => {
            if (fuel === "all") return car;
            if (car.fuel === fuel) return car;
        });
        filteredCars = filteredCars.filter((car) => {
            if (color === "all") return car;
            if (car.color === color) return car;
        });
    };
</script>

<main>
    <div class="mt-10 text-nord6 w-full flex-col select-none">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 ml-auto mr-10 cursor-pointer transition-all hover:h-8 hover:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            on:click={showMenu}
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
        </svg>
        {#if dropdown}
            <form
                on:submit={submitFilter}
                class="grid md:grid-cols-5 grid-cols-3 gap-4 mx-4 mt-2"
            >
                {#await getOptions() then options}
                    {#each options as option}
                        <div class="flex flex-col w-full">
                            <label
                                for={option.category.toLowerCase()}
                                class="text-sm">{option.category}:</label
                            >
                            {#if option.category !== "Price"}
                                <select
                                    name={option.category.toLowerCase()}
                                    class="h-10 px-3 pr-6 text-justify text-nord6 outline-none border-none rounded-lg bg-nord0 focus:shadow-outline"
                                >
                                    <option
                                        value="all"
                                        class="flex items-center justify-center"
                                        >All</option
                                    >
                                    {#each option.items as value}
                                        <option
                                            {value}
                                            class="flex items-center justify-center"
                                            >{value}</option
                                        >
                                    {/each}
                                </select>
                            {/if}
                        </div>
                    {/each}
                {/await}
                <div class="w-full flex items-center">
                    <button
                        class="text-white mt-4 h-1/2 w-full bg-indigo-500 border-0 focus:outline-none hover:bg-indigo-600 rounded text-md"
                        >Filter
                    </button>
                </div>
            </form>
        {/if}
    </div>
    {#await $storeCars}
        <h1>Waiting for cars to load...</h1>
    {:then}
        {#if $storeCars.length === 0}
            <div class="flex flex-col justify-center items-center">
                <h1 class="text-nord6 text-4xl bold mt-10">
                    No vehicle available!
                </h1>
                <h1 class="text-nord6 text-2xl bold mt-10">Check later 🦧</h1>
            </div>
        {:else if !filteredCars}
            <div
                class="w-full p-4 text-nord6 grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4"
            >
                {#each $storeCars as car}
                    {#if car.in_use === "0"}
                        <Car {car} />
                    {/if}
                {/each}
            </div>
        {:else if filteredCars.length === 0}
            <div class="flex flex-col justify-center items-center">
                <h1 class="text-nord6 text-4xl bold mt-10">
                    No vehicle available!
                </h1>
                <h1 class="text-nord6 text-2xl bold mt-10">
                    Unfortunately, you have to change your desires 🐒
                </h1>
            </div>
        {:else}
            <div
                class="w-full p-4 text-nord6 grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4"
            >
                {#each filteredCars as car}
                    {#if car.in_use === "0"}
                        <Car {car} />
                    {/if}
                {/each}
            </div>
        {/if}
    {/await}
</main>
