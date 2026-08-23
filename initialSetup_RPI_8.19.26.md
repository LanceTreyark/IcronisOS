   ```bash
    1  sudo apt update && sudo apt upgrade
    2  sudo shutdown -h now
    3  sudo apt autoremove
    4  sudo apt install snapd 
    5  sudo snap install core 
    6  sudo snap install btop 
    7  btop
    8  exit
    9  cd /var/www
   10  ls
   11  sudo apt install -y git
   12  git --version
   13  node --version
   14  sudo apt install -y nodejs npm
   15  sudo npm install -g pm2
   16  git clone git@github.com:LanceTreyark/IcronisOS.git
   17  sudo mkdir temp
   18  sudo -u
   19  id
   20  sudo chown -R 1000:1000 temp
   21  cd temp
   22  git clone git@github.com:LanceTreyark/IcronisOS.git
   23  bb
   24  git clone https://github.com/LanceTreyark/IcronisOS.git
   25  ls
   26  sudo mv IcronisOS /var/www/
   27  cd ..
   28  cd IcronisOS
   29  ls
   30  npm install
   31  sudo apt install -y pigpio
   32  sudo apt install pigpio
   33  cat /etc/os-release
   34  grep -R "pigpio\|GPIO\|gpio" -n --exclude-dir=node_modules .
   35  ls
   36  ls node_modules
   37  sudo pm2 start sentinel.js --name sentinel
   38  sudo pm2 delete sentinel
   39  ls
   40  sudo rm sentinel.js
   41  sudo pm2 start icronis-os.js --name icronis
   42  bb
   43  sudo nano /etc/apache2/sites-available/icronisos.conf
   44  sudo a2enmod proxy
   45  sudo a2enmod proxy_http
   46  sudo a2enmod headers
   47  sudo a2ensite icronisos.conf
   48  sudo apache2ctl configtest
   49  sudo systemctl reload apache2
   50  sudo nano /etc/apache2/sites-available/icronisos.conf
   51  sudo systemctl reload apache2
   52  sudo nano /etc/apache2/sites-available/icronisos.conf
   53  sudo systemctl reload apache2
   54  sudo pm2 delete icronis
   55  cd ..
   56  ls
   57  mv IcronisOS html
   58  sudo mv IcronisOS html
   59  cd html
   60  ls
   61  sudo rm index.html
   62  cd IcronisOS
   63  sudo nano /etc/apache2/sites-available/icronisos.conf
   64  sudo pm2 start sentinel.js --name sentinel
   65  sudo nano /etc/apache2/sites-available/icronisos.conf
   66  sudo pm2 start icronis-os.js --name icronis
   67  sudo systemctl reload apache2
   68  sudo nano /etc/apache2/sites-available/icronisos.conf
   69  sudo systemctl reload apache2
   70  sudo a2dissite 000-default.conf
   71  sudo systemctl reload apache2
   72  sudo nano /etc/apache2/sites-available/icronisos.conf
   73  sudo systemctl reload apache2
   74  sudo nano /etc/apache2/sites-available/icronisos.conf
   75  sudo ss -ltnp | grep :3003
   76  curl http://127.0.0.1:3003/
   77  sudo pm2 logs
   78  sudo stop icronis
   79  sudo pm2 stop icronis
   80  sudo apt update && sudo apt upgrade
   81  sudo apt install -y build-essential python3
   82  npm build pigpio
   83  rm -rf node_modules/pigpio/build
   84  npm rebuild pigpio
   85  node -e "const pigpio=require('pigpio'); console.log('pigpio loaded:', typeof pigpio.Gpio)"
   86  node -v
   87  uname -m
   88  dpkg --print-architecture
   89  ldconfig -p | grep pigpio
   90  find /usr /lib -iname '*pigpio*' 2>/dev/null
   91  ldd /var/www/html/IcronisOS/node_modules/pigpio/build/Release/pigpio.node
   92  npm list pigpio
   93  grep -n -A40 -B5 "Installation" node_modules/pigpio/README.md
   94  sudo apt install -y git build-essential
   95  cd /tmp
   96  git clone https://github.com/joan2937/pigpio.git
   97  cd pigpio
   98  make
   99  sudo make install
  100  sudo ldconfig
  101  ldconfig -p | grep pigpio
  102  pigpiod -v
  103  cd /var/www/html/IcronisOS
  104  npm rebuild pigpio
  105  node -e "const pigpio=require('pigpio'); console.log('pigpio loaded:', typeof pigpio.Gpio)"
  106  pm2 restart icronis
  107  sudo pm2 restart icronis
  108  bb
  109  sudo pm2 stop icronis
  110  bb
  111  sudo pm2 restart icronis
  112  history

   ```