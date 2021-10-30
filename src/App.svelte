<script>
	import Tailwindcss from "./Tailwindcss.svelte";
	import Router from "svelte-spa-router";
	import Home from "./routes/Home.svelte";
	import Login from "./routes/Login.svelte";
	import Register from "./routes/Register.svelte";
	import NotFound from "./routes/NotFound.svelte";
	import Cars from "./routes/Cars.svelte";
	import Users from "./routes/Users.svelte";
	import Reservations from "./routes/Reservations.svelte";
	import Applications from "./routes/Applications.svelte";
	import Terms from "./routes/Terms.svelte";
	import Header from "./components/Header.svelte";
	import Footer from "./components/Footer.svelte";
</script>

<Tailwindcss />
<main class="flex flex-col justify-between h-screen pt-32 md:pt-12">
	<Header />
	<Router
		routes={{
			"/": Home,
			"/login": Login,
			"/register": Register,
			"/users": Users,
			"/cars": Cars,
			"/reservations": Reservations,
			"/applications": Applications,
			"/terms": Terms,
			"*": NotFound,
		}}
	/>
	<Footer />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
	}
</style>
