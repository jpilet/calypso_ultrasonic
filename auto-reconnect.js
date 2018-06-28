// This is an example showing how to access Calypso Ultrasonic data
var calypso = require('./index');

function Watchdog(cb) {
  this.cb = cb;
  this.timeout = undefined;
}

Watchdog.prototype.next = function(t) {
  if (this.timeout) {
    clearTimeout(this.timeout);
  }
  this.timeout = setTimeout(this.cb, t);
};

function peripheralDiscovered(err, peripheral) {
  if (err) {
    console.warn(err);
    return;
  }
  console.log('found peripheral:', peripheral.address);

  var watchdog = new Watchdog(function() {
    console.warn('Timeout from calypso ' + peripheral.address);
    peripheral.disconnect();
    calypso.scan(peripheralDiscovered);
  });

  // we will try to connect during 1 minute
  watchdog.next(60 * 1000);

  calypso.stopScanning();
  calypso.connect(peripheral, function(err) {
    if (err) {
      console.warn(err);
      return;
    }
    peripheral.listenData(function(err, sensorData) {
      if (err) {
        console.warn('Device error, trying to reconnect: ', err);
        peripheral.disconnect();
        calypso.scan(peripheralDiscovered);
        return;
      }
      console.log(sensorData);

      // we expect the next data batch to arrive within 5 seconds
      watchdog.next(5 * 1000);
    });
  });
}

calypso.setDiscoveredCallback(peripheralDiscovered);
calypso.scan(function(err) { console.warn(err); });

