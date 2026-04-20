import { Link } from 'react-router-dom';
import { ShoppingBag, Settings, Laptop, Cpu, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../App';

export default function Dashboard() {
  const { profile } = useAuth();

  const cards = [
    {
      title: 'Shopping',
      description: 'Browse our latest laptops, accessories, and tech gadgets.',
      icon: <ShoppingBag className="h-8 w-8 text-blue-600" />,
      link: '/shopping',
      color: 'bg-blue-50',
    },
    {
      title: 'Software Solutions',
      description: 'OS installation, troubleshooting, and software support.',
      icon: <ShieldCheck className="h-8 w-8 text-purple-600" />,
      link: '/software-solutions',
      color: 'bg-purple-50',
    },
    {
      title: 'Hardware Solutions',
      description: 'Expert repair and maintenance for all your hardware needs.',
      icon: <Cpu className="h-8 w-8 text-green-600" />,
      link: '/hardware-solutions',
      color: 'bg-green-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.email.split('@')[0]}!</h1>
        <p className="mt-2 text-gray-600">What can we help you with today?</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={card.link}
              className="group block h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-lg hover:border-blue-200 transition-all transform hover:-translate-y-1"
            >
              <div className={`${card.color} rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
              <p className="text-gray-600 mb-6">{card.description}</p>
              <div className="flex items-center text-blue-600 font-medium">
                Explore <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
