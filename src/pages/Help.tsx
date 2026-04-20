import { motion } from 'motion/react';
import { HelpCircle, Search, FileText, Shield, CreditCard, Truck } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: "How do I track my order?",
    answer: "You can track your order by visiting the 'My Profile' page and clicking on the 'Orders' tab. Each order will have a tracking number and status update."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for all hardware products. Software solutions are non-refundable once the license key has been activated."
  },
  {
    question: "How can I request a custom quote?",
    answer: "For bulk orders or custom enterprise solutions, please contact our sales team through the 'Contact Us' page or use the live chat feature."
  },
  {
    question: "Do you provide on-site installation?",
    answer: "Yes, we provide on-site installation for all enterprise hardware solutions. Please specify your requirement during the checkout process."
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            How can we help?
          </h1>
          <div className="mt-8 max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
              placeholder="Search for help articles, FAQs, and more..."
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center"
          >
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Documentation</h3>
            <p className="text-sm text-gray-500">Guides and technical docs for all products.</p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-green-100 p-8 rounded-2xl shadow-sm border border-green-200 text-center"
          >
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Security</h3>
            <p className="text-sm text-gray-600">Learn about our data protection policies.</p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-purple-100 p-8 rounded-2xl shadow-sm border border-purple-200 text-center"
          >
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Billing</h3>
            <p className="text-sm text-gray-600">Manage your invoices and payments.</p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-orange-100 p-8 rounded-2xl shadow-sm border border-orange-200 text-center"
          >
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Truck className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Shipping</h3>
            <p className="text-sm text-gray-600">Track your hardware deliveries.</p>
          </motion.div>
        </div>

        <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 flex items-center">
            <HelpCircle className="h-8 w-8 mr-4 text-blue-600" />
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 mb-6">Didn't find what you were looking for?</p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Contact Support Team
          </button>
        </div>
      </div>
    </div>
  );
}
