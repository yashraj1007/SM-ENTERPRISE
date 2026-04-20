import { Link, useNavigate } from 'react-router-dom';
import { Laptop, Cpu, ShieldCheck, ArrowRight, ShoppingCart, Plus, Minus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency } from '../utils';
import { useAuth } from '../App';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'laptop' | 'accessory';
  specs: any;
  imageUrl: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)).slice(0, 4)); // Show top 4 on home
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover brightness-[0.4]"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
            {/* Fallback Image */}
            <img
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80"
              className="w-full h-full object-cover"
              alt="Background Fallback"
            />
          </video>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-8 lg:text-left">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl"
              >
                <span className="block">Your One-Stop</span>
                <span className="block text-blue-400">Tech Solutions Platform</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-3 text-base text-gray-200 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl max-w-xl"
              >
                Premium laptops, accessories, and expert hardware & software solutions. We empower your enterprise with the best technology and professional support.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0"
              >
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link to="/login" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 shadow-lg transition-all transform hover:scale-105">
                    Explore Services
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/contact" className="inline-flex items-center px-8 py-3 border-2 border-white/20 text-base font-medium rounded-xl text-white bg-white/10 backdrop-blur-md hover:bg-white/20 md:py-4 md:text-lg md:px-10 transition-all">
                    Contact Us
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl tracking-tight">FEATURED TECHNOLOGY</h2>
              <div className="h-1 w-20 bg-blue-600 mt-4 mb-6" />
              <p className="text-lg text-gray-500 font-medium">Precision engineering meets professional performance. Explore our curated selection of high-end computing solutions.</p>
            </div>
            <Link to="/shopping" className="inline-flex items-center px-6 py-3 border-2 border-gray-900 text-sm font-black uppercase tracking-[0.2em] rounded-xl hover:bg-gray-900 hover:text-white transition-all duration-300">
              View Collection <ArrowRight className="ml-3 h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-gray-50 rounded-[2rem] h-[420px] border border-gray-100"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col group"
                >
                  <div className="h-56 overflow-hidden bg-gray-50 relative">
                    <img
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      <span className="capitalize text-[10px] font-black tracking-widest bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-gray-900 shadow-sm border border-white/20">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">{product.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-black text-blue-600">{formatCurrency(product.price)}</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-8 line-clamp-2 font-medium leading-relaxed">{product.description}</p>
                    
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-auto w-full group/btn relative overflow-hidden bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-blue-600"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        <Plus className="h-4 w-4 mr-2" /> Add to Cart
                      </span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Comprehensive Tech Services</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">Everything you need to keep your business running smoothly.</p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-blue-100 rounded-lg p-3 w-fit mb-6">
                <Laptop className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Hardware</h3>
              <p className="text-gray-600">Latest laptops and high-quality accessories from top brands, tailored for professional use.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-green-100 rounded-lg p-3 w-fit mb-6">
                <Cpu className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hardware Solutions</h3>
              <p className="text-gray-600">Expert repair and maintenance for all your devices. From screen replacements to internal upgrades.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-purple-100 rounded-lg p-3 w-fit mb-6">
                <ShieldCheck className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Software Support</h3>
              <p className="text-gray-600">OS installation, virus removal, and custom software solutions to optimize your workflow.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        {/* Existing About Logic */}
      </section>

      {/* Home Cart Sidebar for previews */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <ShoppingCart className="mr-2 h-6 w-6" /> Your Cart
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex space-x-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-20 w-20 object-cover rounded-lg" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-20 w-20 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 italic">
                          <Laptop className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-blue-600 font-medium">{formatCurrency(item.price)}</p>
                        <div className="flex items-center mt-2 space-x-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 border border-gray-200 rounded hover:bg-gray-50"><Minus className="h-3 w-3" /></button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 border border-gray-200 rounded hover:bg-gray-50"><Plus className="h-3 w-3" /></button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-500 hover:text-red-600"><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 font-medium uppercase tracking-widest text-[10px]">Total Amount</span>
                    <span className="text-2xl font-black text-gray-900">{formatCurrency(cartTotal)}</span>
                  </div>
                  <Link
                    to="/shopping"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-100 uppercase tracking-widest text-xs"
                  >
                    Go to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
