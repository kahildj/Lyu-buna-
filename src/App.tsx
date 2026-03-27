import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Coffee, MapPin, Clock, Phone, Instagram, Facebook, ArrowRight, Menu as MenuIcon, X, ChevronLeft, ChevronRight, ShoppingBag, ArrowLeft, Plus, Minus, CreditCard, Wallet, Banknote, CheckCircle2, LayoutDashboard, ListOrdered, Settings, LogOut, Eye, Check, Trash2, Bell, AlertCircle } from "lucide-react";
import { auth, db, storage } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, addDoc, onSnapshot, updateDoc, doc, query, orderBy, serverTimestamp, getDoc, setDoc, getDocFromServer } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client appears to be offline.");
    }
  }
}
testConnection();

const MENU_ITEMS = [
  {
    category: "Signature Brews",
    items: [
      { 
        name: "Traditional Buna", 
        description: "Slow-roasted Ethiopian beans, prepared in a jebena.", 
        price: "40 Birr",
        images: [
          "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800"
        ]
      },
      { 
        name: "Spiced Latte", 
        description: "Espresso with steamed milk and a hint of cardamom and ginger.", 
        price: "100 Birr",
        images: [
          "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1572286258217-31582113ff42?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800"
        ]
      },
      { 
        name: "Honey Processed Pour-over", 
        description: "Bright, floral notes with a sweet honey finish.", 
        price: "120 Birr",
        images: [
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=800"
        ]
      },
    ]
  },
  {
    category: "Small Bites",
    items: [
      { 
        name: "Dabo Kolo", 
        description: "Crunchy, spicy roasted barley and wheat snacks.", 
        price: "70 Birr",
        images: [
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=800"
        ]
      },
      { 
        name: "Honey Cake", 
        description: "Layered sponge cake with local wildflower honey.", 
        price: "150 Birr",
        images: [
          "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=800"
        ]
      },
      { 
        name: "Savory Sambusa", 
        description: "Crispy pastry filled with lentils and green chilies.", 
        price: "50 Birr",
        images: [
          "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=800"
        ]
      },
    ]
  }
];

