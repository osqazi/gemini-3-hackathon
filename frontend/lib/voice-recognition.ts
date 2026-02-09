interface VoiceRecognitionProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class VoiceRecognition {
  private recognition: any;
  private isListening: boolean = false;

  constructor(props: VoiceRecognitionProps) {
    const { onResult, onError, onEnd } = props;

    // Check if SpeechRecognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) {
        onEnd();
      }
    };
  }

  start() {
    if (!this.isListening) {
      this.isListening = true;
      this.recognition.start();
    }
  }

  stop() {
    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  abort() {
    this.recognition.abort();
    this.isListening = false;
  }

  isSupported(): boolean {
    return !!this.recognition;
  }
}