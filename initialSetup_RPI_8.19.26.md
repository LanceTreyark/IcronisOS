   ```bash
   1  sudo apt update && sudo apt upgrade
   2  sudo shutdown -h now
   3  sudo apt autoremove
   4  sudo apt install snapd 
   5  sudo snap install core 
   6  sudo snap install btop 
   7  btop
   8  exit
   9  btop
   10  nano .bash_aliases
   11  source ~/.bash_aliases
   12  bb
   13  sudo apt install apache2
   14  sudo a2enmod proxy
   15  sudo a2enmod proxy_http
   16  sudo systemctl restart apache2
   17  sudo apt install openvpn -y
   18  sudo apt install apache2 libjpeg-dev gcc make git
   19  git clone https://github.com/jacksonliam/mjpg-streamer.git
   20  cd mjpg-streamer/mjpg-streamer-experimental
   21  make
   22  ls
   23  cd _build && cmake
   24  make
   25  ls
   26  sudo apt install -y cmake build-essential
   27  sudo apt install -y libjpeg-dev libv4l-dev
   28  cd ~/mjpg-streamer/mjpg-streamer-experimental
   29  rm -rf _build
   30  make
   31  sudo make install
   32  ls /dev/video*
   33  mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 30" -o
   34  "output_http.so -w ./www"
   35  sudo nano /etc/apache2/sites-available/stream.conf
   36  sudo a2ensite stream.conf
   37  sudo systemctl restart apache2
   38  sudo a2ensite stream.conf
   39  sudo nano /etc/apache2/sites-available/stream.conf
   40  sudo apache2ctl configtest
   41  sudo nano /etc/apache2/sites-available/stream.conf
   42  sudo systemctl restart apache2
   43  sudo apache2ctl configtest
   44  mjpg_streamer -i "input_uvc.so" -o "output_http.so -p 8090"
   45  cd ~/mjpg-streamer/mjpg-streamer-experimental
   46  mjpg_streamer   -i "input_uvc.so"   -o "output_http.so -p 8090 -w ./www"
   47  nano ~/.bash_aliases
   48  realias
   49  startvideo
   50  history

   ```