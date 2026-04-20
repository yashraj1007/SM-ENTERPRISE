import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, CheckCircle2, Loader2, Link as LinkIcon, Zap, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface LocalImageUploaderProps {
  onUploadSuccess?: (url: string) => void;
}

export default function LocalImageUploader({ onUploadSuccess }: LocalImageUploaderProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please provide a valid image file');
      return;
    }

    setStatus('uploading');
    setProgress(10);
    setError(null);

    try {
      // Step 1: Client-side compression
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      setProgress(20);

      // Step 2: Upload to Firebase Storage
      const fileName = `uploads/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 70 + 20; // 20% to 90%
          setProgress(Math.round(p));
        }, 
        (err) => {
          console.error('Firebase Storage Error:', err);
          setError(`Transmission failed: ${err.message}`);
          setStatus('error');
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setProgress(100);
          setFinalUrl(downloadURL);
          setStatus('success');
          
          if (onUploadSuccess) {
            onUploadSuccess(downloadURL);
          }
        }
      );
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Transmission error');
      setStatus('error');
    }
  };

  const copyToClipboard = async () => {
    if (finalUrl) {
      await navigator.clipboard.writeText(finalUrl);
      alert('Local URL copied to clipboard!');
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'error' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className={`group h-48 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all ${
              status === 'error' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden" 
              accept="image/*"
            />
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform mb-4">
              <Upload className={`h-6 w-6 ${status === 'error' ? 'text-red-500' : 'text-blue-600'}`} />
            </div>
            <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">
              {status === 'error' ? error : 'Sync Local Asset'}
            </p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Drag & Drop or Click to browse
            </p>
          </motion.div>
        ) : status === 'uploading' ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-48 bg-blue-50/50 border-2 border-blue-100 rounded-[2rem] flex flex-col items-center justify-center p-8"
          >
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden mb-3">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Processing Local Transmission: {progress}%
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-auto bg-green-50/50 border-2 border-green-100 rounded-[2rem] p-6 text-center"
          >
            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-4">ASSET SYNCED LOCALLY</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-white/80 p-3 rounded-xl border border-green-100 font-mono text-[10px] text-green-700 overflow-hidden">
                <LinkIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate flex-grow text-left">{finalUrl}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="flex-1 bg-green-600 text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="h-3 w-3" /> COPY URL
                </button>
                <a 
                  href={finalUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white text-green-600 p-3 rounded-xl border border-green-200 hover:bg-green-50 transition-all flex items-center justify-center"
                >
                  <ImageIcon className="h-4 w-4" />
                </a>
              </div>
              
              <button 
                onClick={() => setStatus('idle')}
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Upload Another Asset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
