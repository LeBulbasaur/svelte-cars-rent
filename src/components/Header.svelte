<script>
    import checkRank from "../services/checkRank";
    import getSession from "../services/getSession";

    const logoutUser = async () => {
        await getSession("logoutUser");
        window.location.href = "./";
    };

    let headerLinks = [];

    let logged;
    const setHeader = async () => {
        logged = await getSession("getUser");
        if (logged === "") headerLinks = ["Cars"];
        switch (await checkRank(logged)) {
            case "administrator":
                headerLinks = ["Users", "Cars", "Reservations", "Applications"];
                break;
            case "moderator":
                headerLinks = ["Users", "Cars", "Reservations", "Applications"];
                break;
            case "client":
                headerLinks = ["Cars", "Reservations"];
                break;
        }
    };
    setHeader();
</script>

<main>
    <header class="text-gray-600 bg-nord1 body-font">
        <div
            class="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center"
        >
            <a
                class="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0"
                href="./"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    class="w-10 h-10 text-white p-2 bg-indigo-500 rounded-full"
                    viewBox="0 0 24 24"
                >
                    <path
                        d="M23.5 7c.276 0 .5.224.5.5v.511c0 .793-.926.989-1.616.989l-1.086-2h2.202zm-1.441 3.506c.639 1.186.946 2.252.946 3.666 0 1.37-.397 2.533-1.005 3.981v1.847c0 .552-.448 1-1 1h-1.5c-.552 0-1-.448-1-1v-1h-13v1c0 .552-.448 1-1 1h-1.5c-.552 0-1-.448-1-1v-1.847c-.608-1.448-1.005-2.611-1.005-3.981 0-1.414.307-2.48.946-3.666.829-1.537 1.851-3.453 2.93-5.252.828-1.382 1.262-1.707 2.278-1.889 1.532-.275 2.918-.365 4.851-.365s3.319.09 4.851.365c1.016.182 1.45.507 2.278 1.889 1.079 1.799 2.101 3.715 2.93 5.252zm-16.059 2.994c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5zm10 1c0-.276-.224-.5-.5-.5h-7c-.276 0-.5.224-.5.5s.224.5.5.5h7c.276 0 .5-.224.5-.5zm2.941-5.527s-.74-1.826-1.631-3.142c-.202-.298-.515-.502-.869-.566-1.511-.272-2.835-.359-4.441-.359s-2.93.087-4.441.359c-.354.063-.667.267-.869.566-.891 1.315-1.631 3.142-1.631 3.142 1.64.313 4.309.497 6.941.497s5.301-.184 6.941-.497zm2.059 4.527c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5zm-18.298-6.5h-2.202c-.276 0-.5.224-.5.5v.511c0 .793.926.989 1.616.989l1.086-2z"
                    />
                </svg>
                <span class="ml-3 text-xl">McQueen Cars</span>
            </a>
            <nav
                class="md:ml-auto flex flex-wrap items-center text-base justify-center"
            >
                {#each headerLinks as link}
                    <a class="mr-5 hover:text-gray-900" href=".#/{link}"
                        >{link}</a
                    >
                {/each}
            </nav>
            {#if logged === ""}
                <button
                    class="inline-flex items-center bg-indigo-500 border-0 py-1 px-3 focus:outline-none hover:bg-indigo-400 rounded text-base mt-4 md:mt-0"
                >
                    <a href="#/login">Login </a>
                    <svg
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        class="w-4 h-4 ml-1"
                        viewBox="0 0 24 24"
                    >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            {:else}
                <button
                    class="inline-flex items-center bg-nord11 border-0 py-1 px-3 focus:outline-none rounded text-base mt-4 md:mt-0"
                    on:click={logoutUser}
                >
                    <p>Logout</p>
                </button>
            {/if}
        </div>
    </header>
</main>

<style>
    a {
        color: #e5e9f0;
    }
    p {
        color: #e5e9f0;
    }
    main {
        position: fixed;
        top: 0;
        width: 100vw;
    }
</style>
