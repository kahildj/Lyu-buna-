import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Coffee, MapPin, Clock, Phone, Instagram, Facebook, ArrowRight, Menu as MenuIcon, X, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen selection:bg-coffee-light/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-cream/80 backdrop-blur-md border-b border-coffee-dark/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-serif font-bold tracking-tight text-coffee-dark">
            LYU BUNA
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium">
            <a href="#story" className="hover:text-coffee-light transition-colors">Our Story</a>
            <a href="#menu" className="hover:text-coffee-light transition-colors">Menu</a>
            <a href="#location" className="hover:text-coffee-light transition-colors">Visit Us</a>
            <button className="bg-coffee-dark text-cream px-6 py-2 rounded-full hover:bg-olive transition-colors">
              Order Online
            </button>
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
            <a href="#story" onClick={() => setIsMenuOpen(false)}>Our Story</a>
            <a href="#menu" onClick={() => setIsMenuOpen(false)}>Menu</a>
            <a href="#location" onClick={() => setIsMenuOpen(false)}>Visit Us</a>
            <button className="bg-coffee-dark text-cream px-6 py-3 rounded-full">Order Online</button>
          </motion.div>
        )}
      </nav>

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
          >
            <a 
              href="#menu"
              className="inline-flex items-center gap-3 bg-cream text-coffee-dark px-8 py-4 rounded-full text-lg font-medium hover:bg-coffee-light hover:text-cream transition-all group"
            >
              Explore the Menu
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
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
        <div className="max-w-7xl mx-auto">
          <p>© 2024 Lyu Buna Coffee House. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
