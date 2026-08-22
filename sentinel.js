const express = require('express');
const bodyParser = require('body-parser');
const { SerialPort, ReadlineParser } = require('serialport');
//const http = require('http');
const { createServer } = require('http');
const { Server } = require('socket.io');
const pigpio = require('pigpio');

const app = express();
//const server = http.createServer(app);

const httpServer = createServer(app);
const io = new Server(httpServer);
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Serve the resources directory as a static folder
app.use('/resources', express.static(path.join(__dirname, 'resources')));

app.get("/", (req, res) => {
    res.render("home");
});

// GPIO Pin Configuration (Use GPIO numbers, not physical pin numbers)
const PWM_PINS = [12, 13, 18, 19, 22, 23]; // GPIO numbers for 6 servos
const Gpio = pigpio.Gpio;

// Initialize GPIO pins for PWM
const servos = PWM_PINS.map(pin => new Gpio(pin, { mode: Gpio.OUTPUT }));

// Parse JSON request bodies
app.use(bodyParser.json());

// Convert joystick value (0-100) to PWM pulse width for servos
const joystickToPwm = (value) => Math.floor(1000 + (value / 100) * 1000);

// Set initial servo positions
servos.forEach((servo, index) => {
    if (index === 5) {
        servo.servoWrite(1000); // Ensure servo 5 starts at 1000µs
    } else {
        servo.servoWrite(1500); // Neutral position for others
    }
});

let bButtonState = false; // Track the B button state

// Endpoint to handle joystick data
app.post('/joystick', (req, res) => {
    const { leftStick, rightStick, auxChannels, buttons } = req.body;

    try {
        // Map joystick values to PWM signals
        servos[0].servoWrite(joystickToPwm(leftStick.x)); // Servo 1 (left stick horizontal)
        servos[1].servoWrite(joystickToPwm(100 - leftStick.y)); // Servo 2 (left stick vertical) //Inverted
        servos[2].servoWrite(joystickToPwm(rightStick.x)); // Servo 3 (right stick horizontal)
        servos[3].servoWrite(joystickToPwm(rightStick.y)); // Servo 4 (right stick vertical)


        //Toggle logic for b button:


        // Handle B button press
        if (buttons && buttons.b !== undefined) {
            if (buttons.b) { // If button is pressed
                bButtonState = !bButtonState; // Toggle state
                console.log(`B Button Toggled: ${bButtonState}`);
                servos[5].servoWrite(bButtonState ? 2000 : 1000); // Toggle between 2000µs and 1000µs
            }
        } else {
            console.log('B Button (buttons.b) not received in request.');
        }

        //console.log('PWM signals updated successfully.');
        //res.status(200).send({ message: 'Joystick data processed successfully.' });
        res.status(200).send({
            message: 'Joystick data processed successfully.',
            bButtonState: bButtonState  // Send current state to frontend
        });

    } catch (error) {
        console.error('Error processing joystick data:', error);
        res.status(500).send({ message: 'Failed to process joystick data.', error: error.message });
    }
});

// Serial port setup for real USB data
const port = new SerialPort({
    path: '/dev/ttyUSB0', // USB-connected device
    baudRate: 9600 // Adjust if your device uses a different baud rate (e.g., 115200)
});
const parser = new ReadlineParser();
port.pipe(parser);

parser.on('data', (data) => {
    console.log(`Raw Serial Data: ${data}`); // Log raw input
    let trimmedData = data.trim();
    console.log(`Trimmed Data: ${trimmedData}`);

    let cleanVoltage = trimmedData.replace(/[^0-9.]/g, ''); // Remove non-numeric characters
    let voltage = parseFloat(cleanVoltage);

    if (!isNaN(voltage)) {
        io.emit('batteryVoltage', cleanVoltage); // Emit as a string
    } else {
        console.log('Invalid voltage data:', trimmedData);
    }
});


// Start the server
httpServer.listen(3003, '0.0.0.0', () => {
    console.log('Server running on port 3003, all interfaces');
});

