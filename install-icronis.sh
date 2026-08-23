#!/bin/bash

set -e

# ============================================================
# IcronisOS Production Raspberry Pi Installer
# Debian 13 / Trixie
# Raspberry Pi 4
# ============================================================

REPO="https://github.com/LanceTreyark/IcronisOS.git"
APP_DIR="/var/www/html/IcronisOS"
TEMP_DIR="/var/www/html/temp"
MJPG_DIR="$HOME/mjpg-streamer"

NODE_PORT="3003"
MJPG_PORT="8090"

echo
echo "============================================================"
echo "        ICRONISOS PRODUCTION INSTALLER"
echo "============================================================"
echo

# ------------------------------------------------------------
# Verify running as normal user
# ------------------------------------------------------------

if [ "$EUID" -eq 0 ]; then
    echo "Do not run this script with sudo."
    echo "Run it as your normal user:"
    echo
    echo "    ./install-icronis.sh"
    echo
    exit 1
fi

USERNAME="$(whoami)"
USER_ID="$(id -u)"
GROUP_ID="$(id -g)"

echo "User:      $USERNAME"
echo "UID:       $USER_ID"
echo "GID:       $GROUP_ID"
echo "App:       $APP_DIR"
echo

# ------------------------------------------------------------
# System update
# ------------------------------------------------------------

echo ">>> Updating system..."

sudo apt update
sudo apt upgrade -y

# ------------------------------------------------------------
# Basic packages
# ------------------------------------------------------------

echo ">>> Installing base packages..."

sudo apt install -y \
    git \
    curl \
    wget \
    build-essential \
    gcc \
    make \
    cmake \
    python3 \
    libjpeg-dev \
    libv4l-dev \
    apache2 \
    openvpn

# ------------------------------------------------------------
# Snap / btop
# ------------------------------------------------------------

echo ">>> Installing snapd..."

sudo apt install -y snapd

if ! command -v snap >/dev/null 2>&1; then
    echo "snap command not available yet."
    echo "A reboot may be required before snap can be used."
else
    sudo snap install core || true
    sudo snap install btop || true
fi

# ------------------------------------------------------------
# Bash aliases
# ------------------------------------------------------------

echo ">>> Configuring bash aliases..."

touch "$HOME/.bash_aliases"


# btop
grep -qxF 'alias bb="btop"' "$HOME/.bash_aliases" || \
    echo 'alias bb="btop"' >> "$HOME/.bash_aliases"


# Reload aliases
grep -qxF 'alias realias="source ~/.bash_aliases"' "$HOME/.bash_aliases" || \
    echo 'alias realias="source ~/.bash_aliases"' >> "$HOME/.bash_aliases"


# Icronis directory
grep -qxF 'alias icronis="cd /var/www/html/IcronisOS"' "$HOME/.bash_aliases" || \
    echo 'alias icronis="cd /var/www/html/IcronisOS"' >> "$HOME/.bash_aliases"


# Start Icronis + MJPG Streamer
grep -qxF 'alias starticronis='\''cd /var/www/html/IcronisOS && (sudo pm2 restart icronis 2>/dev/null || sudo pm2 start icronis-os.js --name icronis) && cd ~/mjpg-streamer/mjpg-streamer-experimental && nohup mjpg_streamer -i "input_uvc.so" -o "output_http.so -p 8090 -w ./www" >/tmp/mjpg-streamer.log 2>&1 &'\''' "$HOME/.bash_aliases" || \
    echo 'alias starticronis='\''cd /var/www/html/IcronisOS && (sudo pm2 restart icronis 2>/dev/null || sudo pm2 start icronis-os.js --name icronis) && cd ~/mjpg-streamer/mjpg-streamer-experimental && nohup mjpg_streamer -i "input_uvc.so" -o "output_http.so -p 8090 -w ./www" >/tmp/mjpg-streamer.log 2>&1 &'\''' >> "$HOME/.bash_aliases"


# Stop Icronis + MJPG Streamer
grep -qxF "alias stopicronis='sudo pm2 stop icronis; pkill -f mjpg_streamer'" "$HOME/.bash_aliases" || \
    echo "alias stopicronis='sudo pm2 stop icronis; pkill -f mjpg_streamer'" >> "$HOME/.bash_aliases"


# Status
grep -qxF "alias statusicronis='sudo pm2 status; echo \"--- MJPG STREAMER ---\"; pgrep -a mjpg_streamer'" "$HOME/.bash_aliases" || \
    echo "alias statusicronis='sudo pm2 status; echo \"--- MJPG STREAMER ---\"; pgrep -a mjpg_streamer'" >> "$HOME/.bash_aliases"


echo ">>> Bash aliases configured."

# ------------------------------------------------------------
# Apache
# ------------------------------------------------------------

echo ">>> Configuring Apache..."

sudo rm -f /var/www/html/index.html

sudo a2dissite 000-default.conf 2>/dev/null || true

sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers

# ------------------------------------------------------------
# MJPG Streamer
# ------------------------------------------------------------

echo ">>> Installing mjpg-streamer..."

if [ ! -d "$MJPG_DIR" ]; then

    cd "$HOME"

    git clone \
        https://github.com/jacksonliam/mjpg-streamer.git

fi

cd "$MJPG_DIR/mjpg-streamer-experimental"

rm -rf _build

make

sudo make install

# ------------------------------------------------------------
# MJPG streamer Apache configuration
# ------------------------------------------------------------

echo ">>> Creating webcam Apache configuration..."

sudo tee /etc/apache2/sites-available/stream.conf > /dev/null <<'EOF'
<VirtualHost *:80>

    ServerName webcam.local

    ProxyPreserveHost On
    ProxyRequests Off

    ProxyPass /stream http://127.0.0.1:8090/
    ProxyPassReverse /stream http://127.0.0.1:8090/

