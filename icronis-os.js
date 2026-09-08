const express = require('express');
const bodyParser = require('body-parser');
const { SerialPort, ReadlineParser } = require('serialport');
const { createServer } = require('http');
const { Server } = require('socket.io');
const pigpio = require('pigpio');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const Gpio = pigpio.Gpio;


// ============================================================
// GPIO CONFIGURATION
// GPIO NUMBERS, NOT PHYSICAL PIN NUMBERS
// ============================================================

const PINS = {
    yaw:       12,
    rollLeft:  13,
    rollRight: 18,
    pitch:     19,
    flapLeft:  22,
    flapRight: 23,
    esc:        24
};


// ============================================================
// PWM SETTINGS
// ============================================================

const PWM_MIN = 1000;
const PWM_CENTER = 1500;
const PWM_MAX = 2000;

const FLAPS_UP = 1500;
const FLAPS_DOWN = 2000;

const THROTTLE_STEP = 5;

// Controller communication timeout.
// If no packet arrives for this long, failsafe activates.
const FAILSAFE_TIMEOUT_MS = 500;


// ============================================================
// GPIO INITIALIZATION
// ============================================================

const yawServo =
    new Gpio(PINS.yaw, { mode: Gpio.OUTPUT });

const rollLeftServo =
    new Gpio(PINS.rollLeft, { mode: Gpio.OUTPUT });

const rollRightServo =
    new Gpio(PINS.rollRight, { mode: Gpio.OUTPUT });

const pitchServo =
    new Gpio(PINS.pitch, { mode: Gpio.OUTPUT });

const flapLeftServo =
    new Gpio(PINS.flapLeft, { mode: Gpio.OUTPUT });

const flapRightServo =
    new Gpio(PINS.flapRight, { mode: Gpio.OUTPUT });

const esc =
    new Gpio(PINS.esc, { mode: Gpio.OUTPUT });


const servos = {
    yaw: yawServo,
    rollLeft: rollLeftServo,
    rollRight: rollRightServo,
    pitch: pitchServo,
    flapLeft: flapLeftServo,
    flapRight: flapRightServo
};


// ============================================================
// AIRCRAFT STATE
// ============================================================

let throttlePercent = 0;

let flapsDeployed = false;

// Start with motor KILLED.
let motorKilled = true;

let lastJoystickPacket = 0;


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


// Convert 0-100% throttle into 1000-2000 µs.
function percentToPwm(percent) {

    percent = clamp(
        Number(percent) || 0,
        0,
        100
    );

    return Math.round(
        PWM_MIN +
        (percent / 100) *
        (PWM_MAX - PWM_MIN)
    );
}


// Convert stick value -100...+100 into
// 1000...2000 µs.
function axisToPwm(value, reverse = false) {

    let axis = clamp(
        Number(value) || 0,
        -100,
        100
    );

    if (reverse) {
        axis *= -1;
    }

    // Small center dead zone.
    if (Math.abs(axis) < 5) {
        axis = 0;
    }

    return Math.round(
        PWM_CENTER +
        (axis / 100) * 500
    );
}


// ============================================================
// MOTOR CONTROL
// ============================================================

function setThrottle(percent) {

    throttlePercent = clamp(
        Math.round(percent),
        0,
        100
    );

    // Kill always overrides throttle.
    if (motorKilled) {
        esc.servoWrite(PWM_MIN);
        return;
    }

    esc.servoWrite(
        percentToPwm(throttlePercent)
    );
}


function killMotor() {

    motorKilled = true;
    throttlePercent = 0;

    // Immediate minimum ESC signal.
    esc.servoWrite(PWM_MIN);

    console.log('!!! MOTOR KILL !!!');
}


function armMotor() {

    // Clearing the kill does NOT start the motor.
    // Throttle remains at 0%.
    motorKilled = false;
    throttlePercent = 0;

    esc.servoWrite(PWM_MIN);

    console.log(
        'Motor control armed - throttle 0%'
    );
}


// ============================================================
// FLAPS
// ============================================================

function setFlaps(deployed) {

    flapsDeployed = !!deployed;

    const pwm = flapsDeployed
        ? FLAPS_DOWN
        : FLAPS_UP;

    flapLeftServo.servoWrite(pwm);
    flapRightServo.servoWrite(pwm);

    console.log(
        `Flaps: ${flapsDeployed ? 'DOWN' : 'UP'}`
    );
}


function toggleFlaps() {

    setFlaps(!flapsDeployed);
}


// ============================================================
// INITIAL SAFE STATE
// ============================================================

yawServo.servoWrite(PWM_CENTER);

rollLeftServo.servoWrite(PWM_CENTER);
rollRightServo.servoWrite(PWM_CENTER);

pitchServo.servoWrite(PWM_CENTER);

setFlaps(false);

killMotor();


// ============================================================
// SOCKET.IO
// ============================================================

