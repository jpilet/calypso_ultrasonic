// This is an example showing how to calibrate the magnetic compass of
// a Calypso Ultrasonic wind sensor.

var calypso = require('./index');

function peripheralDiscovered(err, peripheral) {
  if (err) {
    console.warn(err);
    return;
  }
  console.log('found peripheral:', peripheral.address);

  calypso.stopScanning();
  calypso.connect(peripheral, function(err) {
    if(err) {
      console.warn(err);
      return;
    }
    peripheral.calibrate(function(err) {
      if (err) {
        console.warn(err);
        return;
      } else {
        console.log('Done!');
      }
    });
  });
}

calypso.setDiscoveredCallback(peripheralDiscovered);
calypso.scan(function(err) { console.warn(err); });

