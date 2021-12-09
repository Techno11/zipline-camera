import {Pca9685Driver} from 'pca9685'
import i2cBus from 'i2c-bus'

const PAN_PORT = 0;
const TILT_PORT = 1;
const DRIVE_PORT = 8;

const servoMin = 400;
const servoMax = 3000;
const tempMax = servoMax - servoMin;

const options = {
  i2c: i2cBus.openSync(1),
  address: 0x40,
  frequency: 50,
  debug: false
};

const calculateServoPulse = (degree: number) => ((tempMax * degree) / 180) + servoMin;

const calculateMotorPulse = (percent: number) => (percent * 500) + 1500; // 1000 = full CCW, 1500 = off, 2000 = full CW

// channels

const pwm = new Pca9685Driver(options, async (err) => {
  if (err) console.log(err);

  pwm.channelOn(PAN_PORT, () => {
    pan(90);
    console.log('✔ Pan Ready')
  });
  pwm.channelOn(TILT_PORT, () => {
    tilt(90);
    console.log('✔ Tilt Ready')
  });
  pwm.channelOn(DRIVE_PORT, () => {
    drive(0);
    console.log('✔ Drive Ready')
  });
})

export const pan = (degrees: number) => {
  pwm.setPulseLength(PAN_PORT, calculateServoPulse(degrees))
}

export const tilt = (degrees: number) => {
  pwm.setPulseLength(TILT_PORT, calculateServoPulse(degrees))
}

/**
 * Drive a the trolly
 * @param percent A percent from -1 to 1
 */
let channelOff = false;
export const drive = (percent: number) => {
  if(percent > 1) percent = 1;
  if(percent < -1) percent = -1;
  if(percent === 0) {
    pwm.channelOff(DRIVE_PORT, () => {
      channelOff = true;
    });
  } else {
    if(channelOff) {
      pwm.channelOn(DRIVE_PORT, () => {
        pwm.setPulseLength(DRIVE_PORT, calculateMotorPulse(percent))
      })
    } else {
      pwm.setPulseLength(DRIVE_PORT, calculateMotorPulse(percent))
    }
  }
}

export const stopServos = (): Promise<void> => {
  if (!pwm) return new Promise<void>(r => r());
  return new Promise<void>(r => pwm.allChannelsOff(r))
}
