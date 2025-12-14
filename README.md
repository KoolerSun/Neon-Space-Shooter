# Neon Space Shooter (Sky Shooter)

## 1. Project Overview
**Game Title:** Neon Versus (In-game title: Sky Shooter)

**Description:**
Neon Versus is a high-intensity, retro-style vertical scrolling shooter built for two players. Set against a dark background with vibrant neon visuals, players pilot distinct ships in a split-screen environment. The game combines cooperative survival with competitive mechanics, allowing players to sabotage their opponents while fighting off waves of enemies.

**Objectives:**
* **Survive:** Dodge enemy ships and projectiles to preserve your 3 lives.
* **Score High:** Shoot enemies to increase your score.
* **Sabotage:** Fill your "Attack Bar" to send "Garbage" (harder enemies) to your opponent's lane.
* **Win Condition:** Outlast your opponent. If both players die, the player with the highest score wins.


## 2. Technology Stack
This project utilizes the following technologies:

* **Frontend:**
    * **HTML5:** Structure and Canvas element for rendering graphics.
    * **CSS3:** Flexbox layout and neon visual effects (glow/shadows).
    * **JavaScript (ES6):** Core game loop, object-oriented entity management (Player, Enemy, Particles), and collision detection.
* **Backend (Optional/High Score System):**
    * **PHP:** Handles server-side logic for saving/retrieving scores (`api.php`).
    * **JSON:** Used for flat-file data storage (`neon_shooter_save.json`).


## 3. Team Members and Contributions
*Please update the list below with your team details:*

* **Darwin De Leon**
    * *Contribution:* Conceptualized and laid the foundation for the game.
* **Nino Bucud**
    * *Contribution:* Implemented and Upgrades game features and functionality.
* **Eurhy Tanedo**
    * *Contribution:* Implemented and Upgrades game features and functionality.
* **Andre Zonio**
    * *Contribution:* Implemented and Upgrades game features and functionality.


## 4. How to Play

### Controls
| Action | **Player 1 (Green)** | **Player 2 (Red)** |
| :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` Keys | `Arrow` Keys |
| **Shoot** | `Spacebar` | `Enter` Key |

### Game Mechanics
1.  **Split Screen Lanes:** Player 1 occupies the left side; Player 2 occupies the right. You cannot cross into your opponent's lane.
2.  **Attack Bar (Garbage System):**
    * Every time you score points, your Attack Meter fills.
    * When the meter reaches **8**, it resets and sends a **Garbage Enemy** (White Circle) to your opponent's lane.
    * Garbage enemies have higher HP and are harder to kill.
3.  **Power-Ups:**
    * **T (Cyan):** Triple Shot – Fires 3 bullets at once for a limited time.
    * **S (Yellow):** Shield – Protects you from one hit.
    * **H (Pink):** Heal – Restores 1 life (Max 5).
4.  **Difficulty:**
    * The "Danger Level" increases every 15 seconds, making enemies spawn faster.


## 5. How to Run the Program

### Prerequisites
* A modern Web Browser (Chrome, Firefox, Edge).
* *Optional (for Backend features):* A local web server with PHP support (XAMPP, WAMP, or PHP built-in server).

### Installation & Startup

#### Method A: Quick Play (Frontend Only)
If you only want to play the game without saving global high scores:
1.  Download the project files (`index.html`, `style.css`, `game.js`).
2.  Open `index.html` directly in your web browser.

#### Method B: Full Environment (With PHP Backend)
To enable the backend functionality provided in `api.php`:
1.  **Install XAMPP** (or similar local server).
2.  Navigate to your `htdocs` folder (usually `C:\xampp\htdocs`).
3.  Create a folder named `neon-shooter`.
4.  Place all project files (`index.html`, `style.css`, `game.js`, `api.php`) inside this folder.
5.  Ensure the server has write permissions to create `neon_shooter_save.json`.
6.  Start the Apache module in the XAMPP Control Panel.
7.  Open your browser and navigate to: `http://localhost/neon-shooter/`

### Configuration
* **Game Balance:** You can adjust spawn rates and enemy speed by modifying the constants in `game.js` (specifically `thresholdP1`, `thresholdP2`, and `speedMultiplier`).
