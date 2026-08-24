const int sensorPin = A0;

float calibrationFactor = 3.31;

void setup() {
    Serial.begin(9600);
}

void loop() {

    int rawValue = analogRead(sensorPin);

    float a0Voltage =
        rawValue * (5.0 / 1023.0);

    float batteryVoltage =
        a0Voltage * calibrationFactor;

    Serial.print("Battery Voltage: ");
    Serial.println(batteryVoltage, 2);

    delay(1000);
}