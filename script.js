// script.js

// === Configuration & Default Data ===
const DEFAULT_MOVIES = [
    { id: 'm1', title: 'Inception', genre: 'Sci-Fi', duration: '2h 28m', rating: '8.8', price: 15, poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=500' },
    { id: 'm2', title: 'The Dark Knight', genre: 'Action', duration: '2h 32m', rating: '9.0', price: 18, poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=500' },
    { id: 'm3', title: 'Interstellar', genre: 'Sci-Fi', duration: '2h 49m', rating: '8.6', price: 16, poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=500' },
    { id: 'm4', title: 'Avatar: Way of Water', genre: 'Fantasy', duration: '3h 12m', rating: '7.8', price: 20, poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=500' },
    { id: 'm5', title: 'John Wick 4', genre: 'Action', duration: '2h 49m', rating: '8.2', price: 15, poster: 'https://images.unsplash.com/photo-1533518463841-d62e1fc91373?q=80&w=500' },
    { id: 'm6', title: 'Dune: Part Two', genre: 'Sci-Fi', duration: '2h 46m', rating: '8.9', price: 18, poster: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=500' }
];

// === Initialization ===
function initApp() {
    if (!localStorage.getItem('movies')) {
        localStorage.setItem('movies', JSON.stringify(DEFAULT_MOVIES));
    }
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([{name: 'Admin', email: 'admin@bookit.com', password: 'Admin@123', role: 'admin'}]));
    }
    if (!localStorage.getItem('bookings')) {
        localStorage.setItem('bookings', JSON.stringify([]));
    }
    if (!localStorage.getItem('seatsData')) {
        localStorage.setItem('seatsData', JSON.stringify({}));
    }
    updateNav();
}

// === Auth Functions ===
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function updateNav() {
    const user = getCurrentUser();
    const navLinks = document.getElementById('dynamic-nav-links');
    if (!navLinks) return;

    if (user) {
        if (user.role === 'admin') {
            navLinks.innerHTML = `
                <li><a href="admin.html">Dashboard</a></li>
                <li><a href="#" onclick="logout()">Logout</a></li>
            `;
        } else {
            navLinks.innerHTML = `
                <li><a href="movies.html">Movies</a></li>
                <li><a href="mybookings.html">My Bookings</a></li>
                <li><a href="#" onclick="logout()">Logout (${user.name})</a></li>
            `;
        }
    } else {
        navLinks.innerHTML = `
            <li><a href="movies.html">Movies</a></li>
            <li><a href="login.html" class="btn">Login</a></li>
        `;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function requireAuth(role = 'user') {
    const user = getCurrentUser();
    if (!user) {
        alert("Please login to access this page.");
        window.location.href = 'login.html';
        return false;
    }
    if (role === 'admin' && user.role !== 'admin') {
        alert("Admin access required.");
        window.location.href = 'index.html';
        return false;
    }
    return user;
}

// === Password Strength Checker ===
function checkPasswordStrength(password) {
    const bar = document.getElementById('strength-bar');
    if (!bar) return;
    let strength = 0;
    if (password.length > 5) strength += 33;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 33;
    if (password.match(/[\d\W]/)) strength += 34;

    bar.style.width = strength + '%';
    if (strength < 50) bar.style.background = '#e74c3c';
    else if (strength < 80) bar.style.background = '#f1c40f';
    else bar.style.background = '#2ecc71';
}

// === UI Renderers ===

// Render Movies
function renderMovies() {
    const container = document.getElementById('movies-container');
    if (!container) return;
    const movies = JSON.parse(localStorage.getItem('movies'));
    container.innerHTML = '';

    movies.forEach(movie => {
        container.innerHTML += `
            <div class="movie-card">
                <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span>${movie.genre}</span>
                        <span>⭐ ${movie.rating}</span>
                    </div>
                    <div class="movie-meta">
                        <span>⏱ ${movie.duration}</span>
                        <span>$${movie.price}</span>
                    </div>
                    <a href="booking.html?id=${movie.id}" class="btn" style="width: 100%; text-align: center;">Book Now</a>
                </div>
            </div>
        `;
    });
}

// Seat Booking Logic
let selectedSeatsArray = [];
function renderSeatGrid() {
    const container = document.getElementById('seat-grid');
    if (!container) return;
    
    const user = requireAuth('user');
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    const movies = JSON.parse(localStorage.getItem('movies'));
    const movie = movies.find(m => m.id === movieId);

    if (!movie) {
        alert("Movie not found!");
        window.location.href = 'movies.html';
        return;
    }

    document.getElementById('movie-name-display').innerText = movie.title;
    
    const seatsData = JSON.parse(localStorage.getItem('seatsData'));
    const occupiedSeats = seatsData[movieId] || [];

    container.innerHTML = '';
    // Generate 36 seats (6x6)
    for (let i = 0; i < 36; i++) {
        const seat = document.createElement('div');
        seat.classList.add('seat');
        seat.dataset.index = i;
        
        if (occupiedSeats.includes(i)) {
            seat.classList.add('occupied');
        } else {
            seat.addEventListener('click', (e) => toggleSeat(e.target, movie.price));
        }
        container.appendChild(seat);
    }
}

function toggleSeat(seatElement, price) {
    const index = parseInt(seatElement.dataset.index);
    if (seatElement.classList.contains('selected')) {
        seatElement.classList.remove('selected');
        selectedSeatsArray = selectedSeatsArray.filter(s => s !== index);
    } else {
        seatElement.classList.add('selected');
        selectedSeatsArray.push(index);
    }
    updateBookingSummary(price);
}

function updateBookingSummary(price) {
    const count = selectedSeatsArray.length;
    document.getElementById('count').innerText = count;
    document.getElementById('total').innerText = count * price;
}

function confirmBooking() {
    if (selectedSeatsArray.length === 0) {
        alert("Please select at least one seat.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    const movies = JSON.parse(localStorage.getItem('movies'));
    const movie = movies.find(m => m.id === movieId);
    const user = getCurrentUser();

    // Prevent double booking (Race condition simulation check)
    const seatsData = JSON.parse(localStorage.getItem('seatsData'));
    const occupiedSeats = seatsData[movieId] || [];
    const conflict = selectedSeatsArray.some(seat => occupiedSeats.includes(seat));
    
    if (conflict) {
        alert("Sorry, someone just booked those seats. Please select different ones.");
        window.location.reload();
        return;
    }

    // Save Booked Seats
    seatsData[movieId] = [...occupiedSeats, ...selectedSeatsArray];
    localStorage.setItem('seatsData', JSON.stringify(seatsData));

    // Save Booking Record
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const newBooking = {
        bookingId: 'BK' + Date.now().toString().slice(-6),
        userEmail: user.email,
        movieId: movie.id,
        movieTitle: movie.title,
        seats: selectedSeatsArray,
        total: selectedSeatsArray.length * movie.price,
        date: new Date().toLocaleDateString()
    };
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    alert(`Booking Confirmed! ID: ${newBooking.bookingId}`);
    window.location.href = 'mybookings.html';
}

// My Bookings
function renderMyBookings() {
    const tbody = document.querySelector('#my-bookings-table tbody');
    if (!tbody) return;

    const user = requireAuth('user');
    if (!user) return;

    const bookings = JSON.parse(localStorage.getItem('bookings')).filter(b => b.userEmail === user.email);
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No bookings found.</td></tr>`;
        return;
    }

    bookings.forEach(b => {
        tbody.innerHTML += `
            <tr>
                <td>${b.bookingId}</td>
                <td>${b.movieTitle}</td>
                <td>${b.seats.map(s => s+1).join(', ')}</td>
                <td>$${b.total}</td>
                <td>${b.date}</td>
                <td><button class="btn btn-danger" onclick="cancelBooking('${b.bookingId}', '${b.movieId}')">Cancel</button></td>
            </tr>
        `;
    });
}

function cancelBooking(bookingId, movieId) {
    if(!confirm("Are you sure you want to cancel this booking?")) return;

    let bookings = JSON.parse(localStorage.getItem('bookings'));
    const bookingToCancel = bookings.find(b => b.bookingId === bookingId);
    
    // Free up seats
    let seatsData = JSON.parse(localStorage.getItem('seatsData'));
    let movieSeats = seatsData[movieId] || [];
    seatsData[movieId] = movieSeats.filter(seat => !bookingToCancel.seats.includes(seat));
    localStorage.setItem('seatsData', JSON.stringify(seatsData));

    // Remove booking
    bookings = bookings.filter(b => b.bookingId !== bookingId);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    renderMyBookings();
    alert("Booking cancelled successfully.");
}

// Admin Panel
function renderAdmin() {
    const adminSection = document.getElementById('admin-dashboard');
    if (!adminSection) return;
    
    const user = requireAuth('admin');
    if (!user) return;

    // Calc stats
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const totalRevenue = bookings.reduce((sum, b) => sum + b.total, 0);
    
    document.getElementById('total-bookings').innerText = bookings.length;
    document.getElementById('total-revenue').innerText = '$' + totalRevenue;

    const tbody = document.querySelector('#admin-movies-table tbody');
    const movies = JSON.parse(localStorage.getItem('movies'));
    tbody.innerHTML = '';

    movies.forEach(m => {
        tbody.innerHTML += `
            <tr>
                <td>${m.title}</td>
                <td>${m.genre}</td>
                <td>$${m.price}</td>
                <td><button class="btn btn-danger" onclick="deleteMovie('${m.id}')">Remove</button></td>
            </tr>
        `;
    });
}

function handleAddMovie(e) {
    e.preventDefault();
    const title = document.getElementById('m-title').value;
    const genre = document.getElementById('m-genre').value;
    const duration = document.getElementById('m-duration').value;
    const price = document.getElementById('m-price').value;
    const poster = document.getElementById('m-poster').value || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500';

    const movies = JSON.parse(localStorage.getItem('movies'));
    movies.push({
        id: 'm' + Date.now(),
        title, genre, duration, price: parseInt(price), rating: 'N/A', poster
    });
    localStorage.setItem('movies', JSON.stringify(movies));
    e.target.reset();
    renderAdmin();
    alert("Movie added!");
}

function deleteMovie(id) {
    if(!confirm("Remove this movie?")) return;
    let movies = JSON.parse(localStorage.getItem('movies'));
    movies = movies.filter(m => m.id !== id);
    localStorage.setItem('movies', JSON.stringify(movies));
    renderAdmin();
}

// === Event Listeners for Forms ===
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    // Register Form
    const regForm = document.getElementById('register-form');
    if (regForm) {
        document.getElementById('r-password').addEventListener('input', (e) => checkPasswordStrength(e.target.value));
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('r-name').value;
            const email = document.getElementById('r-email').value;
            const password = document.getElementById('r-password').value;
            
            let users = JSON.parse(localStorage.getItem('users'));
            if (users.find(u => u.email === email)) {
                alert("Email already registered!");
                return;
            }
            users.push({ name, email, password, role: 'user' });
            localStorage.setItem('users', JSON.stringify(users));
            alert("Registration successful! Please login.");
            window.location.href = 'login.html';
        });
    }

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('l-email').value;
            const password = document.getElementById('l-password').value;
            const users = JSON.parse(localStorage.getItem('users'));
            
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify({ email: user.email, name: user.name, role: user.role }));
                window.location.href = user.role === 'admin' ? 'admin.html' : 'movies.html';
            } else {
                alert("Invalid credentials.");
            }
        });
    }

    // Admin Add Movie Form
    const addMovieForm = document.getElementById('add-movie-form');
    if (addMovieForm) addMovieForm.addEventListener('submit', handleAddMovie);

    // Page Specific Renders
    if (document.getElementById('movies-container')) renderMovies();
    if (document.getElementById('seat-grid')) renderSeatGrid();
    if (document.getElementById('my-bookings-table')) renderMyBookings();
    if (document.getElementById('admin-dashboard')) renderAdmin();
});