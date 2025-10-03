"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Mail, 
  Brain, 
  CheckCircle, 
  Clock, 
  MessageCircle, 
  Shield,
  ArrowRight,
  Users,
  Star,
  Play,
  Zap,
  TrendingUp
} from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const scaleOnHover = {
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section with Animated Background */}
      <section className="relative py-20 px-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute -bottom-32 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
            animate={{
              x: [0, 50, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Sneller antwoorden op{" "}
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity 
              }}
            >
              e-mails
            </motion.span>
            , zonder robottaal
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            AI die conceptantwoorden voor je mails voorbereidt, zodat jij enkel nog hoeft te reviewen en verzenden.
          </motion.p>
          
          <motion.div 
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/contact">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  <Zap className="mr-2 h-5 w-5" />
                  Probeer gratis demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" className="border-2 hover:bg-gray-50">
                <Play className="mr-2 h-5 w-5" />
                Bekijk hoe het werkt
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hoe Eply werkt - Animated Steps */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Hoe Eply werkt</h2>
            <p className="text-gray-600 text-lg">Drie simpele stappen naar efficiëntere e-mailcommunicatie</p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { icon: Mail, title: "Mail komt binnen", desc: "Eply leest mee in je inbox (veilig & privé).", color: "blue", delay: 0 },
              { icon: Brain, title: "Draft staat klaar", desc: "AI maakt een conceptantwoord in jouw toon, op basis van eerdere mails en bedrijfsinformatie.", color: "green", delay: 0.2 },
              { icon: CheckCircle, title: "Jij beslist", desc: "Je reviewt, klikt op verzenden — klaar.", color: "purple", delay: 0.4 }
            ].map((step, index) => (
              <motion.div 
                key={index}
                className="text-center group cursor-pointer"
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className={`w-16 h-16 bg-${step.color}-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all duration-300`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <step.icon className={`h-8 w-8 text-${step.color}-600`} />
                </motion.div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="max-w-2xl mx-auto border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-8">
                <motion.p 
                  className="text-lg text-gray-700"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  "Eply leert van jouw eerdere communicatie en bedrijfscontext. 
                  Zo blijven antwoorden consistent, professioneel en herkenbaar."
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Waarom Eply? - Interactive Cards */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Waarom Eply?</h2>
            <p className="text-gray-600 text-lg">Tastbare voordelen die je direct merkt</p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { icon: Clock, title: "⏳ Tijd terug", desc: "Geen uren meer in je mailbox.", color: "orange" },
              { icon: MessageCircle, title: "💬 Menselijk", desc: "Antwoorden voelen persoonlijk, niet robotachtig.", color: "blue" },
              { icon: Shield, title: "🔒 Veilig", desc: "Je data blijft van jou.", color: "green" }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center relative overflow-hidden">
                    <motion.div 
                      className={`w-12 h-12 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}
                      animate={hoveredCard === index ? { scale: 1.2, rotate: 360 } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0"
                      animate={hoveredCard === index ? { opacity: 0.1 } : { opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    <CardTitle className="relative z-10">{item.title}</CardTitle>
                    <CardDescription className="relative z-10">{item.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social Proof - Animated Testimonials */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Wat onze gebruikers zeggen</h2>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                text: "Dit bespaart ons 5 uur per week. De antwoorden voelen echt als onze eigen communicatie.",
                name: "Sarah van der Berg",
                role: "Customer Success Manager"
              },
              {
                text: "Eindelijk kan ik me focussen op belangrijke taken. Eply neemt de mailstress weg.",
                name: "Mark Jansen",
                role: "Operations Director"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
                  <CardContent className="p-8">
                    <motion.div 
                      className="flex items-center mb-4"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                        >
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        </motion.div>
                      ))}
                    </motion.div>
                    <p className="text-lg mb-4">"{testimonial.text}"</p>
                    <div className="flex items-center">
                      <motion.div 
                        className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mr-4"
                        whileHover={{ scale: 1.1 }}
                      />
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-gray-600 text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gray-600 mb-8">Vertrouwd door innovatieve bedrijven</p>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              {["TechStart B.V.", "Innovate Solutions", "Digital First"].map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 0.6, x: 0 }}
                  whileHover={{ opacity: 1, scale: 1.05 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Badge variant="outline" className="p-4 text-lg hover:border-blue-300 transition-colors">
                    {company}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Remaining sections with similar animations... */}
      {/* Contact / Demo - Interactive Form */}
      <section className="py-20 px-4 text-white relative overflow-hidden">
        {/* Animated particles background */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}