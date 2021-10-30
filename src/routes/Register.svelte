<script>
    import doesExist from "../services/doesExist";

    let error = "";

    const onSubmit = async (e) => {
        e.preventDefault();
        const username = e.target["username"].value;
        const password = e.target["password"].value;
        const confirmPassword = e.target["confirmPassword"].value;
        if (password !== confirmPassword) {
            error = "The given passwords do not match!";
        } else if (password.length < 8) {
            error = "The given password is too short!";
        } else if (await doesExist(username)) {
            error = "User already exists!";
        } else {
            let formData = new FormData();
            formData.append("username", username);
            formData.append("password", password);
            const res = await fetch("./backend/register.php", {
                method: "POST",
                body: formData,
            });
            const data = await res.text();
            data === "added"
                ? (document.location.href = "#/login")
                : (error =
                      "An error occured while registering! Please try again!");
        }
    };
</script>

<main class="">
    <form
        on:submit={onSubmit}
        class="flex justify-center items-center text-nord6 mt-20"
    >
        <div
            class="lg:w-2/6 md:w-1/2 bg-gray-800 bg-opacity-50 rounded-lg p-8 flex flex-col w-full mt-10 md:mt-0"
        >
            <h2 class="text-white text-xl font-medium title-font mb-5">
                Join now!
            </h2>
            <h5 class="text-nord11 text-base font-medium title-font mb-5">
                {error}
            </h5>
            <div class="relative mb-4">
                <label for="username" class="leading-7 text-sm text-gray-400"
                    >Username</label
                >
                <input
                    type="text"
                    id="username"
                    name="username"
                    class="w-full bg-gray-600 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-indigo-900 rounded border border-gray-600 focus:border-indigo-500 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                />
            </div>
            <div class="relative mb-4">
                <label for="password" class="leading-7 text-sm text-gray-400"
                    >Password</label
                >
                <input
                    type="password"
                    id="password"
                    name="password"
                    class="w-full bg-gray-600 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-indigo-900 rounded border border-gray-600 focus:border-indigo-500 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                />
            </div>
            <div class="relative mb-4">
                <label
                    for="confirm-password"
                    class="leading-7 text-sm text-gray-400"
                >
                    Confirm Password
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirm-password"
                    class="w-full bg-gray-600 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-indigo-900 rounded border border-gray-600 focus:border-indigo-500 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                />
            </div>
            <button
                class="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
            >
                Register
            </button>
        </div>
    </form>
</main>

<style>
    input {
        border: none;
        border-radius: 10px;
    }
</style>
