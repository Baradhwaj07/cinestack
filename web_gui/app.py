from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import random
import string
import traceback

app = Flask(__name__, static_folder='.', static_url_path='')

def get_db_connection():
    conn = sqlite3.connect('cinestack_v4.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Users Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                is_admin BOOLEAN DEFAULT 0
            )
        ''')
        
        # Movies Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS movies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                base_price INTEGER,
                emoji TEXT
            )
        ''')
        
        # Insert Default Movies if empty
        cursor.execute('SELECT COUNT(*) FROM movies')
        if cursor.fetchone()[0] == 0:
            default_movies = [
                ("Project Hail Mary", 250, "🚀"),
                ("Dhurandhar: The Revenge", 200, "⚔️"),
                ("Leader", 180, "👑"),
                ("Michael", 220, "🕵️"),
                ("Lee Cronin: The Mummy", 200, "🧟"),
                ("Avengers", 200, "🦸"),
                ("Inception", 150, "🌀")
            ]
            cursor.executemany('INSERT INTO movies (name, base_price, emoji) VALUES (?, ?, ?)', default_movies)
            
        # Insert Default Admin if not exists
        cursor.execute('SELECT COUNT(*) FROM users WHERE username = "admin"')
        if cursor.fetchone()[0] == 0:
            cursor.execute('INSERT INTO users (username, password, is_admin) VALUES ("admin", "admin123", 1)')
            
        # Tickets Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_code TEXT UNIQUE,
                user_id INTEGER,
                username TEXT,
                movie_name TEXT,
                theatre_name TEXT,
                format_label TEXT,
                show_date TEXT,
                seats TEXT,
                tickets INTEGER,
                total_price INTEGER,
                booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'ACTIVE',
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Database initialization error: {e}")
        return False

init_db()

def generate_ticket_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# --- USER AUTHENTICATION ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password, is_admin) VALUES (?, ?, 0)", (username, password))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return jsonify({"success": True, "user_id": user_id, "username": username, "is_admin": False})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "error": "Username already exists."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone()
    conn.close()
    if user:
        return jsonify({"success": True, "user_id": user["id"], "username": user["username"], "is_admin": bool(user["is_admin"])})
    return jsonify({"success": False, "error": "Invalid credentials."})

# --- MOVIES API ---
@app.route('/api/movies', methods=['GET'])
def get_movies():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM movies")
    movies = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "movies": movies})

@app.route('/api/movies', methods=['POST'])
def add_movie():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO movies (name, base_price, emoji) VALUES (?, ?, ?)", 
                       (data['name'], data['base_price'], data['emoji']))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/seats', methods=['GET'])
def get_booked_seats():
    movie = request.args.get('movie')
    theatre = request.args.get('theatre')
    date = request.args.get('date')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT seats FROM tickets 
        WHERE movie_name = ? AND theatre_name = ? AND show_date = ? AND status = 'ACTIVE'
    """, (movie, theatre, date))
    
    booked_seats = []
    for row in cursor.fetchall():
        if row['seats']:
            # seats are stored as comma separated, e.g., "A1, A2, B4"
            booked_seats.extend([s.strip() for s in row['seats'].split(',')])
            
    conn.close()
    return jsonify({"success": True, "booked_seats": booked_seats})

# --- BOOKINGS API ---
@app.route('/api/book', methods=['POST'])
def book_ticket():
    data = request.json
    ticket_code = generate_ticket_code()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tickets 
            (ticket_code, user_id, username, movie_name, theatre_name, format_label, show_date, seats, tickets, total_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_code, data['user_id'], data['username'], data['movie_name'], 
            data['theatre_name'], data['format_label'], data['show_date'], data['seats'], data['tickets'], data['total_price']
        ))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "ticket_code": ticket_code})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/tickets/<int:user_id>', methods=['GET'])
def get_user_tickets(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE user_id = ? ORDER BY booking_time DESC", (user_id,))
    tickets = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "tickets": tickets})

@app.route('/api/tickets/<int:ticket_id>/user_cancel', methods=['POST'])
def user_cancel_ticket(ticket_id):
    data = request.json
    user_id = data.get('user_id')
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Ensure the user owns this ticket
        cursor.execute("SELECT * FROM tickets WHERE id = ? AND user_id = ?", (ticket_id, user_id))
        if cursor.fetchone():
            cursor.execute("UPDATE tickets SET status = 'CANCELLED_USER' WHERE id = ?", (ticket_id,))
            conn.commit()
            conn.close()
            return jsonify({"success": True})
        return jsonify({"success": False, "error": "Unauthorized"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# --- ADMIN API ---
@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, is_admin FROM users WHERE is_admin = 0")
    users = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "users": users})

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tickets WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/admin/tickets', methods=['GET'])
def admin_get_tickets():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets ORDER BY booking_time DESC")
    tickets = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "tickets": tickets})

@app.route('/api/admin/tickets/<int:ticket_id>/cancel', methods=['POST'])
def admin_cancel_ticket(ticket_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tickets SET status = 'CANCELLED' WHERE id = ?", (ticket_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

if __name__ == '__main__':
    print("Starting CineStack Server on http://127.0.0.1:5000 with SQLite")
    app.run(debug=True, port=5000)
