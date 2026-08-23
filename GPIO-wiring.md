
# GPIO wiring

The resulting seven signal outputs are:
```bash
GPIO 12  → YAW
GPIO 13  → ROLL LEFT
GPIO 18  → ROLL RIGHT
GPIO 19  → PITCH
GPIO 22  → FLAP LEFT
GPIO 23  → FLAP RIGHT
GPIO 24  → ESC
```

Those are BCM GPIO numbers, not physical header-pin numbers.

The corresponding physical pins are:

```bash
GPIO 12 → physical 32
GPIO 13 → physical 33
GPIO 18 → physical 12
GPIO 19 → physical 35
GPIO 22 → physical 15
GPIO 23 → physical 16
GPIO 24 → physical 18
```