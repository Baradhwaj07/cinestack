# CineStack - Features Documentation

Welcome to the CineStack web application! This document provides a comprehensive overview of all the features and functionalities available in the premium movie booking platform.

## 1. User Authentication System
CineStack includes a secure and persistent user authentication system.
- **Registration & Login:** Users can create an account and log in. 
- **Session Persistence:** Once logged in, your session is saved locally, so you don't have to log in every time you visit the page.
- **Dynamic Navigation:** The navigation bar updates automatically to hide the Login button and reveal "My Tickets" and "Logout" buttons upon successful login.

## 2. Interactive Movie Booking Flow
The core of CineStack is its 4-step interactive booking process, featuring smooth transitions and dynamic price calculations.

### Step 1: Movie Selection
- Browse a grid of available movies fetched live from the database.
- Each movie displays its name, an emoji poster, and a starting base price.

### Step 2: Theatre Selection
- Choose your preferred theatre.
- Each theatre supports specific viewing formats (e.g., a theatre might only have 2D and IMAX, while another has 3D and 4DX).

### Step 3: Format, Date, & Seat Selection
- **Date Selection:** Choose a show date (past dates are disabled).
- **Viewing Format:** Select from premium formats like 2D, 3D ScreenX, IMAX, 4DX, MX4D, GOLD, and InfinityVision. The base price of the movie is multiplied based on the format's premium tier.
- **Interactive Seat Map:** A visual 50-seat grid (Rows A-E, Columns 1-10) allows you to click and select your exact seats.
- **Seat Availability:** Seats already booked by other users for the same movie, theatre, and date are marked in red and cannot be selected.
- **Booking Limit:** Users can book a maximum of 10 seats per transaction.
- **Live Price Calculator:** The total price updates in real-time as you change your format or select more seats.

### Step 4: Digital Receipt
- Upon confirmation, a unique 10-character alphanumeric ticket code is generated.
- A beautiful digital receipt is displayed containing all booking details.

## 3. User Dashboard (My Tickets)
Users have full control over their booking history.
- **Booking History:** View a list of all your active and cancelled tickets.
- **User Cancellations:** Users can cancel their own active tickets at any time.
- **Refund Logic:** When a user cancels a ticket, a 20% cancellation penalty fee is automatically deducted, and the remaining amount is shown as the refund value.

## 4. Admin Control Panel
The application includes a powerful Admin Panel accessible only to administrators (Default login: Username `admin`, Password `admin123`).

### Movie Management
- **Add Movies:** Admins can dynamically add new movies to the database by specifying the movie name, base price, and an emoji icon. The new movie instantly appears on the home page for all users.

### User Management
- **View Users:** See a list of all registered standard users and their User IDs.
- **Delete Users:** Admins can delete user accounts. Deleting a user automatically cascades and deletes all tickets associated with that user.

### Ticket Management & Analytics
- **Global Ticket View:** Admins can see every ticket booked across the entire platform.
- **Theatre Filtering:** A dropdown allows admins to filter the global ticket list to view bookings for a specific theatre branch.
- **Admin Cancellations:** Admins have the authority to forcibly cancel any ticket. Unlike user cancellations, admin cancellations do not calculate a 20% penalty fee on the UI.

## 5. Modern UI / UX Design
- **Glassmorphism:** The entire UI is built using beautiful frosted-glass panels over a dynamic animated background.
- **Dark Mode Palette:** A modern dark theme with vibrant primary accents for excellent contrast.
- **Responsive:** The application is built with standard HTML/CSS/JS and is designed to run smoothly directly in any modern web browser.
