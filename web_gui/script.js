// Static Data Models
const formats = [
    { id: '2d', label: "2D", multiplier: 1.0 },
    { id: '3d', label: "3D ScreenX", multiplier: 1.3 },
    { id: 'imax', label: "IMAX", multiplier: 1.8 },
    { id: '4dx', label: "4DX", multiplier: 2.0 },
    { id: 'mx4d', label: "MX4D", multiplier: 1.9 },
    { id: 'gold', label: "GOLD", multiplier: 2.2 },
    { id: 'inf', label: "InfinityVision", multiplier: 2.5 }
];

const theatres = [
    { id: 1, name: "PVR Cinemas", city: "Chennai", formats: ['2d', 'imax', '4dx'] },
    { id: 2, name: "INOX", city: "Chennai", formats: ['2d', '3d', 'mx4d'] },
    { id: 3, name: "Sathyam", city: "Chennai", formats: ['2d', 'imax', 'gold'] },
    { id: 4, name: "AGS Cinemas", city: "Chennai", formats: ['2d', '3d', 'inf'] }
];

// State
let state = {
    step: 1,
    movie: null,
    theatre: null,
    format: null,
    tickets: 0,
    selectedSeats: [],
    user_id: null,
    username: null,
    isAdmin: false,
    moviesList: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    checkLocalSession();
    fetchMovies();
});

function checkLocalSession() {
    const session = JSON.parse(localStorage.getItem('cinestack_session'));
    if (session) {
        state.user_id = session.user_id;
        state.username = session.username;
        state.isAdmin = session.is_admin;
        updateNavState();
    }
}

function updateNavState() {
    if (state.user_id) {
        document.getElementById('nav-auth').style.display = 'none';
        document.getElementById('nav-logout').style.display = 'block';
        document.getElementById('nav-my-tickets').style.display = 'block';
        document.getElementById('welcome-msg').textContent = `Welcome, ${state.username}!`;
        
        if (state.isAdmin) {
            document.getElementById('nav-admin').style.display = 'block';
        } else {
            document.getElementById('nav-admin').style.display = 'none';
        }
    } else {
        document.getElementById('nav-auth').style.display = 'block';
        document.getElementById('nav-logout').style.display = 'none';
        document.getElementById('nav-my-tickets').style.display = 'none';
        document.getElementById('nav-admin').style.display = 'none';
        document.getElementById('welcome-msg').textContent = ``;
    }
}

// --- API Calls ---

async function fetchMovies() {
    try {
        const res = await fetch('/api/movies');
        const data = await res.json();
        if (data.success) {
            state.moviesList = data.movies;
            renderMovies();
        }
    } catch (e) { console.error(e); }
}

