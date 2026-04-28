# CineStack - Premium Movie Booking GUI

Welcome to the newly enhanced CineStack, an ultra-modern, beautiful, and dynamic GUI version of your Cinema Ticket Booking System.

## Why a Web GUI?
While traditional desktop GUI libraries in Python (`Tkinter`, `PyQt`) or C++ (`Qt`) are powerful, they often result in outdated, rigid, and plain interfaces. 
To achieve the **rich aesthetics** and **dynamic design** expected of a modern application today, CineStack has been completely rebuilt using **Web Technologies** (HTML, CSS, JavaScript). 
This allows for:
- Glassmorphism effects and modern blur panels.
- Smooth transitions and hover micro-animations.
- Glowing background orbs and a beautiful dark mode color palette.
- No installation required! It runs right in your web browser.

## How to Run the App

1. Navigate to the `web_gui` folder located at `c:\Users\barad\OneDrive\Desktop\Cinestack\web_gui\`.
2. Double-click the **`index.html`** file.
3. Your default web browser (Chrome, Edge, Firefox, etc.) will open the application immediately. 
4. No servers, no installations, no setup required!

## How to Use the App

The booking flow is simple and intuitive:

1. **Select a Movie**: Browse the grid of available movies. Hover over the beautiful glass cards and click on your desired movie. Prices shown are base prices.
2. **Select a Theatre**: Choose where you'd like to watch it. Theatres have specific formats available (e.g., IMAX, 4DX, InfinityVision).
3. **Customize your Booking**: 
   - Select your preferred viewing format from the dropdown. The price will automatically update based on the format multiplier (e.g., InfinityVision is a 2.5x multiplier).
   - Use the `+` and `-` buttons to choose the number of tickets (maximum of 10).
   - Watch the live price calculator update automatically!
4. **Confirm**: Click the `Confirm Booking` button to see your beautiful final receipt!

## Customization

Since this is built with standard web technologies, you can easily customize it:
- **Add new movies/theatres**: Open `script.js` and add new entries to the `movies`, `formats`, or `theatres` lists at the top of the file.
- **Change the look**: Open `style.css` and tweak the `--primary-color` or `--bg-color` variables at the top of the file to change the entire theme!

Enjoy your premium cinema booking experience!
