// This is an example showing how to access Calypso Ultrasonic data
var calypso = require('./index');

function peripheralDiscovered(err, peripheral) {
  if (err) {
    console.warn(err);
    return;
  }
  //
  // The advertisment data contains a name, power level (if available),
  // certain advertised service uuids, as well as manufacturer data,
  // which could be formatted as an iBeacon.
  //
  console.log('found peripheral:', peripheral.advertisement);

  calypso.stopScanning();
  calypso.connect(peripheral, function(err, sensorData) {
    if (err) {
      console.warn('Device error, trying to reconnect: ', err);
      calypso.scan(peripheralDiscovered);
      return;
    }
    console.log(sensorData);
  });
}

calypso.scan(peripheralDiscovered);