function ImageCarousel({ images, name }: { images: string[], name: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="aspect-square overflow-hidden relative group/carousel">
      <AnimatePresence mode="wait">
        <motion.img 
          key={currentIndex}
          src={images[currentIndex]} 
          alt={`${name} - view ${currentIndex + 1}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      
      {/* Navigation Arrows */}
      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
        <button 
          onClick={prevImage}
          className="p-2 rounded-full bg-cream/80 backdrop-blur-sm text-coffee-dark hover:bg-coffee-light hover:text-cream transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={nextImage}
          className="p-2 rounded-full bg-cream/80 backdrop-blur-sm text-coffee-dark hover:bg-coffee-light hover:text-cream transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <div 
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === currentIndex ? "bg-cream w-4" : "bg-cream/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function CheckoutPage({ cart, onBack }: { cart: Record<string, number>, onBack: () => void }) {
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'awaiting_confirmation' | 'success'>('idle');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const getItemPrice = (name: string) => {
    for (const category of MENU_ITEMS) {
      const item = category.items.find(i => i.name === name);
      if (item) return parseInt(item.price);
    }
    return 0;
  };

  const getItemImage = (name: string) => {
    for (const category of MENU_ITEMS) {
      const item = category.items.find(i => i.name === name);
      if (item) return item.images[0];
    }
    return "";
  };

  const cartItems = Object.entries(cart).filter(([_, qty]) => qty > 0);
  const totalPrice = cartItems.reduce((acc, [name, qty]) => acc + (getItemPrice(name) * qty), 0);

  const paymentMethods = [
    { id: 'telebirr', name: 'Telebirr', icon: <Wallet className="w-5 h-5" />, number: '0948735682' },
    { id: 'cbe', name: 'CBE Birr', icon: <Wallet className="w-5 h-5" />, number: '0948735682' },
  ];

  const handleConfirmOrder = () => {
    if (!selectedPayment) {
      alert("Please select a payment method.");
      return;
    }
    if (!customerName || !customerEmail) {
      alert("Please provide your name and email.");
      return;
    }
    setOrderStatus('awaiting_confirmation');
  };

  const handleSubmitConfirmation = async () => {
    if (!screenshot) {
      alert("Please upload a screenshot of your payment receipt.");
      return;
    }
    setOrderStatus('processing');
    
    try {
      // 1. Upload screenshot
      const screenshotRef = ref(storage, `screenshots/${Date.now()}_${screenshot.name}`);
      await uploadBytes(screenshotRef, screenshot);
      const screenshotUrl = await getDownloadURL(screenshotRef);

      // 2. Save order to Firestore
      const orderData = {
        customerName,
        customerEmail,
        items: cartItems.map(([name, qty]) => ({
          name,
          quantity: qty,
          price: getItemPrice(name)
        })),
        totalAmount: totalPrice,
        paymentMethod: selectedPayment,
        paymentScreenshotUrl: screenshotUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);
      setOrderStatus('success');
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("There was an error submitting your order. Please try again.");
      setOrderStatus('awaiting_confirmation');
    }
  };

  if (orderStatus === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-cream flex items-center justify-center px-6"
      >
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center space-y-6">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-serif italic">Confirmation Submitted!</h1>
          <p className="text-coffee-light">
            Your payment confirmation has been submitted. We will verify your payment and process your order.
          </p>
          <button 
            onClick={onBack}
            className="w-full bg-coffee-dark text-cream py-4 rounded-full font-bold hover:bg-olive transition-all"
          >
            Back to Menu
          </button>
        </div>
      </motion.div>
    );
  }

  if (orderStatus === 'awaiting_confirmation') {
    const method = paymentMethods.find(m => m.id === selectedPayment);
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="min-h-screen bg-cream pt-24 pb-32 px-6"
      >
        <div className="max-w-2xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12">
          <button 
            onClick={() => setOrderStatus('idle')}
            className="flex items-center gap-2 text-coffee-light hover:text-coffee-dark transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Summary
          </button>

          <h1 className="text-3xl font-serif italic mb-6">Payment Instructions</h1>
          
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-2xl mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500 text-white rounded-lg">
                {method?.icon}
              </div>
              <h3 className="text-xl font-bold text-orange-700">{method?.name}</h3>
            </div>
            <p className="text-orange-900 font-mono text-2xl font-bold mb-2 tracking-wider">
              {method?.number}
            </p>
            <p className="text-orange-700 text-sm">Payment Number</p>
          </div>

          <p className="text-coffee-medium mb-8 leading-relaxed">
            Please send the payment using <span className="font-bold">{method?.name}</span> to the number above. 
            After sending the payment, upload a screenshot of the payment receipt for confirmation.
          </p>

          <div className="space-y-6 mb-12">
            <div className="border-2 border-dashed border-coffee-dark/10 rounded-3xl p-8 text-center hover:border-orange-500 transition-colors relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto text-coffee-light">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="font-medium text-coffee-dark">
                  {screenshot ? screenshot.name : "Upload Receipt Screenshot"}
                </p>
                <p className="text-xs text-coffee-light">JPEG, PNG up to 5MB</p>
              </div>
            </div>

            <div className="bg-cream/30 p-6 rounded-3xl space-y-4">
              <h4 className="font-serif italic text-lg">Order Summary</h4>
              {cartItems.map(([name, qty]) => (
                <div key={name} className="flex justify-between text-sm">
                  <span className="text-coffee-medium">{name} x{qty}</span>
                  <span className="font-bold">{getItemPrice(name) * qty} Birr</span>
                </div>
              ))}
              <div className="pt-4 border-t border-coffee-dark/5 flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span className="text-olive">{totalPrice} Birr</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSubmitConfirmation}
            disabled={orderStatus === 'processing'}
            className="w-full bg-orange-500 text-white py-6 rounded-full text-xl font-bold shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {orderStatus === 'processing' ? (
              <>
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Payment Confirmation"
            )}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-screen bg-cream pt-24 pb-32 px-6"
    >
      <div className="max-w-2xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-coffee-light hover:text-coffee-dark transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Order
          </button>

          <h1 className="text-4xl font-serif italic mb-8">Your Order Summary</h1>

          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-serif italic">Your Details</h2>
            <div className="grid gap-4">
              <input 
                type="text" 
                placeholder="Full Name" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-coffee-dark/5 focus:border-orange-500 outline-none transition-all"
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-coffee-dark/5 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {cartItems.map(([name, qty]) => (
              <div key={name} className="flex items-center justify-between border-b border-coffee-dark/5 pb-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={getItemImage(name)} 
                    alt={name} 
                    className="w-16 h-16 rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-serif text-lg italic">{name}</h3>
                    <p className="text-coffee-light text-sm">Quantity: {qty}</p>
                  </div>
                </div>
                <p className="font-bold text-coffee-dark">{getItemPrice(name) * qty} Birr</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-2xl font-serif italic mb-12 p-6 bg-cream/30 rounded-3xl">
            <span>Total Amount</span>
            <span className="text-olive font-bold">{totalPrice} Birr</span>
          </div>

          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-serif italic">Select Payment Method</h2>
            <div className="grid gap-4">
              {paymentMethods.map((method) => (
                <button 
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all ${
                    selectedPayment === method.id 
                      ? "border-orange-500 bg-orange-50/50" 
                      : "border-coffee-dark/5 hover:border-coffee-dark/20"
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${
                    selectedPayment === method.id ? "bg-orange-500 text-white" : "bg-cream text-coffee-dark"
                  }`}>
                    {method.icon}
                  </div>
                  <div className="text-left">
                    <span className={`block font-bold ${selectedPayment === method.id ? "text-orange-600" : "text-coffee-dark"}`}>
                      {method.name}
                    </span>
                    <span className="text-xs text-coffee-light">{method.number}</span>
                  </div>
                  {selectedPayment === method.id && (
                    <div className="ml-auto">
                      <CheckCircle2 className="w-6 h-6 text-orange-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleConfirmOrder}
            disabled={orderStatus === 'processing'}
            className="w-full bg-orange-500 text-white py-6 rounded-full text-xl font-bold shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {orderStatus === 'processing' ? (
              <>
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Pay Now"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function OrderPage({ 
  cart, 
  addToCart, 
  removeFromCart, 
  onBack, 
  onCheckout 
}: { 
  cart: Record<string, number>, 
  addToCart: (name: string) => void, 
  removeFromCart: (name: string) => void, 
  onBack: () => void,
  onCheckout: () => void
}) {
  const totalItems = Object.keys(cart).reduce((acc, key) => acc + (cart[key] || 0), 0);

  const getItemPrice = (name: string) => {
    for (const category of MENU_ITEMS) {
      const item = category.items.find(i => i.name === name);
      if (item) return parseInt(item.price);
    }
    return 0;
  };

  const totalPrice = Object.entries(cart).reduce((acc, [name, qty]) => acc + (getItemPrice(name) * qty), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-cream pt-24 pb-32 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-coffee-dark hover:text-olive transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif italic">Order Online</h1>
            <p className="text-coffee-light mt-2">Select your favorites and we'll have them ready.</p>
          </div>
          <div className="relative bg-white p-3 rounded-full shadow-md">
            <ShoppingBag className="w-6 h-6 text-coffee-dark" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-12">
          {MENU_ITEMS.map((category, idx) => (
            <div key={idx}>
              <h2 className="text-2xl font-serif italic border-b border-coffee-dark/10 pb-2 mb-6 text-coffee-medium">
                {category.category}
              </h2>
              <div className="grid gap-6">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="bg-white p-6 rounded-3xl shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <img 
                        src={item.images[0]} 
                        alt={item.name} 
                        className="w-20 h-20 rounded-2xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="text-xl font-serif italic">{item.name}</h3>
                        <p className="text-coffee-light font-medium">{item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-cream/50 p-2 rounded-full">
                      <button 
                        onClick={() => removeFromCart(item.name)}
                        className="p-1.5 rounded-full bg-white text-coffee-dark hover:bg-coffee-dark hover:text-cream transition-all disabled:opacity-30"
                        disabled={!cart[item.name]}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-coffee-dark">
                        {cart[item.name] || 0}
                      </span>
                      <button 
                        onClick={() => addToCart(item.name)}
                        className="p-1.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-8 left-6 right-6 z-50"
          >
            <button 
              onClick={onCheckout}
              className="w-full max-w-4xl mx-auto bg-coffee-dark text-cream py-5 rounded-full text-xl font-bold shadow-2xl hover:bg-olive transition-all flex items-center justify-between px-10"
            >
              <div className="flex items-center gap-4">
                <ShoppingBag className="w-6 h-6" />
                <span>Proceed to Checkout</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm bg-white/10 px-3 py-1 rounded-full">{totalItems} items</span>
                <span className="text-2xl">{totalPrice} Birr</span>
              </div>
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function OrderCTA({ onOrder }: { onOrder: () => void }) {
  return (
    <section className="py-24 px-6 bg-coffee-dark relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img 
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=2000" 
          alt="Coffee beans background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-4xl md:text-6xl font-serif italic text-cream leading-tight">
            Ready for your <br /> perfect cup?
          </h2>
          <p className="text-cream/70 text-lg max-w-xl mx-auto">
            Skip the wait and order your favorite brews and bites online. Freshly prepared and ready for pickup.
          </p>
          <motion.button
            onClick={onOrder}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-4 bg-orange-500 text-white px-12 py-6 rounded-full text-2xl font-bold shadow-2xl shadow-orange-500/40 hover:bg-orange-600 transition-colors group"
          >
            <ShoppingBag className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            Order Online Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err: any) {
      console.error("Google Login error:", err);
      setError("Error signing in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password login is DISABLED in your Firebase Console. Please enable it in Authentication > Sign-in method, or use Google Sign-In.");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coffee-dark flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl"
      >
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-orange-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 shadow-xl shadow-orange-500/20">
            <Coffee className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif italic">Admin Portal</h1>
          <p className="text-coffee-light mt-2">Secure Management Access</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </motion.div>
        )}

        <div className="space-y-4 mb-8">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-coffee-dark/5 py-4 rounded-full font-bold hover:bg-cream transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-coffee-dark/10"></div>
            </div>
            <span className="relative px-4 bg-white text-[10px] font-bold text-coffee-light uppercase tracking-widest">Or use email</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-coffee-dark ml-4 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-cream/30 border-2 border-transparent focus:border-orange-500 outline-none transition-all"
              placeholder="admin@lyubuna.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-coffee-dark ml-4 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-cream/30 border-2 border-transparent focus:border-orange-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-coffee-dark text-cream py-5 rounded-full font-bold text-lg hover:bg-orange-500 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In with Email"}
          </button>
        </form>
        
        <p className="mt-8 text-center text-[10px] text-coffee-light leading-relaxed">
          If email login fails with an 'operation-not-allowed' error, please enable it in your Firebase Console or use Google Sign-In.
        </p>
      </motion.div>
    </div>
  );
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: string;
  paymentScreenshotUrl: string;
  status: 'pending' | 'approved' | 'preparing' | 'completed' | 'rejected';
  createdAt: any;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'payments' | 'menu'>('orders');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      if (orders.length > 0 && newOrders.length > orders.length) {
        const latestOrder = newOrders[0];
        setNotifications(prev => [`New order from ${latestOrder.customerName}!`, ...prev]);
      }
      
      setOrders(newOrders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "orders");
    });

    return () => unsubscribe();
  }, [orders.length]);

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-600';
      case 'approved': return 'bg-blue-100 text-blue-600';
      case 'preparing': return 'bg-purple-100 text-purple-600';
      case 'completed': return 'bg-green-100 text-green-600';
      case 'rejected': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-72 bg-coffee-dark text-cream flex flex-col p-8 hidden lg:flex">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 bg-orange-500 rounded-xl">
            <Coffee className="w-6 h-6" />
          </div>
          <span className="text-xl font-serif italic">Lyu Buna Admin</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
            { id: 'orders', label: 'Orders', icon: <ListOrdered className="w-5 h-5" /> },
            { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
            { id: 'menu', label: 'Menu Management', icon: <Settings className="w-5 h-5" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                activeTab === item.id ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "hover:bg-white/5 text-cream/70"
              }`}
            >
              {item.icon}
              <span className="font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={onLogout}
          className="flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold">Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-serif italic text-coffee-dark">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-coffee-light">Manage your coffee house operations.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-3 bg-white rounded-2xl shadow-sm text-coffee-dark hover:shadow-md transition-all relative">
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />
                )}
              </button>
              {notifications.length > 0 && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl p-4 z-50 space-y-3 border border-coffee-dark/5">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-coffee-dark">Notifications</h4>
                    <button onClick={() => setNotifications([])} className="text-xs text-orange-500 font-bold">Clear All</button>
                  </div>
                  {notifications.map((note, i) => (
                    <div key={i} className="p-3 bg-orange-50 bg-orange-50 rounded-xl text-sm text-orange-700 flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      {note}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 bg-white p-2 pr-6 rounded-full shadow-sm">
              <div className="w-10 h-10 bg-olive rounded-full flex items-center justify-center text-cream font-bold">
                {auth.currentUser?.displayName?.[0] || auth.currentUser?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden md:block">
                <div className="font-bold text-coffee-dark text-sm leading-tight">{auth.currentUser?.displayName || 'Admin User'}</div>
                <div className="text-[10px] text-coffee-light">{auth.currentUser?.email}</div>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-coffee-dark/5">
                <p className="text-coffee-light text-sm font-bold uppercase tracking-widest mb-2">Total Orders</p>
                <h3 className="text-4xl font-serif italic text-coffee-dark">{orders.length}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-coffee-dark/5">
                <p className="text-coffee-light text-sm font-bold uppercase tracking-widest mb-2">Pending</p>
                <h3 className="text-4xl font-serif italic text-orange-500">
                  {orders.filter(o => o.status === 'pending').length}
                </h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-coffee-dark/5">
                <p className="text-coffee-light text-sm font-bold uppercase tracking-widest mb-2">Completed</p>
                <h3 className="text-4xl font-serif italic text-green-500">
                  {orders.filter(o => o.status === 'completed').length}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-coffee-dark/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-cream/50">
                      <th className="p-6 font-serif italic text-coffee-dark">Customer</th>
                      <th className="p-6 font-serif italic text-coffee-dark">Items</th>
                      <th className="p-6 font-serif italic text-coffee-dark">Total</th>
                      <th className="p-6 font-serif italic text-coffee-dark">Payment</th>
                      <th className="p-6 font-serif italic text-coffee-dark">Status</th>
                      <th className="p-6 font-serif italic text-coffee-dark">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coffee-dark/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-cream/30 transition-colors">
                        <td className="p-6">
                          <div className="font-bold text-coffee-dark">{order.customerName}</div>
                          <div className="text-xs text-coffee-light">{order.customerEmail}</div>
                        </td>
                        <td className="p-6">
                          <div className="text-sm space-y-1">
                            {order.items.map((item, i) => (
                              <div key={i} className="text-coffee-medium">
                                {item.name} <span className="text-xs opacity-50">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-6 font-bold text-coffee-dark">{order.totalAmount} Birr</td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-coffee-light">{order.paymentMethod}</span>
                            <button 
                              onClick={() => setSelectedScreenshot(order.paymentScreenshotUrl)}
                              className="p-2 bg-cream rounded-lg text-coffee-dark hover:bg-orange-500 hover:text-white transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => updateStatus(order.id, 'approved')}
                                className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 'approved' && (
                              <button 
                                onClick={() => updateStatus(order.id, 'preparing')}
                                className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all"
                                title="Start Preparing"
                              >
                                <Coffee className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button 
                                onClick={() => updateStatus(order.id, 'completed')}
                                className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
                                title="Complete"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {order.status !== 'completed' && order.status !== 'rejected' && (
                              <button 
                                onClick={() => updateStatus(order.id, 'rejected')}
                                className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'orders' && (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center text-coffee-light">
              <Settings className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-serif italic text-coffee-dark">Coming Soon</h2>
            <p className="text-coffee-light max-w-md">
              We're currently working on the {activeTab} management features. Stay tuned!
            </p>
          </div>
        )}
      </main>

      {/* Screenshot Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-coffee-dark/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedScreenshot(null)}
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-4xl w-full bg-white rounded-[3rem] overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={selectedScreenshot} 
                alt="Payment Receipt" 
                className="w-full h-auto max-h-[80vh] object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="p-8 text-center">
                <h3 className="text-2xl font-serif italic text-coffee-dark">Payment Receipt</h3>
                <p className="text-coffee-light">Verify the transaction details before approving the order.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState<'home' | 'order' | 'checkout' | 'admin-login' | 'admin-dashboard'>('home');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Security check: Only allow kjemal999@gmail.com to access the dashboard
        if (currentUser.email === 'kjemal999@gmail.com') {
          setView('admin-dashboard');
        } else {
          // If not admin, sign out and stay on home
          signOut(auth);
          setView('home');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setView('home');
  };

  const addToCart = (name: string) => {
    setCart(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
  };

  const removeFromCart = (name: string) => {
    setCart(prev => {
      const newQty = (prev[name] || 0) - 1;
      if (newQty <= 0) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: newQty };
    });
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setShowFloatingButton(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen selection:bg-coffee-light/30">
      {/* Floating Order Button */}
      <AnimatePresence>
        {showFloatingButton && view === 'home' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 100 }}
            className="fixed bottom-8 right-8 z-[100] md:hidden"
          >
            <motion.button 
              onClick={() => setView('order')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-orange-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center animate-bounce"
            >
              <Coffee className="w-6 h-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFloatingButton && view === 'home' && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-8 right-8 z-[100] hidden md:block"
          >
            <motion.button 
              onClick={() => setView('order')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-orange-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold hover:bg-orange-600 transition-all group"
            >
              <Coffee className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Order Online Now
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-cream/80 backdrop-blur-md border-b border-coffee-dark/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-serif font-bold tracking-tight text-coffee-dark">
            LYU BUNA
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium">
            <a href="#story" onClick={() => setView('home')} className="hover:text-coffee-light transition-colors">Our Story</a>
            <a href="#menu" onClick={() => setView('home')} className="hover:text-coffee-light transition-colors">Menu</a>
            <a href="#location" onClick={() => setView('home')} className="hover:text-coffee-light transition-colors">Visit Us</a>
            <div className="flex items-center gap-4 border-l border-coffee-dark/10 pl-8">
              <a href="#" className="text-coffee-dark hover:text-coffee-light transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-coffee-dark hover:text-coffee-light transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
            <motion.button 
              onClick={() => setView('order')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition-all shadow-md hover:shadow-lg font-bold flex items-center justify-center"
            >
              Order Online
            </motion.button>
          </div>

          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-cream border-b border-coffee-dark/5 p-6 flex flex-col gap-4 text-center"
          >
            <a href="#story" onClick={() => { setView('home'); setIsMenuOpen(false); }}>Our Story</a>
            <a href="#menu" onClick={() => { setView('home'); setIsMenuOpen(false); }}>Menu</a>
            <a href="#location" onClick={() => { setView('home'); setIsMenuOpen(false); }}>Visit Us</a>
            <motion.button 
              onClick={() => {
                setView('order');
                setIsMenuOpen(false);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center justify-center"
            >
              Order Online
            </motion.button>
          </motion.div>
        )}
      </nav>

      {view === 'admin-dashboard' && user ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : view === 'admin-login' ? (
        <AdminLogin onLogin={() => setView('admin-dashboard')} />
      ) : view === 'home' ? (
        <>
          {/* Hero Section */}
          <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=2000" 
            alt="Traditional Ethiopian coffee ceremony with Jebena and Cini"
            className="w-full h-full object-cover brightness-[0.5] scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-coffee-dark/70 via-transparent to-coffee-dark/50" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block text-cream/90 uppercase tracking-[0.3em] text-sm font-semibold mb-6"
          >
            Est. 2024 • Authentic Heritage
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-6xl md:text-8xl text-cream font-serif italic mb-8 leading-tight"
          >
            Coffee as it was <br /> meant to be.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="#menu"
              className="inline-flex items-center gap-3 bg-cream text-coffee-dark px-8 py-4 rounded-full text-lg font-medium hover:bg-coffee-light hover:text-cream transition-all group w-full sm:w-auto justify-center"
            >
              Explore the Menu
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <motion.button 
              onClick={() => setView('order')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                boxShadow: ["0 0 0 0px rgba(249, 115, 22, 0.4)", "0 0 0 20px rgba(249, 115, 22, 0)"] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
              className="inline-flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-orange-600 transition-all w-full sm:w-auto justify-center shadow-xl shadow-orange-500/20"
            >
              Order Online
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000" 
                alt="Traditional coffee beans roasting"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-olive rounded-full flex items-center justify-center text-cream p-8 text-center italic font-serif text-lg transform rotate-12 shadow-xl">
              "Buna dabo naw"
            </div>
          </div>
          
          <div className="space-y-8">
            <span className="text-olive uppercase tracking-widest text-sm font-bold">The Heritage</span>
            <h2 className="text-5xl font-serif italic leading-tight">From the Highlands <br /> to your cup.</h2>
            <p className="text-lg text-coffee-medium leading-relaxed">
              At Lyu Buna, we believe coffee is more than just a drink—it's a ceremony, a conversation, and a connection to the earth. Inspired by the rich traditions of Ethiopia, the birthplace of coffee, we bring you slow-roasted beans and authentic brewing methods that honor every step of the journey.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <h4 className="font-serif text-2xl italic mb-2">Ethically Sourced</h4>
                <p className="text-sm text-coffee-medium">Directly from small-holder farms in Sidamo and Yirgacheffe.</p>
              </div>
              <div>
                <h4 className="font-serif text-2xl italic mb-2">Artisan Roasted</h4>
                <p className="text-sm text-coffee-medium">Small batches roasted daily to preserve delicate floral notes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-24 px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-olive uppercase tracking-widest text-sm font-bold">Our Offerings</span>
            <h2 className="text-5xl font-serif italic mt-4">The Daily Brew</h2>
          </div>

          <div className="space-y-24">
            {MENU_ITEMS.map((category, idx) => (
              <div key={idx}>
                <h3 className="text-3xl font-serif italic border-b border-coffee-dark/10 pb-4 mb-12 text-coffee-medium text-center">
                  {category.category}
                </h3>
                <div className="grid md:grid-cols-3 gap-12">
                  {category.items.map((item, itemIdx) => (
                    <motion.div 
                      key={itemIdx}
                      whileHover={{ y: -10 }}
                      className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                    >
                      <div className="relative">
                        <ImageCarousel images={item.images} name={item.name} />
                        <div className="absolute top-4 right-4 z-10 bg-cream/90 backdrop-blur-sm px-4 py-1 rounded-full text-coffee-dark font-serif italic">
                          {item.price}
                        </div>
                      </div>
                      <div className="p-8 space-y-3">
                        <h4 className="text-2xl font-serif italic">{item.name}</h4>
                        <p className="text-coffee-medium text-sm leading-relaxed">{item.description}</p>
                        <div className="pt-4">
                          <button className="text-xs uppercase tracking-widest font-bold text-olive border-b border-olive/20 pb-1 hover:border-olive transition-all">
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order CTA Section */}
      <OrderCTA onOrder={() => setView('order')} />

      {/* Visit Section */}
      <section id="location" className="py-24 px-6 bg-coffee-dark text-cream">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
          <div className="space-y-12">
            <div>
              <h2 className="text-5xl font-serif italic mb-8">Visit the House</h2>
              <p className="text-cream/70 text-lg leading-relaxed max-w-md">
                Find us in the heart of the city, where the aroma of fresh roast meets the warmth of community.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-coffee-light mt-1" />
                <div>
                  <h4 className="font-serif text-xl italic">Location</h4>
                  <p className="text-cream/60">Adama Titas Hotel, 1st Floor<br />Adama, Ethiopia</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="text-coffee-light mt-1" />
                <div>
                  <h4 className="font-serif text-xl italic">Hours</h4>
                  <p className="text-cream/60">Mon - Sun: 7am - 10pm</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="text-coffee-light mt-1" />
                <div>
                  <h4 className="font-serif text-xl italic">Contact</h4>
                  <p className="text-cream/60">+251 954 43 99<br />kjemal999@gmail.com</p>
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-4">
              <a href="#" className="hover:text-coffee-light transition-colors"><Instagram /></a>
              <a href="#" className="hover:text-coffee-light transition-colors"><Facebook /></a>
            </div>
          </div>

          <div className="h-[500px] rounded-[3rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
            <img 
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1000" 
              alt="Coffee shop interior"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-coffee-dark/5 text-center text-sm text-coffee-medium uppercase tracking-widest">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-center gap-8">
            <a href="#" className="hover:text-coffee-light transition-colors flex items-center gap-2">
              <Instagram className="w-5 h-5" />
              <span className="hidden sm:inline">Instagram</span>
            </a>
            <a href="#" className="hover:text-coffee-light transition-colors flex items-center gap-2">
              <Facebook className="w-5 h-5" />
              <span className="hidden sm:inline">Facebook</span>
            </a>
          </div>
          <p>© 2024 Lyu Buna Coffee House. All rights reserved.</p>
          <button 
            onClick={() => setView('admin-login')}
            className="text-[10px] opacity-20 hover:opacity-100 transition-opacity"
          >
            Admin Dashboard
          </button>
        </div>
      </footer>
        </>
      ) : view === 'order' ? (
        <OrderPage 
          cart={cart} 
          addToCart={addToCart} 
          removeFromCart={removeFromCart} 
          onBack={() => setView('home')} 
          onCheckout={() => setView('checkout')} 
        />
      ) : (
        <CheckoutPage cart={cart} onBack={() => setView('order')} />
      )}
    </div>
  );
}
