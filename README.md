Calypso Ultrasonic node interface
=================================

This is an example of how to read the Calypso Ultrasonic wind sensor from nodejs.

Quick test:
```
npm install
node connect
```

## Examples
[Basic connection](connect.js)
[Auto-reconnect after connection loss](auto-reconnect.js)
[Calibration](calibrate.js)

API
---

## scan(cb)

Start searching for a calypso ultrasonic peripheral.
The optional callback is only called if there is an error.
See [setDiscoveredCallback](#setdiscoveredcallback-callback).

## stopScanning(cb)

Stop searching for new devices.


## setDiscoveredCallback(callback)

Whenever a Calypso wind sensor is found, the callback gets called.
Searches only starts once [scan()](#scan-cb) has been called.
The callback takes the form:
``` function(err, peripheral){} ```

See [Noble's peripheral documentation](https://github.com/noble/noble#peripheral).
The peripheral object will have two calypso-specific methods, listenData() and calibrate().

## peripheral.listenData(cb)

Subscribe to wind sensor data stream.
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

## peripheral.calibrate(cb)

Run the calibration procedure. See [the calibration example](calibrate.js)
The callback has the following signature: ```cb(err)```. If ```err``` is
undefined or null, calibration succeeded and was saved.