function renderMovies() {
    const grid = document.getElementById('movie-grid');
    grid.innerHTML = '';
    
    state.moviesList.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'card glass-panel';
        card.onclick = () => selectMovie(movie);
        
        card.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 15px; text-align: center;">${movie.emoji}</div>
            <h3 style="text-align: center;">${movie.name}</h3>
            <div style="text-align: center;">
                <span class="price-tag">From Rs. ${movie.base_price}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function selectMovie(movie) {
    state.movie = movie;
    document.getElementById('selected-movie-title').textContent = movie.name;
    renderTheatres();
    goToStep(2);
}

function renderTheatres() {
    const grid = document.getElementById('theatre-grid');
    grid.innerHTML = '';
    
    theatres.forEach(theatre => {
        const card = document.createElement('div');
        card.className = 'card glass-panel';
        card.onclick = () => selectTheatre(theatre);
        
        const theatreFormats = theatre.formats.map(fId => {
            return formats.find(f => f.id === fId).label;
        });

        card.innerHTML = `
            <h3>${theatre.name}</h3>
            <p>📍 ${theatre.city}</p>
            <div class="format-tags">
                ${theatreFormats.map(f => `<span class="format-tag">${f}</span>`).join('')}
            </div>
        `;
        grid.appendChild(card);
    });
}

function selectTheatre(theatre) {
    state.theatre = theatre;
    renderFormats();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('booking-date');
    dateInput.min = today;
    dateInput.value = today;
    dateInput.onchange = fetchAndRenderSeats;
    
    goToStep(3);
    fetchAndRenderSeats();
}

function renderFormats() {
    const select = document.getElementById('format-select');
    select.innerHTML = '';
    
    const availableFormats = formats.filter(f => state.theatre.formats.includes(f.id));
    
    availableFormats.forEach((format, index) => {
        const price = Math.round(state.movie.base_price * format.multiplier);
        const option = document.createElement('option');
        option.value = format.id;
        option.textContent = `${format.label} - Rs. ${price}/ticket`;
        if (index === 0) {
            option.selected = true;
            state.format = format;
        }
        select.appendChild(option);
    });

    select.onchange = (e) => {
        state.format = formats.find(f => f.id === e.target.value);
        updateLiveTotal();
    };
    updateLiveTotal();
}

async function fetchAndRenderSeats() {
    const showDate = document.getElementById('booking-date').value;
    if (!showDate) return;
    
    let bookedSeats = [];
    try {
        const res = await fetch(`/api/seats?movie=${encodeURIComponent(state.movie.name)}&theatre=${encodeURIComponent(state.theatre.name + ', ' + state.theatre.city)}&date=${encodeURIComponent(showDate)}`);
        const data = await res.json();
        if (data.success) {
            bookedSeats = data.booked_seats;
        }
    } catch (e) { console.error(e); }

    renderSeatGrid(bookedSeats);
}

function renderSeatGrid(bookedSeats) {
    state.selectedSeats = [];
    state.tickets = 0;
    updateLiveTotal();
    
    const grid = document.getElementById('seat-grid');
    grid.innerHTML = '';
    
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const cols = 10;
    
    rows.forEach(r => {
        for(let c=1; c<=cols; c++) {
            const seatId = `${r}${c}`;
            const isBooked = bookedSeats.includes(seatId);
            
            const seat = document.createElement('div');
            seat.className = `seat ${isBooked ? 'booked' : ''}`;
            seat.textContent = seatId;
            
            if (!isBooked) {
                seat.onclick = () => toggleSeat(seat, seatId);
            }
            grid.appendChild(seat);
        }
    });
}

function toggleSeat(seatElement, seatId) {
    if (state.selectedSeats.includes(seatId)) {
        state.selectedSeats = state.selectedSeats.filter(s => s !== seatId);
        seatElement.classList.remove('selected');
    } else {
        if (state.selectedSeats.length >= 10) {
            alert("You can only book up to 10 seats at once.");
            return;
        }
        state.selectedSeats.push(seatId);
        seatElement.classList.add('selected');
    }
    state.tickets = state.selectedSeats.length;
    updateLiveTotal();
}

function updateLiveTotal() {
    if (!state.movie || !state.format) return;
    const pricePerTicket = Math.round(state.movie.base_price * state.format.multiplier);
    const total = pricePerTicket * state.tickets;
    document.getElementById('live-total').textContent = `Rs. ${total}`;
}

async function confirmBooking() {
    if (!state.user_id) {
        alert("Please login or register to book a ticket!");
        showAuthModal();
        return;
    }

    const showDate = document.getElementById('booking-date').value;
    if (!showDate) {
        alert("Please select a Show Date.");
        return;
    }

    if (state.selectedSeats.length === 0) {
        alert("Please select at least one seat.");
        return;
    }

    const total = Math.round(state.movie.base_price * state.format.multiplier) * state.tickets;
    
    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: state.user_id,
                username: state.username,
                movie_name: state.movie.name,
                theatre_name: `${state.theatre.name}, ${state.theatre.city}`,
                format_label: state.format.label,
                show_date: showDate,
                seats: state.selectedSeats.join(', '),
                tickets: state.tickets,
                total_price: total
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('receipt-movie').textContent = state.movie.name;
            document.getElementById('receipt-theatre').textContent = `${state.theatre.name}, ${state.theatre.city}`;
            document.getElementById('receipt-format').textContent = state.format.label;
            document.getElementById('receipt-date').textContent = showDate;
            document.getElementById('receipt-seats').textContent = state.selectedSeats.join(', ');
            document.getElementById('receipt-tickets').textContent = state.tickets;
            document.getElementById('receipt-total').textContent = `Rs. ${total}`;
            document.getElementById('receipt-code').textContent = data.ticket_code;
            goToStep(4);
        } else {
            alert(data.error);
        }
    } catch (e) {
        console.error(e);
        alert("Could not connect to server.");
    }
}

