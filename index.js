var noble = require('noble');
var Peripheral = require('noble/lib/peripheral.js');

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

module.exports.stopScanning = function () {
  noble.stopScanning();
};

module.exports.setDiscoveredCallback = function(cb) {
  noble.on('discover', function(peripheral) {
    if (peripheral.advertisement.localName.match(/ULTRASONIC/)) {
      cb(undefined, peripheral);
    }
  });
}

module.exports.scan = function (cb, allowDuplicates) {
  if (noble.state == 'poweredOn') {
    noble.startScanning([dataServiceUuid], allowDuplicates);
  } else {
    noble.on('stateChange', function(state) {
      if (state === 'poweredOn') {
        //
        // Once the BLE radio has been powered on, it is possible
        // to begin scanning for services. Pass an empty array to
        // scan for all services (uses more time and power).
        //
        noble.startScanning([dataServiceUuid], allowDuplicates);
      }
      else {
        noble.stopScanning();
        cb(new Error(state));
      }
    });
  }
};

module.exports.connect = function(peripheral, cb) {
  // Once the peripheral has been discovered, then connect to it.
  peripheral.connect(function(err) {
    //
    // Once the peripheral has been connected, then discover the
    // services and characteristics of interest.
    //
    var notifyCharacteristic = undefined;
    peripheral.discoverSomeServicesAndCharacteristics(
        [dataServiceUuid, deviceInfoServiceUuid ],
        [
          notifyCharacteristicUuid,
          sensorsCharacteristicUuid,
          softwareRevisionCharateristicUuid,
          eCompassCalibrationCharacteristicUuid
        ],
        function(error, services, characteristics) {
          characteristics.forEach(function(characteristic) {
            if (characteristic.uuid == notifyCharacteristicUuid) {
              peripheral.listenData = function(cb) {
                listenData(characteristic, cb);
              };
            } else if (characteristic.uuid == sensorsCharacteristicUuid) {
              configure(characteristic, true, cb);
            } else if (characteristic.uuid == eCompassCalibrationCharacteristicUuid) {
              peripheral.calibrate = function(cb) {
                calibrate(characteristic, cb);
              };
            } else if (characteristic.uuid == softwareRevisionCharateristicUuid) {
              readFirmwareVersion(characteristic);
            } else {
              console.log('unknown characteristic: ', characteristic.uuid);
            }
          });
          if (!peripheral.listenData || !peripheral.calibrate) {
            cb(new Error('missing characteristics, disconnecting.'));
            peripheral.disconnect(function(err) {
              if (err) {
                console.warn(err);
              }
              console.log('disconnected.');
            });
          } else {
            cb();
          }
        }
    ); // discover characteristics
  });  // peripheral.connect
};  // module.exports.connect

module.exports.disconnect = function(peripheral, cb) {
  peripheral.disconnect(cb);
};

function listenData(notifyCharacteristic, cb) {
  if (!notifyCharacteristic) {
    cb(new Error('no notify characteristic'));
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
      // a 0x0000 reading in bytes 8 and 9 could mean either: no data or reading 0 deg.
      // The calypso unit sends compass data together with roll and pitch, because
      // there is only one activation flag. So we check roll.
      heading: (data.readUInt8(6) ? (360 - data.readUInt16LE(8)) % 360 : undefined)  // degrees
    };
    cb(undefined, reading);
  });
  notifyCharacteristic.subscribe(function(err) {
    if (err) {
      cb(err);
    }
  });
}

function configure(sensorsCharacteristic, onoff, cb) {
  var buffer = new Buffer( [onoff ? 1 : 0] );
  sensorsCharacteristic.write(buffer, false, function(err) {
    if (err) {
      if (cb) {
        cb(new Error('while writing to sensorsCharacteristic: ' + err));
      }
    } else {
      cb();
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

function calibrate(characteristic, cb) {
  configure(characteristic, true, function(err) {
    if (err) {
      cb(err);
      return;
    }
    setTimeout(function() { 
      console.log('saving calibration.');
      configure(characteristic, false, cb);
    }, 60*1000);
  });
}
