import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Users, CheckCircle, MapPin, Star, TrendingUp, Lock, Zap, Clock, CreditCard } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Tetragrid</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="px-5 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-8">
              <Zap size={16} />
              <span>Geo-Fenced Student Marketplace</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-gray-900">
              The Marketplace for <span className="gradient-text">Student Talent</span>
            </h1>
            
            <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Connect with verified college students for freelance work. Secure escrow payments, 
              geo-location matching, and seamless collaboration.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold text-lg hover:bg-primary-600 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Start Now <ArrowRight size={20} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Shield, label: 'Escrow Protected', value: '100%' },
              { icon: Users, label: 'Verified Students', value: '5K+' },
              { icon: TrendingUp, label: 'Jobs Done', value: '$2M+' },
              { icon: Star, label: 'Avg Rating', value: '4.9' },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-5 md:p-6 text-center hover:bg-gray-100 transition-colors">
                <stat.icon className="w-6 h-6 mx-auto mb-3 text-primary-500" />
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-xs md:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-gray-500 text-lg">Simple, secure, and seamless</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Post a Job', desc: 'Describe your project and set your budget', color: 'bg-blue-500' },
              { step: '02', title: 'Pay 50% Escrow', desc: 'Payment held securely until completion', color: 'bg-purple-500' },
              { step: '03', title: 'Get It Done', desc: 'Collaborate with verified freelancers', color: 'bg-green-500' },
              { step: '04', title: 'Release Payment', desc: 'Confirm satisfaction, release funds', color: 'bg-amber-500' },
            ].map((item, i) => (
              <div key={i} className="relative group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4 text-white font-bold`}>
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Built for Students, <span className="gradient-text">By Students</span></h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                Tetragrid is designed specifically for college students to connect, collaborate, and earn. 
                Whether you need work done or want to offer your skills, we've got you covered.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Lock, title: 'Secure Escrow', desc: 'Your money is protected until the job is done right' },
                  { icon: MapPin, title: 'Geo-Matching', desc: 'Find students nearby for local collaboration' },
                  { icon: Clock, title: 'Flexible Hours', desc: 'Work on your schedule, at your pace' },
                  { icon: CreditCard, title: 'Quick Payouts', desc: 'Get paid instantly upon completion' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 text-gray-900">{feature.title}</h4>
                      <p className="text-gray-500 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Featured Freelancers */}
            <div className="bg-gray-50 rounded-3xl p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Alice Chen</div>
                    <div className="text-sm text-gray-500">Web Developer • 4.9 ★</div>
                  </div>
                  <div className="text-green-600 font-semibold">₹5,000</div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600">
                    M
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Mike Johnson</div>
                    <div className="text-sm text-gray-500">Content Writer • 4.8 ★</div>
                  </div>
                  <div className="text-green-600 font-semibold">₹3,500</div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-600">
                    S
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Sarah Kim</div>
                    <div className="text-sm text-gray-500">UI Designer • 5.0 ★</div>
                  </div>
                  <div className="text-green-600 font-semibold">₹8,000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Why Choose Us</h2>
            <p className="text-gray-500 text-lg">Everything you need for student freelancing</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Verified Students Only', desc: 'Real college students with valid credentials', icon: CheckCircle, color: 'text-green-500' },
              { title: 'Escrow Protection', desc: 'Money held safely until you approve work', icon: Shield, color: 'text-blue-500' },
              { title: 'Real-Time Chat', desc: 'Built-in messaging for seamless communication', icon: Users, color: 'text-purple-500' },
              { title: 'Geo-Location Filter', desc: 'Find talent or jobs near your campus', icon: MapPin, color: 'text-amber-500' },
              { title: 'Transparent Reviews', desc: 'Build trust with verified ratings', icon: Star, color: 'text-pink-500' },
              { title: 'Quick Support', desc: 'Help when you need it most', icon: Zap, color: 'text-cyan-500' },
            ].map((benefit, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-500 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-primary-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Get Started?</h2>
          <p className="text-primary-100 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of students already earning and collaborating on Tetragrid
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-primary-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-sm"
          >
            Create Free Account <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-white">Tetragrid Systems</span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Tetragrid Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
