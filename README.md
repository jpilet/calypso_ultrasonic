Calypso Ultrasonic node interface
=================================

This is an example of how to read the Calypso Ultrasonic wind sensor from nodejs.

Quick test:
```
npm install
node connect
```

[example: see connect.js](connect.js)

API
---


## scan(callback)

Searches for a calypso ultrasonic peripheral.
Whenever one is found, the callback gets called.
The callback takes the form:
``` function(err, peripheral){} ```

## stopScanning(cb)

Stop searching for new devices.

## connect(peripheral, cb)

Connects to the wind sensor and start listening for sensor data.
The callback is:
``` function(err, sensorData) ```
Sensor data has the following fields:

| Field      | Units           |
|------------|-----------------|
|  aws       | knots           |
|  awa       | degrees         |
|battery     | percent         |
|temperature | Celsius degrees |
|  roll      | degrees         |
|  pitch     | degrees         |
|  heading   | degrees         |

## disconnect(peripheral, cb)

Disconnect from a device
