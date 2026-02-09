'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { VoiceRecognition } from '@/lib/voice-recognition';
import { toast } from '@/hooks/use-toast';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const voiceRecognitionRef = useRef<VoiceRecognition | null>(null);

  const startRecording = () => {
    try {
      voiceRecognitionRef.current = new VoiceRecognition({
        onResult: (text) => {
          setTranscript(text);
          onTranscript(text);
        },
        onError: (error) => {
          console.error('Speech recognition error:', error);
          toast({
            title: 'Voice Input Error',
            description: `Could not recognize speech: ${error}`,
            variant: 'destructive',
          });
          stopRecording();
        },
        onEnd: () => {
          setIsRecording(false);
          setTranscript('');
        }
      });

      voiceRecognitionRef.current.start();
      setIsRecording(true);
    } catch (error: any) {
      toast({
        title: 'Voice Input Not Supported',
        description: error.message || 'Your browser does not support voice input',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "secondary"}
        size="icon"
        onClick={handleClick}
        disabled={disabled}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      {isRecording && (
        <span className="text-sm text-muted-foreground flex items-center">
          <Volume2 className="h-4 w-4 mr-1 animate-pulse" />
          Listening...
        </span>
      )}
    </div>
  );
}