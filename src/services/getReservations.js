export default async function getReservations() {
    const users = await fetch("./backend/getUsers.php", {
        method: "GET"
    })
    const userData = await users.json()
    const cars = await fetch("./backend/getCars.php", {
        method: "GET"
    })
    const carData = await cars.json()
    const reservations = await fetch("./backend/getReservations.php", {
        method: "GET",
    });
    const reservationsData = await reservations.json();

    const reservationsArray = reservationsData.map(reservation => {
        let modifiedReservation = reservation
        userData.forEach(user => {
            if (user.id === reservation.userId) modifiedReservation = { ...modifiedReservation, userName: user.username }
        })
        carData.forEach(car => {
            if (car.id === reservation.carId) modifiedReservation = { ...modifiedReservation, carName: `${car.mark} ${car.model}` }
        })
        return modifiedReservation
    })

    return reservationsArray
}