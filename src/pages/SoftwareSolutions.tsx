import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../App';
import { useState } from 'react';
import { CheckCircle, AlertCircle, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import LocalImageUploader from '../components/LocalImageUploader';
import { motion } from 'motion/react';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Valid phone number is required'),
  deviceType: z.string().min(2, 'Device type is required'),
  problem: z.string().min(10, 'Please describe the problem in more detail'),
  address: z.string().min(5, 'Address is required'),
  directImageUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SoftwareSolutions() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email || '',
    }
  });

  const onSubmit = async (data: FormData) => {
    setStatus('submitting');
    try {
      const finalImageUrl = data.directImageUrl || uploadedUrl;

      await addDoc(collection(db, 'queries'), {
        name: data.name,
        email: data.email,
        phone: data.phone,
        deviceType: data.deviceType,
        problem: data.problem,
        address: data.address,
        userId: user?.uid,
        type: 'software',
        status: 'pending',
        problemImageUrl: finalImageUrl || '',
        createdAt: new Date().toISOString(),
      });
      
      setStatus('success');
      setUploadedUrl(null);
      reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'queries');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-purple-600 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold">Software Solutions</h1>
          <p className="mt-2 text-purple-100">OS installation, virus removal, and software troubleshooting.</p>
        </div>

        {status === 'success' ? (
          <div className="p-12 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-8">Our technicians will review your request and contact you shortly.</p>
            <button onClick={() => setStatus('idle')} className="text-purple-600 font-bold hover:underline">Submit another request</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input {...register('name')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...register('email')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input {...register('phone')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                <input {...register('deviceType')} placeholder="e.g. Dell XPS 15, MacBook Pro" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                {errors.deviceType && <p className="mt-1 text-xs text-red-500">{errors.deviceType.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Problem Description</label>
              <textarea {...register('problem')} rows={4} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" placeholder="Please describe the issue you are facing..." />
              {errors.problem && <p className="mt-1 text-xs text-red-500">{errors.problem.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input {...register('address')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
              {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-900 uppercase tracking-tight">System Diagnostic / Screenshot</label>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-gray-50/50 p-6 rounded-[2rem] border-2 border-dashed border-gray-100 relative group transition-all hover:border-purple-200">
                  <LocalImageUploader onUploadSuccess={(url) => setUploadedUrl(url)} />
                  
                  {uploadedUrl && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img src={uploadedUrl} className="w-10 h-10 rounded-lg object-cover border border-purple-200" alt="Uploaded" />
                        <span className="text-[10px] font-black text-purple-700 uppercase">Local Screenshot Synced</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setUploadedUrl(null)}
                        className="text-[10px] font-black text-purple-600 hover:text-purple-800 underline"
                      >
                        REPLACE
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">OR ENTER DIRECT ASSET URL</p>
                  <div className="relative group">
                    <input 
                      {...register('directImageUrl')}
                      placeholder="https://example.com/screenshot.jpg" 
                      className="w-full p-4 pl-12 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all group-hover:border-purple-200"
                    />
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-purple-500 transition-colors" />
                  </div>

                  {watch('directImageUrl') && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm bg-white flex-shrink-0">
                        <img 
                          src={watch('directImageUrl')} 
                          className="w-full h-full object-cover" 
                          alt="Preview" 
                          onError={(e) => {
                            e.currentTarget.src = "https://picsum.photos/seed/software/200";
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Visual Log Preview</p>
                        <p className="text-xs text-gray-500 font-medium truncate max-w-[200px]">{watch('directImageUrl')}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {status === 'error' && (
              <div className="bg-red-50 p-4 rounded-lg flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                Something went wrong. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-100 hover:bg-purple-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {status === 'submitting' ? 'Resolving Environment...' : 'Initiate Software Support'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
