// This is an example showing how to access Calypso Ultrasonic data
var calypso = require('./index');

function peripheralDiscovered(err, peripheral) {
  if (err) {
    console.warn(err);
    return;
  }
  console.log('found peripheral:', peripheral.address);

  calypso.stopScanning();
  calypso.connect(peripheral, function(err) {
    if (err) {
      console.warn(err);
      return;
    }
    peripheral.listenData(handleData);
  });
}

function handleData(err, sensorData) {
  if (err) {
    console.warn('Device error, trying to reconnect: ', err);
    calypso.scan(peripheralDiscovered);
    return;
  }
  console.log(sensorData);
}

calypso.scan(peripheralDiscovered);

