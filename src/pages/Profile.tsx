import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../App';
import { User, Mail, Calendar, Shield, Package, MessageSquare, Clock, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '../utils';

export default function Profile() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const ordersQ = query(
        collection(db, 'orders'),
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      
      const queriesQ = query(
        collection(db, 'queries'),
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );

      const [ordersSnapshot, queriesSnapshot] = await Promise.all([
        getDocs(ordersQ),
        getDocs(queriesQ)
      ]);

      setOrders(ordersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setQueries(queriesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-6">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.email.split('@')[0]}</h2>
              <p className="text-gray-500 text-sm">{profile?.role.toUpperCase()}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <span className="text-sm">{profile?.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <span className="text-sm">Joined {new Date(profile?.createdAt || '').toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Shield className="h-5 w-5 mr-3 text-gray-400" />
                <span className="text-sm">Account Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                <Package className="mr-4 h-8 w-8 text-blue-600" /> ORDER TRACKING
              </h3>
              <div className="flex gap-2">
                {['pending', 'processing', 'shipped', 'delivered'].map(s => (
                  <div key={s} className="w-3 h-3 rounded-full bg-gray-100 border border-gray-200" title={s} />
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-40 bg-gray-50 animate-pulse rounded-[2rem]"></div>)}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <Package className="mx-auto h-12 w-12 text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No orders found yet</p>
              </div>
            ) : (
              <div className="space-y-12">
                {['pending', 'processing', 'shipped', 'delivered'].map(status => {
                  const statusOrders = orders.filter(o => o.status === status || (status === 'processing' && o.status === 'processing'));
                  if (statusOrders.length === 0) return null;

                  return (
                    <div key={status} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'pending' ? 'bg-yellow-400' :
                          status === 'processing' ? 'bg-blue-400' :
                          status === 'shipped' ? 'bg-purple-400' :
                          'bg-green-400'
                        }`} />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{status === 'processing' ? 'IN PROGRESS' : status}</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {statusOrders.map((order) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-50/50 border-2 border-gray-50 rounded-[2rem] p-6 hover:bg-white hover:border-blue-100 transition-all group"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">REFERENCE</p>
                                <p className="text-sm font-mono font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">DATE</p>
                                <p className="text-sm font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                              {order.items.map((item: any, idx: number) => (
                                <span key={idx} className="bg-white border border-gray-100 px-3 py-1 rounded-xl text-[10px] font-bold text-gray-600">
                                  {item.quantity}x {item.name}
                                </span>
                              ))}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'
                              }`}>
                                {order.status}
                              </span>
                              <p className="text-xl font-black text-gray-900 tracking-tighter">{formatCurrency(order.total)}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="mr-2 h-6 w-6 text-green-600" /> Service Queries
            </h3>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-xl"></div>)}
              </div>
            ) : queries.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500">No service requests found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queries.map((q) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-100 rounded-xl p-6 hover:border-green-200 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${q.type === 'software' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                          {q.type === 'software' ? <Shield className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-mono mb-1">QUERY #{q.id.slice(0, 8).toUpperCase()}</p>
                          <h4 className="font-bold text-gray-900">{q.deviceType}</h4>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                        q.status === 'resolved' ? 'bg-green-600 text-white' : 
                        q.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {q.status === 'resolved' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {q.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{q.problem}</p>
                    
                    {q.adminResponse && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-3">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Response from SM Enterprise:</p>
                        <p className="text-sm text-blue-900 font-medium">{q.adminResponse}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Submitted on {new Date(q.createdAt).toLocaleDateString()}</span>
                      {q.problemImageUrl && (
                        <span className="flex items-center gap-1 text-blue-600 font-bold">
                          <ImageIcon className="h-3 w-3" /> Photo Attached
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
