#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <functional>
using namespace std;

class Movie {
private:
    string name;
    int basePrice;
public:
    Movie(string n, int p) : name(n), basePrice(p) {}
    string getName() const { return name; }
    int getBasePrice() const { return basePrice; }
};

class Format {
private:
    string label;
    float multiplier;
public:
    Format(string l, float m) : label(l), multiplier(m) {}
    string getLabel() const { return label; }
    float getMultiplier() const { return multiplier; }
};

class Theatre {
private:
    string name;
    string city;
    vector<Format> formats;
    int seatsAvailable;

public:
    Theatre(string n, string c, vector<Format> f, int seats = 1000)
        : name(n), city(c), formats(f), seatsAvailable(seats) {}

    string getName() const { return name; }
    string getCity() const { return city; }
    const vector<Format>& getFormats() const { return formats; }

    int getSeatsAvailable() const { return seatsAvailable; }

    bool bookSeats(int n) {
        if (n > seatsAvailable)
            return false;
        seatsAvailable -= n;
        return true;
    }
};

class Booking {
private:
    Movie movie;
    Theatre theatre;
    Format format;
    int tickets;
    int totalCost;
public:
    Booking(Movie m, Theatre t, Format f, int n)
        : movie(m), theatre(t), format(f), tickets(n) {
        totalCost = tickets * (int)(movie.getBasePrice() * format.getMultiplier());
    }

    void printSummary() const {
        cout << "\n========== BOOKING CONFIRMED ==========\n";
        cout << "Movie   : " << movie.getName() << "\n";
        cout << "Theatre : " << theatre.getName() << ", " << theatre.getCity() << "\n";
        cout << "Format  : " << format.getLabel() << "\n";
        cout << "Tickets : " << tickets << "\n";
        cout << "Total   : Rs. " << totalCost << "\n";
        cout << "=======================================\n";
    }
};

template <typename T>
int pickOption(const vector<T>& items, const string& prompt,
               const function<string(const T&)>& display) {
    cout << "\n" << prompt << "\n";
    for (int i = 0; i < (int)items.size(); i++)
        cout << i + 1 << ". " << display(items[i]) << "\n";

    int choice;
    cout << "Enter choice: ";
    cin >> choice;

    while (choice < 1 || choice > (int)items.size()) {
        cout << "Invalid. Try again: ";
        cin >> choice;
    }
    return choice - 1;
}

int main() {
    vector<Movie> movies = {
        {"Project Hail Mary",          250},
        {"Dhurandhar: The Revenge",    200},
        {"Leader",                     180},
        {"Michael",                    220},
        {"Lee Cronin: The Mummy",      200},
        {"Avengers",                   200},
        {"Inception",                  150}
    };

    vector<Format> formats = {
        {"2D",              1.0f},
        {"3D ScreenX",      1.3f},
        {"IMAX",            1.8f},
        {"4DX",             2.0f},
        {"MX4D",            1.9f},
        {"GOLD",            2.2f},
        {"InfinityVision",  2.5f}
    };

    vector<Theatre> theatres = {
        {"PVR Cinemas",   "Chennai", {formats[0], formats[2], formats[3]}, 1000},
        {"INOX",          "Chennai", {formats[0], formats[1], formats[4]}, 1000},
        {"Sathyam",       "Chennai", {formats[0], formats[2], formats[5]}, 1000},
        {"AGS Cinemas",   "Chennai", {formats[0], formats[1], formats[6]}, 1000}
    };

    cout << "======== CINESTACK ========\n";

    int mi = pickOption<Movie>(movies, "Select a Movie:",
        [](const Movie& m) {
            return m.getName() + "  (Base: Rs." + to_string(m.getBasePrice()) + ")";
        });

    int ti = pickOption<Theatre>(theatres, "Select a Theatre:",
        [](const Theatre& t) {
            return t.getName() + ", " + t.getCity();
        });

    const auto& avail = theatres[ti].getFormats();

    int fi = pickOption<Format>(avail, "Select Format:",
        [&](const Format& f) {
            int price = (int)(movies[mi].getBasePrice() * f.getMultiplier());
            return f.getLabel() + "  (Rs." + to_string(price) + "/ticket)";
        });

    int n;
    cout << "\nNumber of tickets: ";
    cin >> n;

    while (n < 1 || n > 10) {
        cout << "You can book between 1 and 10 tickets only: ";
        cin >> n;
    }

    // Seat availability check
    if (!theatres[ti].bookSeats(n)) {
        cout << "\nThis show is housefull, kindly book in another theatre.\n";
        return 0;
    }

    Booking b(movies[mi], theatres[ti], avail[fi], n);
    b.printSummary();

    return 0;
}