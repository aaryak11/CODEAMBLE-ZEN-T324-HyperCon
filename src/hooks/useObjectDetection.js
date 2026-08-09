import { useEffect, useRef, useState, useCallback } from 'react';

// Map COCO classes to grocery labels
const GROCERY_MAP = {
  'apple': 'Apples - Fresh ✓',
  'banana': 'Bananas - Ripe ✓',
  'orange': 'Oranges - Fresh ✓',
  'broccoli': 'Broccoli - Fresh ✓',
  'carrot': 'Carrots - Fresh ✓',
  'bowl': 'Produce Display ✓',
  'bottle': 'Packaged Item ✓',
  'cup': 'Packaged Good ✓',
  'potted plant': 'Fresh Herbs ✓',
  'dining table': 'Display Counter',
  'person': 'Store Staff'
};

export default function useObjectDetection(videoRef, isPlaying) {
  const [detections, setDetections] = useState([]);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState(null);
  const modelRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastDetectTime = useRef(0);
  const isMounted = useRef(true);

  // Load model once
  useEffect(() => {
    isMounted.current = true;
    let cancelled = false;

    async function loadModel() {
      try {
        setModelLoading(true);
        // Dynamic import so it doesn't block app start
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        
        if (cancelled) return;
        
        const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        
        if (cancelled) return;
        
        modelRef.current = loadedModel;
        setModelReady(true);
        setModelLoading(false);
        console.log('✅ COCO-SSD object detection model loaded');
      } catch (err) {
        console.warn('TF.js load failed, using fallback:', err.message);
        if (!cancelled) {
          setError(err.message);
          setModelLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;
      isMounted.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Detection loop
  const detectFrame = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || !isPlaying || !isMounted.current) {
      return;
    }

    const video = videoRef.current;
    
    // Ensure video is ready and has dimensions
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    // Throttle to every 300ms (not every frame — saves CPU/battery)
    const now = Date.now();
    if (now - lastDetectTime.current >= 300) {
      lastDetectTime.current = now;

      try {
        const predictions = await modelRef.current.detect(video);
        
        if (isMounted.current && predictions) {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          
          const mapped = predictions
            .filter(p => p.score >= 0.4) // 40% confidence minimum
            .map((p, idx) => {
              // Convert pixel coords to percentages (responsive)
              const [x, y, width, height] = p.bbox;
              const label = GROCERY_MAP[p.class] || `${p.class.charAt(0).toUpperCase() + p.class.slice(1)} ✓`;
              
              return {
                id: `real-${idx}-${p.class}`,
                left: Math.max(0, Math.min(90, (x / vw) * 100)),
                top: Math.max(0, Math.min(90, (y / vh) * 100)),
                width: Math.max(8, Math.min(80, (width / vw) * 100)),
                height: Math.max(8, Math.min(80, (height / vh) * 100)),
                label,
                rawClass: p.class,
                confidence: (p.score * 100).toFixed(1),
                isRealAI: true
              };
            });

          setDetections(mapped);
        }
      } catch (detectErr) {
        // Video might have changed state, ignore frame error
      }
    }

    if (isMounted.current && isPlaying) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
    }
  }, [isPlaying, videoRef]);

  // Start/stop detection loop based on play state and model readiness
  useEffect(() => {
    if (modelReady && isPlaying) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [modelReady, isPlaying, detectFrame]);

  return { detections, modelLoading, modelReady, error };
}
