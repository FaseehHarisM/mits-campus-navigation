import { useState, useEffect, useCallback } from 'react';

export default function usePDR() {
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [rawStepEvent, setRawStepEvent] = useState(0);
  const [heading, setHeading] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const threshold = 1.2;
  let lastPeakTime = 0;
  let isPeak = false;

  const requestAccess = async () => {
    let motionGranted = false;
    let orientGranted = false;
    
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const p = await DeviceMotionEvent.requestPermission();
        motionGranted = p === 'granted';
      } catch (e) {
        console.error(e);
      }
    } else {
      motionGranted = true;
    }

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const p = await DeviceOrientationEvent.requestPermission();
        orientGranted = p === 'granted';
      } catch (e) {
        console.error(e);
      }
    } else {
      orientGranted = true;
    }

    if (motionGranted && orientGranted) {
      setPermissionGranted(true);
      return true;
    }
    alert("Motion & Orientation permissions denied. Compass and Pedometer will not work.");
    return false;
  };

  const startTracking = async () => {
    const granted = await requestAccess();
    if (granted) {
      setSteps(0);
      setRawStepEvent(0);
      setIsTracking(true);
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
  };
  
  const resetSteps = () => {
    setSteps(0);
  };

  const handleMotion = useCallback((event) => {
    if (!isTracking) return;
    
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    const delta = Math.abs(magnitude - 9.8);
    const now = Date.now();
    
    if (delta > threshold && !isPeak) {
      if (now - lastPeakTime > 300) {
        setRawStepEvent(Date.now()); // Trigger step validation in parent
        lastPeakTime = now;
        isPeak = true;
      }
    } else if (delta < threshold - 0.2) {
      isPeak = false;
    }
  }, [isTracking]);

  const handleOrientation = useCallback((event) => {
    if (!isTracking) return;
    
    // iOS provides webkitCompassHeading, Android provides alpha
    let dir = 0;
    if (event.webkitCompassHeading) {
      dir = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      // Chrome Android alpha is 0-360 based on starting position usually,
      // unless Absolute orientation is used. We use raw alpha.
      // Standard compass heading: 360 - alpha
      dir = 360 - event.alpha;
    }
    setHeading(dir);
  }, [isTracking]);

  useEffect(() => {
    if (isTracking && permissionGranted) {
      window.addEventListener('devicemotion', handleMotion);
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isTracking, permissionGranted, handleMotion, handleOrientation]);

  return { steps, setSteps, rawStepEvent, heading, isTracking, startTracking, stopTracking, resetSteps };
}
