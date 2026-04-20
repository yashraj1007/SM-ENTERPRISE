import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { LayoutDashboard, ShoppingBag, MessageSquare, Users, User, Plus, Trash2, Edit2, Save, X, Upload, Image as ImageIcon, Check, CheckCircle, ShieldAlert, Link as LinkIcon, Zap, Clock, Activity, Truck, Cpu, Settings, Mail, Phone, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../utils';
import LocalImageUploader from '../components/LocalImageUploader';

export default function Admin() {
  const { user, profile, isAdminAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'queries' | 'users'>('stats');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [contactQueries, setContactQueries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Product Form State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'laptop',
    stock: 10,
    imageUrl: '',
    specs: { ram: '', storage: '', processor: '' }
  });

  const [newOrder, setNewOrder] = useState({
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ name: '', quantity: 1, price: 0 }],
    status: 'pending' as any
  });

  const handleAddManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total = newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      await addDoc(collection(db, 'orders'), {
        userId: 'manual-entry',
        customerEmail: newOrder.customerEmail,
        customerPhone: newOrder.customerPhone,
        customerAddress: newOrder.customerAddress,
        items: newOrder.items,
        total: total,
        status: newOrder.status,
        createdAt: new Date().toISOString()
      });
      setIsAddingOrder(false);
      setNewOrder({ customerEmail: '', customerPhone: '', customerAddress: '', items: [{ name: '', quantity: 1, price: 0 }], status: 'pending' });
    } catch (err: any) {
      console.error(err);
      alert('Error creating manual order: ' + err.message);
    }
  };

  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [responseDrafts, setResponseDrafts] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // If we have UI auth but no Firebase user, we can't fetch from Firestore yet
    if (!isAdminAuthenticated) return;
    
    // We still allow loading to finish so we can show the "Link Account" warning
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    // REAL-TIME LISTENERS
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Products Sync Error:", err);
      if (err.message.includes('permission')) {
        setError("Insufficient permissions to view products. Please check your admin role.");
      }
      setLoading(false);
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Orders Sync Error:", err.message);
      if (err.message.includes('permission')) {
        setError("Insufficient permissions to view orders.");
      }
    });

    const unsubQueries = onSnapshot(query(collection(db, 'queries'), orderBy('createdAt', 'desc')), (snap) => {
      setQueries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Queries Sync Error:", err.message);
    });

    const unsubContactQueries = onSnapshot(query(collection(db, 'contact_queries'), orderBy('createdAt', 'desc')), (snap) => {
      setContactQueries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Contact Queries Sync Error:", err.message);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      if (err.message.includes('insufficient permissions')) {
        console.warn("Permission restricted for Users collection.");
      }
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubQueries();
      unsubContactQueries();
      unsubUsers();
    };
  }, [user, isAdminAuthenticated]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.imageUrl) {
      alert('Please upload a product image first.');
      return;
    }
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        createdAt: new Date().toISOString()
      });
      setIsAddingProduct(false);
      setNewProduct({ name: '', description: '', price: 0, category: 'laptop', stock: 10, imageUrl: '', specs: { ram: '', storage: '', processor: '' } });
    } catch (err: any) {
      console.error(err);
      alert('Error adding product: ' + err.message);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete));
      setProductToDelete(null);
    } catch (err: any) {
      console.error(err);
      alert('Error deleting product: ' + err.message);
    }
  };

  const updateStatus = async (col: string, id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (col === 'queries' && responseDrafts[id]) {
        updateData.adminResponse = responseDrafts[id];
        updateData.respondedAt = new Date().toISOString();
      }

      await updateDoc(doc(db, col, id), updateData);
      
      if (col === 'queries' && responseDrafts[id]) {
        // Clear draft if responded
        const newDrafts = { ...responseDrafts };
        delete newDrafts[id];
        setResponseDrafts(newDrafts);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating status: ' + err.message);
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-500 font-medium tracking-wide">INITIALIZING ADMIN DASHBOARD...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto p-12 text-center">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-900 mb-2">Security/Data Error</h2>
        <p className="text-red-700 mb-6 text-sm">{error.includes('Insufficient permissions') ? 'You do not have administrative permissions in the database. Please ensure your account has the "admin" role and you are logged in.' : error}</p>
        
        {!user && (
          <div className="mb-8 p-4 bg-white rounded-xl border border-red-100 flex items-center justify-between gap-4">
             <div className="text-left">
               <p className="text-xs font-black text-red-600 uppercase">Identity Missing</p>
               <p className="text-xs text-gray-500">You are logged into the Admin Portal, but not yet authenticated with Firebase.</p>
             </div>
             <a href="/login" className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-sm">Login with Firebase</a>
          </div>
        )}

        <div className="space-y-4 text-left bg-white p-6 rounded-xl border border-red-100 text-sm">
          <p className="font-bold text-gray-900">Common fixes for local development:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Ensure you have deployed your <strong>Firestore Rules</strong> (<code>firebase deploy --only firestore:rules</code>).</li>
            <li>Check if <strong>localhost</strong> is added to Authorized Domains in Firebase Auth settings.</li>
            <li>Verify that your <strong>Firebase Indexes</strong> have been created (check the browser console for a link to build them).</li>
            <li>Ensure you have the <strong>"admin" role</strong> in your Firestore user document.</li>
            <li>Verify that your <code>firebase-applet-config.json</code> is present and correct.</li>
            <li>Check your browser console (F12) for more detailed error logs.</li>
          </ul>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 space-y-2">
        <div className="mb-8 px-4 flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-full w-full object-contain p-1"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div style={{ display: 'none' }}>
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tighter italic">ADMIN PANEL</span>
        </div>
        <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'stats' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-600 hover:bg-gray-100'}`}>
          <LayoutDashboard className="mr-3 h-5 w-5" /> DASHBOARD
        </button>
        <button onClick={() => setActiveTab('products')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-600 hover:bg-gray-100'}`}>
          <ShoppingBag className="mr-3 h-5 w-5" /> PRODUCTS
        </button>
        <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-600 hover:bg-gray-100'}`}>
          <ShoppingBag className="mr-3 h-5 w-5" /> ORDERS
        </button>
        <button onClick={() => setActiveTab('queries')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'queries' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-600 hover:bg-gray-100'}`}>
          <MessageSquare className="mr-3 h-5 w-5" /> QUERIES
        </button>
        <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Users className="mr-3 h-5 w-5" /> USERS
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">DASHBOARD</h2>
                <p className="text-gray-500 text-sm font-medium">Platform overview and real-time statistics</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isAdminAuthenticated ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isAdminAuthenticated ? 'Admin Session Active' : 'Restricted Access'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Products</p>
                <p className="text-5xl font-black text-gray-900">{products.length}</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Users</p>
                <p className="text-5xl font-black text-gray-900">{users.length}</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Orders</p>
                <p className="text-5xl font-black text-gray-900">{orders.length}</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Service Queries</p>
                <p className="text-5xl font-black text-gray-900">{queries.length}</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Contact Inquiries</p>
                <p className="text-5xl font-black text-gray-900">{contactQueries.length}</p>
              </div>
            </div>

            {!user && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 p-3 rounded-xl">
                    <ShieldAlert className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-amber-900 uppercase text-sm">Database Sync Limited</h3>
                    <p className="text-xs text-amber-700">You are in a Corporate Session. Some real-time counts may require an active Firebase (Google) login to bypass security rules.</p>
                  </div>
                </div>
                <Link to="/login" className="px-6 py-3 bg-amber-600 text-white text-xs font-black uppercase rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-100">
                  Connect Admin Firebase Account
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
               <div className="space-y-4">
                 <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">RECENT ORDERS</h2>
                 {orders.length === 0 ? (
                   <div className="bg-gray-50 p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                     <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                     <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No Recent Orders</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {orders.slice(0, 5).map(o => (
                       <div key={o.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between">
                         <div>
                           <p className="font-bold text-gray-900">{o.customerEmail}</p>
                           <p className="text-xs text-gray-500">{formatCurrency(o.total)} • {o.items?.length || 0} items</p>
                         </div>
                         <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full">{o.status}</span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               <div className="space-y-4">
                 <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">SERVICE LOGS</h2>
                 {queries.length === 0 ? (
                   <div className="bg-gray-50 p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                     <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                     <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No Active Service Queries</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {queries.slice(0, 5).map(q => (
                       <div key={q.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between">
                         <div>
                           <p className="font-bold text-gray-900">{q.name}</p>
                           <p className="text-xs text-gray-500">{q.deviceType} • {q.status}</p>
                         </div>
                         <button onClick={() => setActiveTab('queries')} className="text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase">View</button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">MANAGE PRODUCTS</h2>
              <button 
                onClick={() => setIsAddingProduct(true)} 
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-100"
              >
                <Plus className="mr-2 h-5 w-5" /> ADD PRODUCT
              </button>
            </div>

            {isAddingProduct && (
              <form onSubmit={handleAddProduct} className="bg-gray-50 p-8 rounded-2xl border border-gray-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Basic Info</label>
                    <div className="space-y-4">
                      <input placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-12 transition-all" required />
                      <input type="number" placeholder="Price (INR)" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-12 transition-all" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Inventory & Category</label>
                    <div className="space-y-4">
                      <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-12 transition-all">
                        <option value="laptop">Laptop</option>
                        <option value="accessory">Accessory</option>
                      </select>
                      <input type="number" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-12 transition-all" required />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Product Asset Integration</label>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Option A: Local Asset Sync</p>
                      <LocalImageUploader onUploadSuccess={(url) => setNewProduct({...newProduct, imageUrl: url})} />
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Option B: External Diagnostic Link</p>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <LinkIcon className="h-5 w-5" />
                        </div>
                        <input 
                          type="text" 
                          placeholder="/uploads/my-image.jpg or https://..." 
                          value={newProduct.imageUrl} 
                          onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} 
                          className="w-full p-4 pl-12 border border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-xs" 
                        />
                      </div>
                      
                      {newProduct.imageUrl && (
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-50">
                            <img 
                              src={newProduct.imageUrl} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/broken/200';
                              }}
                            />
                          </div>
                          <div className="flex-grow">
                            <p className="text-[10px] font-black text-gray-900 uppercase">Live Image Linked</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{newProduct.imageUrl}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setNewProduct({...newProduct, imageUrl: ''})}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-32" />
                
                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={() => setIsAddingProduct(false)} className="px-8 py-3 text-gray-500 font-bold hover:text-gray-900 transition-colors uppercase tracking-widest text-xs">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest text-xs">Save Product</button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="py-6 px-4">Product</th>
                    <th className="py-6 px-4">Category</th>
                    <th className="py-6 px-4">Price</th>
                    <th className="py-6 px-4">Stock</th>
                    <th className="py-6 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => (
                    <tr key={p.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-6 px-4">
                        <div className="flex items-center">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover mr-4" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                              <ImageIcon className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                          <span className="font-bold text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 rounded text-gray-500">{p.category}</span>
                      </td>
                      <td className="py-6 px-4 font-mono font-bold text-gray-900">{formatCurrency(p.price)}</td>
                      <td className="py-6 px-4">
                        <span className={`font-bold ${p.stock < 5 ? 'text-red-500' : 'text-gray-600'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <button 
                          onClick={() => setProductToDelete(p.id)} 
                          className="text-gray-300 hover:text-red-600 p-2 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">ORDER MANAGEMENT</h2>
                <button 
                  onClick={() => setIsAddingOrder(!isAddingOrder)}
                  className="mt-2 flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                >
                  {isAddingOrder ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isAddingOrder ? 'Cancel Entry' : 'New Manual Dispatch'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                  <div key={s} className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      s === 'pending' ? 'bg-yellow-400' :
                      s === 'processing' ? 'bg-blue-400' :
                      s === 'shipped' ? 'bg-purple-400' :
                      s === 'delivered' ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{s}</p>
                      <p className="text-sm font-black text-gray-900 leading-none">{orders.filter(o => o.status === s).length}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <AnimatePresence>
              {isAddingOrder && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleAddManualOrder} className="bg-white border-2 border-blue-100 rounded-[2.5rem] p-8 shadow-xl shadow-blue-50 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Credentials</label>
                        <input
                          type="email"
                          placeholder="Customer Email"
                          required
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-blue-500 transition-all"
                          value={newOrder.customerEmail}
                          onChange={e => setNewOrder({...newOrder, customerEmail: e.target.value})}
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          required
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-blue-500 transition-all"
                          value={newOrder.customerPhone}
                          onChange={e => setNewOrder({...newOrder, customerPhone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logistics / Address</label>
                        <textarea
                          placeholder="Full Delivery Address"
                          required
                          rows={3}
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-blue-500 transition-all resize-none"
                          value={newOrder.customerAddress}
                          onChange={e => setNewOrder({...newOrder, customerAddress: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Products & Items</label>
                        <button 
                          type="button"
                          onClick={() => setNewOrder({...newOrder, items: [...newOrder.items, { name: '', quantity: 1, price: 0 }]})}
                          className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline"
                        >
                          + Add Line Item
                        </button>
                      </div>
                      <div className="space-y-3">
                        {newOrder.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-center">
                            <input
                              type="text"
                              placeholder="Product Name"
                              className="flex-grow bg-gray-50 border-2 border-gray-50 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                              value={item.name}
                              onChange={e => {
                                const newItems = [...newOrder.items];
                                newItems[idx].name = e.target.value;
                                setNewOrder({...newOrder, items: newItems});
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Qty"
                              className="w-20 bg-gray-50 border-2 border-gray-50 rounded-xl p-3 text-sm font-bold outline-none"
                              value={item.quantity}
                              onChange={e => {
                                const newItems = [...newOrder.items];
                                newItems[idx].quantity = Number(e.target.value);
                                setNewOrder({...newOrder, items: newItems});
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Price"
                              className="w-32 bg-gray-50 border-2 border-gray-50 rounded-xl p-3 text-sm font-bold outline-none"
                              value={item.price}
                              onChange={e => {
                                const newItems = [...newOrder.items];
                                newItems[idx].price = Number(e.target.value);
                                setNewOrder({...newOrder, items: newItems});
                              }}
                            />
                            {newOrder.items.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => {
                                  const newItems = newOrder.items.filter((_, i) => i !== idx);
                                  setNewOrder({...newOrder, items: newItems});
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 border-t-2 border-gray-50 pt-8">
                       <div className="mr-auto text-left">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estimated Total</p>
                         <p className="text-2xl font-black text-gray-900">{formatCurrency(newOrder.items.reduce((s, i) => s + (i.price * i.quantity), 0))}</p>
                       </div>
                       <button
                         type="submit"
                         className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all"
                       >
                         Validate & Dispatch Order
                       </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
            
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
              const filteredOrders = orders.filter(o => o.status === status);
              const label = status === 'processing' ? 'IN PROGRESS' : status.toUpperCase();
              const Icon = status === 'pending' ? Clock : status === 'processing' ? Activity : status === 'shipped' ? Truck : status === 'delivered' ? CheckCircle : Archive;
              
              return (
                <div key={status} className="space-y-6">
                  <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-4">
                    <div className={`p-2 rounded-lg ${
                      status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      status === 'processing' ? 'bg-blue-100 text-blue-600' :
                      status === 'shipped' ? 'bg-purple-100 text-purple-600' :
                      status === 'delivered' ? 'bg-green-100 text-green-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{label} ORDERS</h3>
                    <span className="ml-auto bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black">{filteredOrders.length}</span>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-gray-100 rounded-3xl text-center bg-gray-50/50">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No orders in this state</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredOrders.map(o => (
                        <div key={o.id} className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 transition-all hover:bg-gray-50 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Order ID / Date</p>
                              <p className="text-xs font-mono font-bold text-blue-600">#{o.id.slice(-8).toUpperCase()}</p>
                              <p className="text-[10px] text-gray-500 font-bold mt-1">
                                {new Date(o.createdAt).toLocaleDateString()} at {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <select 
                              value={o.status} 
                              onChange={(e) => updateStatus('orders', o.id, e.target.value)}
                              className="text-[10px] font-black uppercase tracking-widest border-2 border-gray-100 rounded-xl p-2 bg-white outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">In Progress</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          <div className="mb-6 flex-grow">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Customer Information</p>
                            <div className="bg-gray-100/50 p-4 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-900">{o.customerEmail || 'Guest Account'}</span>
                                <div className="p-2 bg-white rounded-lg"><Mail className="h-3 w-3 text-gray-400" /></div>
                              </div>
                              {o.customerPhone && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-500">{o.customerPhone}</span>
                                  <div className="p-2 bg-white rounded-lg"><Phone className="h-3 w-3 text-gray-400" /></div>
                                </div>
                              )}
                              {o.customerAddress && (
                                <div className="pt-2 border-t border-gray-200">
                                  <p className="text-[10px] text-gray-400 leading-relaxed font-medium">{o.customerAddress}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4 mb-8">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Manifest</p>
                            <div className="space-y-2">
                              {o.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600 font-medium">
                                    <span className="font-black text-blue-600 mr-2">{item.quantity}×</span>
                                    {item.name}
                                  </span>
                                  <span className="font-mono font-bold text-gray-400">{formatCurrency(item.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-auto pt-6 border-t-2 border-gray-50 flex items-end justify-between">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Grand Total</p>
                              <p className="text-2xl font-black text-gray-900 tracking-tighter">{formatCurrency(o.total)}</p>
                            </div>
                            <div className="flex gap-2">
                              <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"><ShoppingBag className="h-4 w-4 text-blue-600" /></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">SERVICE TICKETS</h2>
              <div className="flex flex-wrap gap-2">
                {['pending', 'in-progress', 'resolved'].map(s => (
                  <div key={s} className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      s === 'pending' ? 'bg-yellow-400' :
                      s === 'in-progress' ? 'bg-blue-400' :
                      'bg-green-400'
                    }`} />
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{s}</p>
                      <p className="text-sm font-black text-gray-900 leading-none">{queries.filter(q => q.status === s).length}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {['hardware', 'software'].map(serviceType => {
              const typeQueries = queries.filter(q => q.type === serviceType);
              const Icon = serviceType === 'hardware' ? Cpu : Settings;
              
              return (
                <div key={serviceType} className="space-y-8">
                  <div className="flex items-center gap-4 bg-gray-900 text-white p-6 rounded-3xl shadow-xl shadow-gray-200">
                    <div className="p-3 bg-white/10 backdrop-blur rounded-2xl">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">{serviceType} SOLUTIONS</h3>
                      <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em]">{typeQueries.length} ACTIVE REQUESTS</p>
                    </div>
                  </div>

                  {['pending', 'in-progress', 'resolved'].map(status => {
                    const statusTypeQueries = typeQueries.filter(q => q.status === status);
                    if (statusTypeQueries.length === 0) return null;

                    return (
                      <div key={status} className="space-y-6 pl-4 border-l-4 border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            status === 'pending' ? 'bg-yellow-400' :
                            status === 'in-progress' ? 'bg-blue-400' :
                            'bg-green-400'
                          }`} />
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{status}</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {statusTypeQueries.map(q => (
                          <div key={q.id} className={`border-2 rounded-3xl p-8 transition-all hover:bg-gray-50 bg-white ${
                            status === 'resolved' ? 'border-green-100 opacity-75' : 'border-gray-100'
                          }`}>
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <h5 className="text-lg font-black text-gray-900">{q.name}</h5>
                                <p className="text-xs font-bold text-gray-400 mt-1">{q.deviceType}</p>
                              </div>
                              <select 
                                value={q.status} 
                                onChange={(e) => updateStatus('queries', q.id, e.target.value)}
                                className="text-[10px] font-black uppercase tracking-widest border-2 border-gray-100 rounded-xl p-2 bg-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                              </select>
                            </div>
                            
                            <div className="bg-gray-50/50 p-6 rounded-2xl mb-6">
                              <p className="text-gray-600 text-sm font-medium leading-relaxed">{q.problem.slice(0, 150)}{q.problem.length > 150 ? '...' : ''}</p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                <div className="p-2 bg-gray-100 rounded-full border-2 border-white"><Mail className="h-3 w-3 text-gray-500" /></div>
                                <div className="p-2 bg-gray-100 rounded-full border-2 border-white"><Phone className="h-3 w-3 text-gray-500" /></div>
                              </div>
                              <button 
                                onClick={() => {/* Scroll to details if needed or open modal */}}
                                className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                              >
                                View Ticket Details
                              </button>
                            </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {typeQueries.length === 0 && (
                    <div className="p-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-center">
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest">No active tickets for this department</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* General Contact Form Submissions */}
            <div className="pt-16 border-t-2 border-gray-100 space-y-8">
               <div className="flex items-center gap-4 bg-blue-600 text-white p-6 rounded-3xl shadow-xl shadow-blue-100">
                <div className="p-3 bg-white/10 backdrop-blur rounded-2xl">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">GENERAL CONTACTS</h3>
                  <p className="text-blue-100 text-[10px] font-bold tracking-[0.2em]">{contactQueries.length} WEB INQUIRIES</p>
                </div>
              </div>

              {contactQueries.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-center">
                   <p className="text-gray-400 text-xs font-black uppercase tracking-widest">No contact form submissions yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contactQueries.map((c) => (
                    <div key={c.id} className="bg-white border-2 border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[8px] font-black uppercase">Web Inquiry</div>
                        <span className="text-[10px] text-gray-400 font-bold">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-black text-gray-900 mb-1">{c.subject}</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-3 w-3 text-blue-500" />
                        <span className="text-xs font-bold text-gray-500">{c.name}</span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl mb-4 h-32 overflow-y-auto">
                        <p className="text-xs text-gray-600 leading-relaxed italic">"{c.message}"</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a href={`mailto:${c.email}`} className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors">
                          <Mail className="h-3 w-3" /> Reply via Email
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">REGISTERED USERS</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="py-6 px-4">User</th>
                    <th className="py-6 px-4">Role</th>
                    <th className="py-6 px-4">Joined At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-6 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{u.email}</span>
                          <span className="text-[10px] text-gray-400 font-mono tracking-tighter">UID: {u.id.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded">{u.role}</span>
                      </td>
                      <td className="py-6 px-4 text-sm font-bold text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {productToDelete && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                This item will be permanently removed from the catalog.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-4 px-4 rounded-2xl border-2 border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                   onClick={confirmDeleteProduct}
                   className="flex-1 py-4 px-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Image Lightbox Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[200] p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center"
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 md:-right-12 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-full p-2"
              >
                <X className="h-10 w-10" />
              </button>
              <div className="w-full h-full relative group">
                <img 
                  src={selectedImage} 
                  alt="Enlarged diagnostic" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-white/70 text-[10px] font-black uppercase tracking-widest border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Full Diagnostic View
                </div>
              </div>
              <a 
                href={selectedImage} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-8 bg-white/10 border border-white/20 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                 Open Original Image
              </a>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
