"use client";

import { useState, useEffect } from "react";

// OpenCV.js type - minimal declarations for what we use
export interface OpenCV {
  Mat: new () => OpenCVMat;
  MatVector: new () => OpenCVMatVector;
  Size: new (width: number, height: number) => { width: number; height: number };
  Point: new (x: number, y: number) => { x: number; y: number };
  imread: (source: HTMLImageElement | HTMLCanvasElement) => OpenCVMat;
  cvtColor: (src: OpenCVMat, dst: OpenCVMat, code: number) => void;
  GaussianBlur: (src: OpenCVMat, dst: OpenCVMat, ksize: { width: number; height: number }, sigmaX: number) => void;
  Canny: (src: OpenCVMat, dst: OpenCVMat, threshold1: number, threshold2: number) => void;
  dilate: (src: OpenCVMat, dst: OpenCVMat, kernel: OpenCVMat) => void;
  findContours: (src: OpenCVMat, contours: OpenCVMatVector, hierarchy: OpenCVMat, mode: number, method: number) => void;
  contourArea: (contour: OpenCVMat) => number;
  arcLength: (contour: OpenCVMat, closed: boolean) => number;
  approxPolyDP: (contour: OpenCVMat, approx: OpenCVMat, epsilon: number, closed: boolean) => void;
  minAreaRect: (contour: OpenCVMat) => OpenCVRotatedRect;
  goodFeaturesToTrack: (src: OpenCVMat, corners: OpenCVMat, maxCorners: number, qualityLevel: number, minDistance: number) => void;
  cornerHarris: (src: OpenCVMat, dst: OpenCVMat, blockSize: number, ksize: number, k: number) => void;
  normalize: (src: OpenCVMat, dst: OpenCVMat, alpha: number, beta: number, normType: number) => void;
  threshold: (src: OpenCVMat, dst: OpenCVMat, thresh: number, maxval: number, type: number) => void;
  morphologyEx: (src: OpenCVMat, dst: OpenCVMat, op: number, kernel: OpenCVMat) => void;
  getStructuringElement: (shape: number, ksize: { width: number; height: number }) => OpenCVMat;
  COLOR_RGBA2GRAY: number;
  RETR_EXTERNAL: number;
  RETR_LIST: number;
  RETR_TREE: number;
  CHAIN_APPROX_SIMPLE: number;
  CV_8U: number;
  CV_32F: number;
  NORM_MINMAX: number;
  THRESH_BINARY: number;
  MORPH_CLOSE: number;
  MORPH_RECT: number;
}

export interface OpenCVMat {
  rows: number;
  cols: number;
  data: Uint8Array;
  data32F: Float32Array;
  floatAt: (row: number, col: number) => number;
  intAt: (row: number, col: number) => number;
  ucharAt: (row: number, col: number) => number;
  delete: () => void;
  ones: (rows: number, cols: number, type: number) => OpenCVMat;
  size: () => { width: number; height: number };
  total: () => number;
}

export interface OpenCVMatVector {
  size: () => number;
  get: (index: number) => OpenCVMat;
  delete: () => void;
}

export interface OpenCVRotatedRect {
  center: { x: number; y: number };
  size: { width: number; height: number };
  angle: number;
}

declare global {
  interface Window {
    cv: OpenCV & { Mat: { ones: (rows: number, cols: number, type: number) => OpenCVMat } };
    Module: {
      onRuntimeInitialized: () => void;
    };
  }
}

type OpenCVStatus = "idle" | "loading" | "ready" | "error";

const OPENCV_CDN_URL = "https://docs.opencv.org/4.9.0/opencv.js";

let loadPromise: Promise<void> | null = null;
let isLoaded = false;

function loadOpenCV(): Promise<void> {
  if (isLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.cv && window.cv.Mat) {
      isLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = OPENCV_CDN_URL;
    script.async = true;

    script.onload = () => {
      // OpenCV.js uses Module.onRuntimeInitialized for WASM init
      if (window.cv && window.cv.Mat) {
        isLoaded = true;
        resolve();
      } else {
        // Wait for WASM to initialize
        const checkReady = () => {
          if (window.cv && window.cv.Mat) {
            isLoaded = true;
            resolve();
          } else {
            setTimeout(checkReady, 50);
          }
        };
        checkReady();
      }
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load OpenCV.js"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useOpenCV() {
  const [status, setStatus] = useState<OpenCVStatus>(isLoaded ? "ready" : "idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      setStatus("ready");
      return;
    }

    setStatus("loading");

    loadOpenCV()
      .then(() => {
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        setError(err.message);
      });
  }, []);

  return {
    cv: status === "ready" ? window.cv : null,
    status,
    error,
    isReady: status === "ready",
    isLoading: status === "loading",
  };
}
