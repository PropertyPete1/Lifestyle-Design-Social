import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthenticatedVideoProps {
  videoId: string;
  className?: string;
  [key: string]: any;
}

const AuthenticatedVideo: React.FC<AuthenticatedVideoProps> = ({ videoId, className, ...props }) => {
  const { token } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && token) {
      // Use the public stream endpoint with token
      const videoUrl = `/api/videos/${videoId}/stream-public?token=${token}`;
      videoRef.current.src = videoUrl;
    }
  }, [videoId, token]);

  return (
    <video
      ref={videoRef}
      className={className}
      controls
      preload="metadata"
      {...props}
    >
      {/* Fallback for browsers that don't support the video tag */}
      Your browser does not support the video tag.
    </video>
  );
};

export default AuthenticatedVideo; 