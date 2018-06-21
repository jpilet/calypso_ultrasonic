var noble = require('noble');

var deviceInfoServiceUuid = '180a';
var manufacturerNameCharateristicUuid = '2a29'; // String (Calypso)
var modelNumberCharateristicUuid  /* (UP10) */  = '2a24';
var serialNumberCharateristicUuid  /* String (No used) */ = '2a25';
var hardwareRevisionCharateristicUuid  /* String (No used) */ = '2a27';
var firmwareRevisionCharateristicUuid  /* String (0.47) */ = '2a26';
var softwareRevisionCharateristicUuid  /* String (No used) */ = '2a28';


var dataServiceUuid = '180d';
var notifyCharacteristicUuid = '2a39';
var statusCharacteristicUuid = 'a001';
var dataRateCharacteristicUuid = 'a002';
var sensorsCharacteristicUuid = 'a003';
var angleOffsetCharacteristicUuid = 'a007';
var eCompassCalibrationCharacteristicUuid = 'a008';
var windSpeedCorrectionCharacteristicUuid = 'a009';
var firmwareUpdateCharacteristicUuid = 'a00a';

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    //
    // Once the BLE radio has been powered on, it is possible
    // to begin scanning for services. Pass an empty array to
    // scan for all services (uses more time and power).
    //
    console.log('scanning...');
    noble.startScanning([dataServiceUuid], false);
  }
  else {
    noble.stopScanning();
  }
})

noble.on('discover', function(peripheral) {
  // we found a peripheral, stop scanning
  noble.stopScanning();

  //
  // The advertisment data contains a name, power level (if available),
  // certain advertised service uuids, as well as manufacturer data,
  // which could be formatted as an iBeacon.
  //
  console.log('found peripheral:', peripheral.advertisement);
  //
  // Once the peripheral has been discovered, then connect to it.
  //
  peripheral.connect(function(err) {
    //
    // Once the peripheral has been connected, then discover the
    // services and characteristics of interest.
    //
    var notifyCharacteristic = undefined;
    peripheral.discoverSomeServicesAndCharacteristics(
        [dataServiceUuid, deviceInfoServiceUuid ],
        [notifyCharacteristicUuid, sensorsCharacteristicUuid, softwareRevisionCharateristicUuid],
        function(error, services, characteristics) {
          characteristics.forEach(function(characteristic) {
            console.log('found characteristic:', characteristic.uuid);
            if (characteristic.uuid == notifyCharacteristicUuid) {
              notifyCharacteristic = characteristic;
            } else if (characteristic.uuid == sensorsCharacteristicUuid) {
              configure(characteristic, true);
            } else if (characteristic.uuid == softwareRevisionCharateristicUuid) {
              readFirmwareVersion(characteristic);
            } else {
              console.log('unknown characteristic: ', characteristic.uuid);
            }
          });
          if (notifyCharacteristic) {
            listenData(notifyCharacteristic);
          } else {
            console.log('missing characteristics, disconnecting.');
            peripheral.disconnect(function(err) {
              if (err) {
                console.warn(err);
              }
              console.log('disconnected.');
            });
          }
        }
    ); // discover characteristics
  })  // connect
});  // discover devices

function listenData(notifyCharacteristic) {
  if (!notifyCharacteristic) {
    return;
  }

  notifyCharacteristic.on('read', function(data, isNotification) {
    var reading = {
      aws: data.readUInt16LE(0) * (60*60/1852 /100),  // knots
      awa: data.readUInt16LE(2),  // degrees
      battery: data.readUInt8(4) * 10,  // percent
      temperature: data.readUInt8(5) - 100,  // Celsius degrees
      roll: (data.readUInt8(6) ? data.readUInt8(6) - 90 : undefined),  // degrees
      pitch: (data.readUInt8(7) ? data.readUInt8(7) - 90 : undefined),  // degrees
      heading: (data.readUInt16LE(8) ? 360 - data.readUInt16LE(8) : undefined)  // degrees
    };
    console.warn(reading);
  });
  notifyCharacteristic.subscribe(function(err) {
    if (err) {
      console.warn('while subscribing to notifyCharacteristic: ', err);
    }
  });
}

function configure(sensorsCharacteristic, onoff) {
  var buffer = Buffer.from( [onoff ? 1 : 0] );
  sensorsCharacteristic.write(buffer, false, function(err) {
    if (err) {
      console.warn('while writing to sensorsCharacteristic: ', err);
    }
  });
}

function readFirmwareVersion(characteristic) {
  characteristic.read(function(err, data) {
    if (err) {
      console.warn('While reading firmware version: ', err);
      return;
    }

    console.log('Firmware version: ', data.toString('ascii'));
    console.log(data);
  });
}
