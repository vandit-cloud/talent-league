import React, { useState, useRef, useEffect } from 'react';
import { FaceMesh } from "@mediapipe/face_mesh";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Camera } from "@mediapipe/camera_utils";

// CONFIG
const CONFIG = {
  width: 960,
  height: 720,
  minBrightness: 60,
  maxBrightness: 200,
  shadowRatio: 0.35,
  glareRatio: 0.25,
  blurThreshold: 110,
  minFaceRatio: 0.12,
  maxFaceRatio: 0.40,
  velocityThreshold: 22,
  movementWindow: 8,
  stableRequired: 6,
  lookawayTime: 3,
  multiFaceTime: 1,
  frontRange: [-5, 5] as [number, number],
  leftRange: [-40, -20] as [number, number],
  rightRange: [20, 40] as [number, number],
  captureInterval: 2
};

interface CapturedImages {
  Front: string | null;
  Left: string | null;
  Right: string | null;
}

const EnterpriseFaceEngine: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [anomalies, setAnomalies] = useState<string[]>([]);
  const [capturedImages, setCapturedImages] = useState<CapturedImages>({
    Front: null, Left: null, Right: null
  });
  const [retakeRequests, setRetakeRequests] = useState({
    Front: false, Left: false, Right: false
  });

  // State refs
  const movementBuffer = useRef<number[]>([]);
  const prevNose = useRef<{x: number, y: number} | null>(null);
  const lookawayStart = useRef<number | null>(null);
  const multiFaceStart = useRef<number | null>(null);
  const stableFrames = useRef(0);
  const lastCapture = useRef(0);

  const faceMeshRef = useRef<FaceMesh | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  // HELPERS
  const fastBrightness = (imageData: ImageData): number => {
    let sum = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      sum += imageData.data[i];
    }
    return sum / (imageData.data.length / 4);
  };

  const fastBlur = (gray: Uint8ClampedArray, width: number): number => {
    // Simplified blur detection
    let variance = 0;
    for (let i = width; i < gray.length - width; i++) {
      const laplacian = gray[i-1] * -1 + gray[i] * 2 + gray[i+1] * -1;
      variance += laplacian * laplacian;
    }
    return variance / gray.length;
  };

  const fastVelocity = (prev: {x: number, y: number} | null, curr: {x: number, y: number}): number => {
    if (!prev) return 0;
    const dx = prev.x - curr.x;
    const dy = prev.y - curr.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const estimateYaw = (landmarks: any[]): number => {
    const left = landmarks[234];
    const right = landmarks[454];
    const nose = landmarks[1];
    const dx = right.x - left.x;
    if (dx === 0) return 0;
    const center = (left.x + right.x) * 0.5;
    return ((nose.x - center) / dx) * 90;
  };

  const isFaceInRange = (yaw: number, range: [number, number]): boolean => {
    return range[0] <= yaw && yaw <= range[1];
  };

  const handleRetake = (angle: keyof CapturedImages) => {
    setRetakeRequests(prev => ({ ...prev, [angle]: true }));
    console.log(`${angle} retake requested`);
  };

  // INIT MEDIAPIPE
  useEffect(() => {
    const initMediaPipe = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      faceMesh.setOptions({
        maxNumFaces: 2,
        refineLandmarks: true,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3
      });

      const handLandmarker = await HandLandmarker.createFromOptions(
        await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision"),
        {
          baseOptions: {
            modelAssetPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/hand_landmarker.task"
          },
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        }
      );

      faceMeshRef.current = faceMesh;
      handLandmarkerRef.current = handLandmarker;
      setModelsLoaded(true);
    };

    initMediaPipe();

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
    };
  }, []);

  // MAIN DETECTION LOOP
  useEffect(() => {
    if (!modelsLoaded || !faceMeshRef.current || !handLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    faceMeshRef.current.onResults = async (faceResults: any) => {
      const handsResults = handLandmarkerRef.current!.detectForVideo(videoRef.current!, performance.now());
      
      ctx.drawImage(videoRef.current!, 0, 0, CONFIG.width, CONFIG.height);
      const currentAnomalies: string[] = [];

      // DEBUG: Log face detection results
      console.log('Face detection results:', {
        multiFaceLandmarks: faceResults.multiFaceLandmarks,
        hasLandmarks: !!faceResults.multiFaceLandmarks,
        landmarkCount: faceResults.multiFaceLandmarks?.length
      });

      const imageData = ctx.getImageData(0, 0, CONFIG.width, CONFIG.height);
      const gray = new Uint8ClampedArray(imageData.data.length / 4);
      for (let i = 0; i < gray.length; i++) {
        gray[i] = imageData.data[i * 4];
      }

      // ENVIRONMENT CHECKS
      const brightness = fastBrightness(imageData);
      if (brightness < CONFIG.minBrightness) currentAnomalies.push("Low Light");
      else if (brightness > CONFIG.maxBrightness) currentAnomalies.push("Overexposed");
      
      if (fastBlur(gray, CONFIG.width) < CONFIG.blurThreshold) {
        currentAnomalies.push("Blurry");
      }

      const shadow = (gray.filter(v => v < 30).length / gray.length);
      const glare = (gray.filter(v => v > 240).length / gray.length);
      if (shadow > CONFIG.shadowRatio) currentAnomalies.push("Shadow");
      if (glare > CONFIG.glareRatio) currentAnomalies.push("Glare");

      // FACE DETECTION
      if (!faceResults.multiFaceLandmarks) {
        currentAnomalies.push("No Face");
      } else {
        if (faceResults.multiFaceLandmarks.length > 1) {
          if (!multiFaceStart.current) multiFaceStart.current = Date.now();
          else if (Date.now() - multiFaceStart.current > CONFIG.multiFaceTime * 1000)
            currentAnomalies.push("Multiple Faces");
        } else {
          multiFaceStart.current = null;
        }

        const lm = faceResults.multiFaceLandmarks[0];
        const left = lm[234];
        const right = lm[454];
        const top = lm[10];
        const bottom = lm[152];
        
        const faceW = Math.abs(right.x - left.x);
        const faceH = Math.abs(bottom.y - top.y);
        const area = faceW * faceH;
        
        if (area < CONFIG.minFaceRatio) currentAnomalies.push("Too Far");
        else if (area > CONFIG.maxFaceRatio) currentAnomalies.push("Too Close");

        // MOVEMENT TRACKING
        const nose = { x: lm[1].x * CONFIG.width, y: lm[1].y * CONFIG.height };
        const vel = fastVelocity(prevNose.current, nose);
        prevNose.current = nose;
        
        movementBuffer.current.push(vel);
        if (movementBuffer.current.length > CONFIG.movementWindow) {
          movementBuffer.current.shift();
        }
        
        if (vel > CONFIG.velocityThreshold) currentAnomalies.push("Fast Movement");

        // STABILITY CHECK
        if (movementBuffer.current.length === CONFIG.movementWindow) {
          const avgVel = movementBuffer.current.reduce((a, b) => a + b, 0) / movementBuffer.current.length;
          if (avgVel < CONFIG.velocityThreshold * 0.5) {
            stableFrames.current += 1;
          } else {
            stableFrames.current = 0;
          }
        }

        // YAW CALCULATION
        const yaw = estimateYaw(lm);
        if (!isFaceInRange(yaw, CONFIG.frontRange)) {
          if (!lookawayStart.current) lookawayStart.current = Date.now();
          else if (Date.now() - lookawayStart.current > CONFIG.lookawayTime * 1000)
            currentAnomalies.push("Looking Away");
        } else {
          lookawayStart.current = null;
        }

        // AUTO CAPTURE
        if (currentAnomalies.length === 0 && stableFrames.current >= CONFIG.stableRequired) {
          let captureAngle: keyof CapturedImages | null = null;
          
          if (isFaceInRange(yaw, CONFIG.frontRange)) captureAngle = "Front";
          else if (isFaceInRange(yaw, CONFIG.leftRange)) captureAngle = "Left";
          else if (isFaceInRange(yaw, CONFIG.rightRange)) captureAngle = "Right";

          if (captureAngle && 
              (!capturedImages[captureAngle] || retakeRequests[captureAngle]) &&
              Date.now() - lastCapture.current > CONFIG.captureInterval * 1000) {
            
            const imageData = canvasRef.current!.toDataURL("image/png");
            setCapturedImages(prev => ({ ...prev, [captureAngle!]: imageData }));
            setRetakeRequests(prev => ({ ...prev, [captureAngle!]: false }));
            
            lastCapture.current = Date.now();
            stableFrames.current = 0;
            console.log(`${captureAngle} Captured`);
          }
        }
      }

      // HAND DETECTION
      if (handsResults.landmarks && handsResults.landmarks.length > 0) {
        currentAnomalies.push("Hand Detected");
      }

      setAnomalies(currentAnomalies);
    };

    // START CAMERA
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (faceMeshRef.current) {
          await faceMeshRef.current.send({ image: videoRef.current! });
        }
      },
      width: CONFIG.width,
      height: CONFIG.height
    });

    cameraRef.current = camera;
    camera.start();

    return () => {
      camera.stop().catch(console.error);
    };
  }, [modelsLoaded, capturedImages, retakeRequests]);

  // RENDER
  return (
    <div className="p-4">
      <div className="relative">
        <video ref={videoRef} className="hidden" width={CONFIG.width} height={CONFIG.height} />
        <canvas 
          ref={canvasRef} 
          width={CONFIG.width} 
          height={CONFIG.height}
          className="border border-gray-300 rounded"
        />
        
        {/* Anomalies Display */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded">
          {anomalies.map((a, i) => (
            <div key={i} className="text-yellow-400 text-sm">{a}</div>
          ))}
        </div>
      </div>

      {/* Captured Images Gallery */}
      <div className="mt-4 flex gap-4">
        {(['Front', 'Left', 'Right'] as const).map(angle => (
          <div key={angle} className="text-center">
            <h4 className="font-semibold">{angle}</h4>
            {capturedImages[angle] ? (
              <div>
                <img src={capturedImages[angle]!} alt={angle} className="w-32 h-24 object-cover rounded" />
                <button 
                  onClick={() => handleRetake(angle)}
                  className="mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded"
                >
                  Retake
                </button>
              </div>
            ) : (
              <div className="w-32 h-24 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500 text-xs">Not captured</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnterpriseFaceEngine;