</VirtualHost>
EOF

sudo a2ensite stream.conf

# ------------------------------------------------------------
# IcronisOS repository
# ------------------------------------------------------------

echo ">>> Installing IcronisOS..."

sudo mkdir -p /var/www/html

if [ -d "$APP_DIR/.git" ]; then

    echo "Existing IcronisOS repository found."

    sudo chown -R "$USERNAME:$USERNAME" "$APP_DIR"

    cd "$APP_DIR"

    git pull

else

    rm -rf "$TEMP_DIR"

    mkdir -p "$TEMP_DIR"

    cd "$TEMP_DIR"

    git clone "$REPO"

    sudo rm -rf "$APP_DIR"

    sudo mv IcronisOS "$APP_DIR"

    sudo chown -R "$USERNAME:$USERNAME" "$APP_DIR"

fi

# ------------------------------------------------------------
# Node.js
# ------------------------------------------------------------

echo ">>> Checking Node.js..."

if ! command -v node >/dev/null 2>&1; then

    echo "Node.js not installed."

    echo "Installing Node.js 20..."

    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

    sudo apt install -y nodejs

fi

echo "Node:"
node -v

echo "NPM:"
npm -v

# ------------------------------------------------------------
# PM2
# ------------------------------------------------------------

echo ">>> Installing PM2..."

if ! command -v pm2 >/dev/null 2>&1; then
    sudo npm install -g pm2
fi

# ------------------------------------------------------------
# IcronisOS dependencies
# ------------------------------------------------------------

echo ">>> Installing IcronisOS npm dependencies..."

cd "$APP_DIR"

npm install

# ------------------------------------------------------------
# pigpio C library
# ------------------------------------------------------------

echo ">>> Installing pigpio C library..."

PIGPIO_DIR="/tmp/pigpio"

rm -rf "$PIGPIO_DIR"

git clone \
    https://github.com/joan2937/pigpio.git \
    "$PIGPIO_DIR"

cd "$PIGPIO_DIR"

make

# pigpio's make install also attempts to install its
# obsolete Python distutils package on Debian 13.
#
# The C libraries are installed BEFORE that Python step.
#
# Therefore don't let the obsolete Python installation
# prevent the script from continuing.

sudo make install || true

sudo ldconfig

# ------------------------------------------------------------
# Verify pigpio
# ------------------------------------------------------------

echo ">>> Checking pigpio..."

if command -v pigpiod >/dev/null 2>&1; then

    pigpiod -v

else

    echo "ERROR: pigpiod was not installed."
    exit 1

fi

# ------------------------------------------------------------
# Rebuild Node pigpio module
# ------------------------------------------------------------

echo ">>> Rebuilding Node pigpio module..."

cd "$APP_DIR"

npm rebuild pigpio

echo ">>> Testing Node pigpio..."

node -e "const pigpio=require('pigpio'); console.log('pigpio loaded:', typeof pigpio.Gpio)"

# ------------------------------------------------------------
# IcronisOS Apache configuration
# ------------------------------------------------------------

echo ">>> Creating IcronisOS Apache configuration..."

sudo tee /etc/apache2/sites-available/icronisos.conf > /dev/null <<EOF
<VirtualHost *:80>

    ServerName localhost

    DocumentRoot $APP_DIR

    ProxyPreserveHost On
    ProxyRequests Off

    ProxyPass / http://127.0.0.1:$NODE_PORT/
    ProxyPassReverse / http://127.0.0.1:$NODE_PORT/

    <Directory $APP_DIR>
        Require all granted
        AllowOverride All
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/icronisos-error.log
    CustomLog \${APACHE_LOG_DIR}/icronisos-access.log combined

</VirtualHost>
EOF

sudo a2ensite icronisos.conf

# ------------------------------------------------------------
# Test Apache
# ------------------------------------------------------------

echo ">>> Testing Apache configuration..."

sudo apache2ctl configtest

sudo systemctl restart apache2

# ------------------------------------------------------------
# Start IcronisOS with PM2
# ------------------------------------------------------------

echo ">>> Starting IcronisOS..."

cd "$APP_DIR"

pm2 delete icronis 2>/dev/null || true

pm2 start icronis-os.js --name icronis

pm2 save

# ------------------------------------------------------------
# PM2 startup
# ------------------------------------------------------------

echo ">>> Configuring PM2 startup..."

STARTUP_COMMAND="$(pm2 startup systemd -u "$USERNAME" --hp "$HOME" | grep '^sudo env' | tail -1 || true)"

if [ -n "$STARTUP_COMMAND" ]; then
    eval "$STARTUP_COMMAND"
fi

pm2 save

# ------------------------------------------------------------
# Permissions
# ------------------------------------------------------------

echo ">>> Fixing application ownership..."

sudo chown -R "$USERNAME:$USERNAME" "$APP_DIR"

# ------------------------------------------------------------
# Final status
# ------------------------------------------------------------

echo
echo "============================================================"
echo "             ICRONISOS INSTALL COMPLETE"
echo "============================================================"
echo

echo "Application:"
echo "    $APP_DIR"

echo "Node port:"
echo "    $NODE_PORT"

echo "Webcam port:"
echo "    $MJPG_PORT"

echo
echo "PM2:"
pm2 status

echo
echo "Apache:"
sudo systemctl status apache2 --no-pager -l

echo
echo "Useful commands:"
echo
echo "    icronis"
echo "    pm2 status"
echo "    pm2 logs icronis"
echo "    sudo tail -f /var/log/apache2/icronisos-error.log"
echo
echo "============================================================"