import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Users, DollarSign, Star, MapPin, CheckCircle } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 inset-x-0 z-50 bg-dark-400/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl gradient-text">Tetragrid</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-8">
              <Zap size={16} />
              <span>Geo-fenced Freelance Marketplace for Students</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Tetragrid</span> Systems
            </h1>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Connect with talented college students for freelance work. Secure escrow payments, 
              transparent transactions, and seamless collaboration.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2"
              >
                Start Freelancing <ArrowRight size={20} />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 glass rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Explore Services
              </Link>
            </div>
          </div>

          <div className="mt-20 grid md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'Escrow Protection', value: '100%' },
              { icon: Users, label: 'Verified Students', value: '5K+' },
              { icon: DollarSign, label: 'Jobs Completed', value: '$2M+' },
              { icon: Star, label: 'Average Rating', value: '4.9' },
            ].map((stat, i) => (
              <div key={i} className="glass rounded-2xl p-6 text-center hover-lift">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary-400" />
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-dark-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400 text-lg">Get your work done in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Post Your Job', desc: 'Describe your project and set your budget' },
              { step: '02', title: 'Pay 50% Escrow', desc: 'Secure payment held until job completion' },
              { step: '03', title: 'Work Together', desc: 'Collaborate with freelancers in real-time' },
              { step: '04', title: 'Get Paid', desc: 'Release payment upon completion' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="glass rounded-2xl p-8 hover-lift h-full">
                  <div className="text-5xl font-bold text-primary-500/20 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="text-primary-500/40" size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Benefits for Students</h2>
            <p className="text-slate-400 text-lg">Why choose Tetragrid for your freelance career</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Earn While You Learn', desc: 'Flexible gigs that fit your schedule', icon: DollarSign },
              { title: 'Verified Community', desc: 'Work with other verified college students', icon: CheckCircle },
              { title: 'Secure Payments', desc: 'Get paid on time with escrow protection', icon: Shield },
              { title: 'Build Portfolio', desc: 'Showcase your work and grow your profile', icon: Star },
              { title: 'Geo-Location', desc: 'Find opportunities near your campus', icon: MapPin },
              { title: 'Skill Development', desc: 'Gain real-world experience', icon: Zap },
            ].map((benefit, i) => (
              <div key={i} className="glass rounded-2xl p-8 hover-lift">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                  <benefit.icon className="w-7 h-7 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-slate-400">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-primary-500/10 to-transparent">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of students already earning and collaborating on Tetragrid
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105"
          >
            Create Your Account <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold gradient-text">Tetragrid Systems</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2024 Tetragrid Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