io.on('connection', (socket) => {

    console.log('Browser connected');

    socket.emit('aircraftState', {
        throttlePercent,
        flapsDeployed,
        motorKilled
    });

    socket.on('disconnect', () => {

        console.log('Browser disconnected');

        // Losing the browser immediately kills motor.
        killMotor();
    });
});


// ============================================================
// EXPRESS
// ============================================================

app.use(bodyParser.json());

app.set(
    'view engine',
    'ejs'
);

app.set(
    'views',
    path.join(__dirname, 'views')
);

app.use(
    '/resources',
    express.static(
        path.join(__dirname, 'resources')
    )
);


app.get('/', (req, res) => {

    res.render('home');

});

app.get('/fpv', (req, res) => {

    res.render('fpv');

});

app.get('/passenger', (req, res) => {

    res.render('passenger');

});
// ============================================================
// JOYSTICK API
// ============================================================

app.post('/joystick', (req, res) => {

    try {

        const {
            yaw,
            roll,
            pitch,

            throttleUp,
            throttleDown,

            flapsToggle,

            motorKill,
            arm
        } = req.body;


        // We successfully received a controller packet.
        lastJoystickPacket = Date.now();


        // ====================================================
        // MOTOR KILL
        // ====================================================

        if (motorKill) {

            killMotor();

        }


        // ====================================================
        // ARM
        // A button clears the kill.
        // It does NOT increase throttle.
        // ====================================================

        if (arm && motorKilled) {

            armMotor();

        }


        // ====================================================
        // THROTTLE
        // ====================================================

        if (!motorKilled) {

            if (throttleUp) {

                setThrottle(
                    throttlePercent +
                    THROTTLE_STEP
                );

            }

            if (throttleDown) {

                setThrottle(
                    throttlePercent -
                    THROTTLE_STEP
                );

            }

        }


        // ====================================================
        // FLAPS
        // ====================================================

        if (flapsToggle) {

            toggleFlaps();

        }


        // ====================================================
        // YAW
        // Left stick X
        // ====================================================

        if (typeof yaw === 'number') {

            servos.yaw.servoWrite(
                //axisToPwm(yaw) Original is backwards, so we reverse it using the second parameter "true"
                axisToPwm(yaw, true)
            );

        }


        // ====================================================
        // ROLL
        //
        // Two servos move in opposite directions.
        // ====================================================

        if (typeof roll === 'number') {

            const rollPwm =
                axisToPwm(roll);

            servos.rollLeft.servoWrite(
                rollPwm
            );

            servos.rollRight.servoWrite(
                PWM_CENTER -
                (rollPwm - PWM_CENTER)
            );

        }


        // ====================================================
        // PITCH
        // ====================================================

        if (typeof pitch === 'number') {

            servos.pitch.servoWrite(
                axisToPwm(pitch)
            );

        }


        // ====================================================
        // RESPONSE
        // ====================================================

        res.status(200).json({

            success: true,

            throttlePercent,

            flapsDeployed,

            motorKilled

        });

    }

    catch (error) {

        console.error(
            'Joystick error:',
            error
        );

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});


// ============================================================
// FAILSAFE
// ============================================================

setInterval(() => {

    if (
        lastJoystickPacket !== 0 &&
        Date.now() - lastJoystickPacket >
        FAILSAFE_TIMEOUT_MS
    ) {

        console.log(
            'FAILSAFE: controller communication lost'
        );

        killMotor();

        yawServo.servoWrite(
            PWM_CENTER
        );

        rollLeftServo.servoWrite(
            PWM_CENTER
        );

        rollRightServo.servoWrite(
            PWM_CENTER
        );

        pitchServo.servoWrite(
            PWM_CENTER
        );

        lastJoystickPacket = 0;

    }

}, 100);

// ============================================================
// SERIAL BATTERY VOLTAGE
// ============================================================

const port = new SerialPort({
    path: '/dev/ttyUSB0',
    baudRate: 9600
});

const parser = port.pipe(
    new ReadlineParser({
        delimiter: '\r\n'
    })
);

parser.on('data', (data) => {

    const line = data.trim();

    console.log('SERIAL RAW:', JSON.stringify(line));

    const match = line.match(
        /Battery Voltage:\s*([\d.]+)/
    );

    if (!match) {
        return;
    }

    const voltage = parseFloat(match[1]);

    if (!Number.isNaN(voltage)) {

        console.log(
            'BATTERY:',
            voltage.toFixed(2),
            'V'
        );

        io.emit(
            'batteryVoltage',
            voltage.toFixed(2)
        );

    }

});

port.on('error', (error) => {

    console.error(
        'SERIAL ERROR:',
        error.message
    );

});
// ============================================================
// START SERVER
// ============================================================

httpServer.listen(
    3003,
    '0.0.0.0',
    () => {

        console.log(
            'Icronis RC aircraft controller running on port 3003'
        );

        console.log(
            'Initial state: MOTOR KILLED / THROTTLE 0%'
        );

    }
);