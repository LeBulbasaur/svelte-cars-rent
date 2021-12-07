<script>
    import { storeUsers } from "../stores/storeUsers";
    import getSession from "../services/getSession";
    import checkRank from "../services/checkRank";
    import Swal from "sweetalert2";

    let logged;
    let currentUser;
    const checkIfClient = async () => {
        logged = await getSession("getUser");
        if ((await checkRank(logged)) === "client") {
            return true;
        } else {
            currentUser = await checkRank(logged);
            return false;
        }
    };
    const isHaram = checkIfClient();

    const changeData = async (username, e) => {
        let formData = new FormData();
        formData.append("username", username);
        formData.append("rank", e.value);
        try {
            const res = await fetch("./backend/changeRank.php", {
                method: "POST",
                body: formData,
            });
            const data = await res.text();
            if (data === "added") {
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });

                Toast.fire({
                    icon: "success",
                    title: "Rank changed successfully",
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
                    title: "Something went wrong!",
                });
            }
        } catch {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: "error",
                title: "Something went wrong!",
            });
        }
    };
</script>

<main class="mt-10 flex justify-center items-center">
    {#await isHaram then haram}
        {#if !haram}
            {#await $storeUsers}
                <h1 class="text-nord11">Waiting for data</h1>
            {:then}
                <table class="text-nord6 w-3/4">
                    <th class="py-4">Username</th>
                    <th class="py-4">Rank</th>
                    {#each $storeUsers as user}
                        <tr>
                            <td class="border-b-2 border-nord0 py-4">
                                <p class="flex justify-center items-center">
                                    {user.username}
                                </p>
                            </td>
                            {#if user.rank === "administrator"}
                                <td class="border-b-2 border-nord0 py-4">
                                    <p class="flex justify-center items-center">
                                        {user.rank}
                                    </p>
                                </td>
                            {:else}
                                <td class="border-b-2 border-nord0 py-4">
                                    <p class="flex justify-center items-center">
                                        {#if currentUser === "administrator"}
                                            <select
                                                on:change={changeData(
                                                    user.username,
                                                    this
                                                )}
                                                class="w-1/3 h-10 pl-3 pr-6 text-justify text-nord6 outline-none border-none rounded-lg bg-nord0 focus:shadow-outline"
                                                id="grid-state"
                                            >
                                                {#if user.rank === "moderator"}
                                                    <option
                                                        value="moderator"
                                                        class="flex items-center justify-center"
                                                        selected
                                                        >moderator</option
                                                    >
                                                    <option
                                                        value="client"
                                                        class="flex items-center justify-center"
                                                        >client</option
                                                    >
                                                {/if}
                                                {#if user.rank === "client"}
                                                    <option value="moderator"
                                                        >moderator</option
                                                    >
                                                    <option
                                                        value="client"
                                                        selected>client</option
                                                    >
                                                {/if}
                                            </select>
                                        {:else}
                                            {user.rank}
                                        {/if}
                                    </p>
                                </td>
                            {/if}
                        </tr>
                    {/each}
                </table>
            {/await}
        {:else}
            <h1 class="text-nord6 text-4xl bold mt-10 px-10 text-center">
                You have reached the world's edge, none but devils play past
                here 👺
            </h1>
        {/if}
    {/await}
</main>