async function showMyTickets() {
    if (!state.user_id) return;
    goToStep(5);
    const list = document.getElementById('tickets-list');
    list.innerHTML = '<p style="text-align:center;">Loading tickets...</p>';
    
    try {
        const response = await fetch(`/api/tickets/${state.user_id}`);
        const data = await response.json();
        
        if (data.success) {
            list.innerHTML = '';
            if (data.tickets.length === 0) {
                list.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No tickets booked yet.</p>';
                return;
            }
            
            data.tickets.forEach(ticket => {
                const isCancelledAdmin = ticket.status === 'CANCELLED';
                const isCancelledUser = ticket.status === 'CANCELLED_USER';
                const isCancelled = isCancelledAdmin || isCancelledUser;
                const card = document.createElement('div');
                card.className = 'glass-panel';
                card.style.padding = '20px';
                card.style.opacity = isCancelled ? '0.5' : '1';
                
                let priceDisplay = `Rs. ${ticket.total_price}`;
                if (isCancelledUser) {
                    const fee = Math.round(ticket.total_price * 0.20);
                    const refund = ticket.total_price - fee;
                    priceDisplay = `<span style="color:var(--error); font-size: 0.9rem;">Fee: Rs.${fee}</span> | <span style="color:var(--success);">Refund: Rs.${refund}</span>`;
                } else if (isCancelledAdmin) {
                    priceDisplay = `CANCELLED (Admin)`;
                }

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color); ${isCancelled ? 'text-decoration: line-through;' : ''}">${ticket.movie_name}</h3>
                        <span style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 5px;">#${ticket.ticket_code}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; color: var(--text-secondary); margin-bottom: 10px;">
                        <span>📍 ${ticket.theatre_name}</span>
                        <span>🎟️ ${ticket.tickets} Tickets (${ticket.format_label})</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; color: var(--text-secondary); margin-bottom: 10px;">
                        <span>🗓️ Show Date: ${ticket.show_date || 'N/A'}</span>
                        <span>💺 Seats: ${ticket.seats || 'N/A'}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid var(--surface-border); padding-top: 10px; margin-top: 10px;">
                        <span style="font-size: 0.85rem; color: #666;">Booked: ${ticket.booking_time}</span>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <strong style="color: ${isCancelled ? 'var(--error)' : 'var(--secondary-color)'}; text-align: right;">
                                ${priceDisplay}
                            </strong>
                            ${!isCancelled ? `<button class="btn-secondary" style="padding: 2px 10px; font-size: 0.8rem; border-color: var(--error); color: var(--error);" onclick="userCancelTicket(${ticket.id})">Cancel</button>` : ''}
                        </div>
                    </div>
                `;
                list.appendChild(card);
            });
        }
    } catch (e) { console.error(e); }
}

async function userCancelTicket(ticket_id) {
    if(!confirm("Are you sure you want to cancel this ticket? A 20% cancellation fee will be deducted from your refund.")) return;
    
    try {
        const response = await fetch(`/api/tickets/${ticket_id}/user_cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: state.user_id })
        });
        const data = await response.json();
        if (data.success) {
            showMyTickets();
            alert("Ticket successfully cancelled. 20% fee applied.");
        } else {
            alert(data.error || "Failed to cancel ticket.");
        }
    } catch (e) { console.error(e); }
}

// --- Navigation ---
function goToStep(stepNumber) {
    document.querySelectorAll('.step-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));
    if (stepNumber >= 1 && stepNumber <= 4) {
        document.querySelector('nav a:nth-child(1)').classList.add('active');
    } else if (stepNumber === 5) {
        document.querySelector('nav li:nth-child(2) a').classList.add('active');
    } else if (stepNumber === 6) {
        document.querySelector('nav li:nth-child(3) a').classList.add('active');
    }
    state.step = stepNumber;
}

function goBack(step) { goToStep(step); }
function resetApp() { goToStep(1); }

// --- Auth System ---
let authMode = 'login'; // 'login' or 'register'

function showAuthModal() {
    document.getElementById('auth-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    document.getElementById('auth-title').textContent = authMode === 'login' ? 'Login' : 'Register';
    document.getElementById('auth-submit-btn').textContent = authMode === 'login' ? 'Login' : 'Register';
    document.getElementById('auth-toggle-text').textContent = authMode === 'login' ? "Don't have an account?" : "Already have an account?";
    document.getElementById('auth-toggle-link').textContent = authMode === 'login' ? 'Register' : 'Login';
}

async function performAuth() {
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    if (!username || !password) return alert("Please fill all fields");

    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            state.user_id = data.user_id;
            state.username = data.username;
            state.isAdmin = data.is_admin;
            localStorage.setItem('cinestack_session', JSON.stringify({
                user_id: data.user_id, username: data.username, is_admin: data.is_admin
            }));
            updateNavState();
            closeAuthModal();
            alert(`Successfully ${authMode === 'login' ? 'logged in' : 'registered'}!`);
        } else {
            alert(data.error);
        }
    } catch (e) { alert("Server error."); }
}

function logoutUser() {
    localStorage.removeItem('cinestack_session');
    state.user_id = null;
    state.username = null;
    state.isAdmin = false;
    updateNavState();
    goToStep(1);
}

// --- Admin System ---

function showAdminDashboard() {
    goToStep(6);
    loadAdminUsers();
    loadAdminTickets();
}

async function addMovie() {
    const name = document.getElementById('admin-movie-name').value;
    const price = parseInt(document.getElementById('admin-movie-price').value);
    const emoji = document.getElementById('admin-movie-emoji').value;
    
    if (!name || isNaN(price) || !emoji) return alert("Fill all fields");
    
    try {
        const res = await fetch('/api/movies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, base_price: price, emoji })
        });
        const data = await res.json();
        if (data.success) {
            alert("Movie added to database!");
            document.getElementById('admin-movie-name').value = '';
            document.getElementById('admin-movie-price').value = '';
            document.getElementById('admin-movie-emoji').value = '';
            fetchMovies();
        }
    } catch (e) { alert("Error adding movie"); }
}

async function loadAdminUsers() {
    const list = document.getElementById('admin-users-list');
    try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.success) {
            list.innerHTML = '';
            data.users.forEach(user => {
                const el = document.createElement('div');
                el.style = 'display:flex; justify-content:space-between; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;';
                el.innerHTML = `
                    <span>👤 ${user.username} (ID: ${user.id})</span>
                    <button class="btn-secondary" style="padding: 2px 10px; font-size: 0.8rem; border-color: var(--error); color: var(--error);" onclick="deleteUser(${user.id})">Delete User</button>
                `;
                list.appendChild(el);
            });
        }
    } catch (e) { console.error(e); }
}

async function deleteUser(id) {
    if(!confirm("Are you sure? This deletes the user and ALL their tickets.")) return;
    try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            loadAdminUsers();
            loadAdminTickets();
        }
    } catch (e) { console.error(e); }
}

async function loadAdminTickets() {
    const list = document.getElementById('admin-tickets-list');
    const theatreFilter = document.getElementById('admin-theatre-filter').value;
    
    try {
        const res = await fetch('/api/admin/tickets');
        const data = await res.json();
        if (data.success) {
            list.innerHTML = '';
            const filtered = theatreFilter === 'ALL' ? data.tickets : data.tickets.filter(t => t.theatre_name.includes(theatreFilter));
            
            filtered.forEach(t => {
                const isCancelled = t.status === 'CANCELLED';
                const el = document.createElement('div');
                el.style = `display:flex; flex-direction:column; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; opacity: ${isCancelled ? 0.5 : 1}`;
                el.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                        <strong>${t.movie_name} @ ${t.theatre_name}</strong>
                        <span style="font-family:monospace;">#${t.ticket_code}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size: 0.9rem; color: var(--text-secondary);">
                        <span>User: ${t.username} | ${t.tickets}x ${t.format_label}</span>
                        ${isCancelled ? '<span style="color:var(--error);">CANCELLED</span>' : `<button class="btn-secondary" style="padding: 2px 10px; font-size: 0.8rem; border-color: #ff9900; color: #ff9900;" onclick="cancelTicket(${t.id})">Cancel Ticket</button>`}
                    </div>
                `;
                list.appendChild(el);
            });
        }
    } catch (e) { console.error(e); }
}

async function cancelTicket(id) {
    if(!confirm("Cancel this ticket?")) return;
    try {
        const res = await fetch(`/api/admin/tickets/${id}/cancel`, { method: 'POST' });
        const data = await res.json();
        if (data.success) loadAdminTickets();
    } catch (e) { console.error(e); }
}
