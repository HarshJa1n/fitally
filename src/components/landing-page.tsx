'use client'

import React, { useRef } from 'react'
import { Camera, Mic, MessageSquare, Brain, TrendingUp, Zap, Star, Check, ChevronRight, Users, Shield, Clock, BarChart3, Target, Apple, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { AnimatedBeam } from '@/components/ui/animated-beam'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { Card } from '@/components/ui/card'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

// Enhanced Input to Insights Flow Component
const InputToInsightsFlow = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const photoRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const aiRef = useRef<HTMLDivElement>(null)
    
    // Individual refs for each output box
    const calorieRef = useRef<HTMLDivElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)
    const dietRef = useRef<HTMLDivElement>(null)
    const analyticsRef = useRef<HTMLDivElement>(null)
    const socialRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={containerRef} className="relative mx-auto max-w-7xl py-20">
            <div className="grid lg:grid-cols-3 gap-8 items-center">
                {/* Input Sources */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4 md:block hidden">Multiple Input Methods</h3>
                    <div ref={photoRef} className="flex items-center gap-3 p-4 md:p-4 md:rounded-xl rounded-lg bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800">
                        <Camera className="w-8 h-8 md:w-8 md:h-8 w-6 h-6 text-blue-600" />
                        <div className="md:block hidden">
                            <h4 className="font-semibold">Photo Capture</h4>
                            <p className="text-sm text-muted-foreground">Snap meals, workouts, progress photos</p>
                        </div>
                        <div className="md:hidden block">
                            <h4 className="font-semibold text-sm">Photo</h4>
                        </div>
                    </div>
                    <div ref={audioRef} className="flex items-center gap-3 p-4 md:p-4 md:rounded-xl rounded-lg bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800">
                        <Mic className="w-8 h-8 md:w-8 md:h-8 w-6 h-6 text-green-600" />
                        <div className="md:block hidden">
                            <h4 className="font-semibold">Voice Notes</h4>
                            <p className="text-sm text-muted-foreground">Describe activities naturally</p>
                        </div>
                        <div className="md:hidden block">
                            <h4 className="font-semibold text-sm">Voice</h4>
                        </div>
                    </div>
                    <div ref={textRef} className="flex items-center gap-3 p-4 md:p-4 md:rounded-xl rounded-lg bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-800">
                        <MessageSquare className="w-8 h-8 md:w-8 md:h-8 w-6 h-6 text-purple-600" />
                        <div className="md:block hidden">
                            <h4 className="font-semibold">Quick Text</h4>
                            <p className="text-sm text-muted-foreground">Fast activity logging</p>
                        </div>
                        <div className="md:hidden block">
                            <h4 className="font-semibold text-sm">Text</h4>
                        </div>
                    </div>
                </div>

                {/* AI Processing */}
                <div className="flex flex-col items-center">
                    <div ref={aiRef} className="p-8 md:p-8 p-6 bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900 dark:to-pink-900 rounded-2xl border border-orange-200 dark:border-orange-800">
                        <Brain className="w-16 h-16 md:w-16 md:h-16 w-12 h-12 text-orange-600 mx-auto mb-4" />
                        <h3 className="font-bold text-center text-lg md:text-lg text-base">Universal AI Analysis</h3>
                        <p className="text-sm text-center text-muted-foreground mt-2 md:block hidden">Multimodal Processing</p>
                        <div className="mt-4 text-xs text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span>Processing...</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced AI Insights Output */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4 md:block hidden">Smart AI Outputs</h3>
                    <div className="space-y-3 md:space-y-3 space-y-2">
                        <div ref={calorieRef} className="p-3 md:p-3 p-2 bg-emerald-50 dark:bg-emerald-900 rounded-xl md:rounded-xl rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2 mb-1">
                                <BarChart3 className="w-5 h-5 md:w-5 md:h-5 w-4 h-4 text-emerald-600" />
                                <h4 className="font-semibold text-sm md:text-sm text-xs">Calorie Tracking</h4>
                            </div>
                            <p className="text-xs text-muted-foreground md:block hidden">Automated nutrition analysis</p>
                        </div>
                        
                        <div ref={suggestionsRef} className="p-3 md:p-3 p-2 bg-amber-50 dark:bg-amber-900 rounded-xl md:rounded-xl rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-5 h-5 md:w-5 md:h-5 w-4 h-4 text-amber-600" />
                                <h4 className="font-semibold text-sm md:text-sm text-xs">Smart Suggestions</h4>
                            </div>
                            <p className="text-xs text-muted-foreground md:block hidden">Personalized recommendations</p>
                        </div>

                        <div ref={dietRef} className="p-3 md:p-3 p-2 bg-blue-50 dark:bg-blue-900 rounded-xl md:rounded-xl rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="w-5 h-5 md:w-5 md:h-5 w-4 h-4 text-blue-600" />
                                <h4 className="font-semibold text-sm md:text-sm text-xs">Diet Plans</h4>
                            </div>
                            <p className="text-xs text-muted-foreground md:block hidden">Custom meal planning</p>
                        </div>

                        <div ref={analyticsRef} className="p-3 md:p-3 p-2 bg-violet-50 dark:bg-violet-900 rounded-xl md:rounded-xl rounded-lg border border-violet-200 dark:border-violet-800">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-5 h-5 md:w-5 md:h-5 w-4 h-4 text-violet-600" />
                                <h4 className="font-semibold text-sm md:text-sm text-xs">Progress Analytics</h4>
                            </div>
                            <p className="text-xs text-muted-foreground md:block hidden">Trend analysis & insights</p>
                        </div>

                        <div ref={socialRef} className="p-3 md:p-3 p-2 bg-pink-50 dark:bg-pink-900 rounded-xl md:rounded-xl rounded-lg border border-pink-200 dark:border-pink-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-5 h-5 md:w-5 md:h-5 w-4 h-4 text-pink-600" />
                                <h4 className="font-semibold text-sm md:text-sm text-xs">Social Insights</h4>
                            </div>
                            <p className="text-xs text-muted-foreground md:block hidden">Community comparisons</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input to AI Beams */}
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={photoRef}
                toRef={aiRef}
                curvature={-60}
                duration={4}
                delay={0}
                pathColor="#3b82f6"
                gradientStartColor="#3b82f6"
                gradientStopColor="#8b5cf6"
                startXOffset={60}
                endXOffset={-60}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={audioRef}
                toRef={aiRef}
                curvature={0}
                duration={4}
                delay={0.5}
                pathColor="#10b981"
                gradientStartColor="#10b981"
                gradientStopColor="#f59e0b"
                startXOffset={60}
                endXOffset={-60}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={textRef}
                toRef={aiRef}
                curvature={60}
                duration={4}
                delay={1}
                pathColor="#8b5cf6"
                gradientStartColor="#8b5cf6"
                gradientStopColor="#ec4899"
                startXOffset={60}
                endXOffset={-60}
            />
            
            {/* AI to Output Beams - Connect to each individual output */}
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={aiRef}
                toRef={calorieRef}
                curvature={-80}
                duration={4}
                delay={1.5}
                reverse={true}
                pathColor="#10b981"
                gradientStartColor="#f97316"
                gradientStopColor="#10b981"
                startXOffset={60}
                endXOffset={-60}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={aiRef}
                toRef={suggestionsRef}
                curvature={-40}
                duration={4}
                delay={2}
                reverse={true}
                pathColor="#f59e0b"
                gradientStartColor="#f97316"
                gradientStopColor="#f59e0b"
                startXOffset={60}
                endXOffset={-60}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={aiRef}
                toRef={dietRef}
                curvature={0}
                duration={4}
                delay={2.5}
                reverse={true}
                pathColor="#3b82f6"
                gradientStartColor="#f97316"
                gradientStopColor="#3b82f6"
                startXOffset={60}
                endXOffset={-60}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={aiRef}
                toRef={analyticsRef}
                curvature={40}
                duration={4}
                delay={3}
                reverse={true}
                pathColor="#8b5cf6"
                gradientStartColor="#f97316"
                gradientStopColor="#8b5cf6"
                startXOffset={60}
                endXOffset={-60}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={aiRef}
                toRef={socialRef}
                curvature={80}
                duration={4}
                delay={3.5}
                reverse={true}
                pathColor="#ec4899"
                gradientStartColor="#f97316"
                gradientStopColor="#ec4899"
                startXOffset={60}
                endXOffset={-60}
            />
        </div>
    )
}

// Phone Mockup Component with Fitally Content
const PhoneMockup = () => {
    return (
        <div className="bg-radial from-primary/50 dark:from-primary/25 relative mx-auto mt-32 max-w-2xl to-transparent to-55% text-left">
            <div className="bg-background border-border/50 absolute inset-0 mx-auto w-80 -translate-x-3 -translate-y-12 rounded-[2rem] border p-2 [mask-image:linear-gradient(to_bottom,#000_50%,transparent_90%)] sm:-translate-x-6">
                <div className="relative h-96 overflow-hidden rounded-[1.5rem] border p-2 pb-12 before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-45deg,var(--border),var(--border)_1px,transparent_1px,transparent_6px)] before:opacity-50"></div>
            </div>
            <div className="bg-muted dark:bg-background/50 border-border/50 mx-auto w-80 translate-x-4 rounded-[2rem] border p-2 backdrop-blur-3xl [mask-image:linear-gradient(to_bottom,#000_50%,transparent_90%)] sm:translate-x-8">
                <div className="bg-background space-y-2 overflow-hidden rounded-[1.5rem] border p-2 shadow-xl dark:bg-white/5 dark:shadow-black dark:backdrop-blur-3xl">
                    <FitallyAppPreview />
                    <div className="bg-muted rounded-[1rem] p-4 pb-16 dark:bg-white/5"></div>
                </div>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] mix-blend-overlay [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:opacity-5" />
        </div>
    )
}

// Fitally App Preview Component
const FitallyAppPreview = () => {
    return (
        <div className="relative space-y-3 rounded-[1rem] bg-white/5 p-4">
            <div className="flex items-center gap-1.5 text-orange-400">
                <Camera className="size-5" />
                <div className="text-sm font-medium">Today's Progress</div>
            </div>
            <div className="space-y-3">
                <div className="text-foreground border-b border-white/10 pb-3 text-sm font-medium">
                    AI analyzed your lunch photo: 520 calories detected
                </div>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="space-x-1">
                            <span className="text-foreground align-baseline text-xl font-medium">1,847</span>
                            <span className="text-muted-foreground text-xs">Calories today</span>
                        </div>
                        <div className="flex h-5 items-center rounded bg-gradient-to-l from-emerald-400 to-orange-500 px-2 text-xs text-white">85% Goal</div>
                    </div>
                    <div className="space-y-1">
                        <div className="space-x-1">
                            <span className="text-foreground align-baseline text-xl font-medium">8</span>
                            <span className="text-muted-foreground text-xs">Activities logged</span>
                        </div>
                        <div className="text-foreground bg-muted flex h-5 w-4/5 items-center rounded px-2 text-xs dark:bg-white/20">🥗 🏃‍♀️ 💧 📸</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const FitallyLandingPage = () => {
    return (
        <>
            <FitallyHeader />
            <main className="overflow-hidden">
                {/* Hero Section */}
                <section>
                    <div className="relative mx-auto max-w-6xl px-6 pt-32 lg:pb-16 lg:pt-48">
                        <div className="relative z-10 mx-auto max-w-4xl text-center">
                            <AnimatedGroup
                                variants={{
                                    container: {
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.05,
                                                delayChildren: 0.75,
                                            },
                                        },
                                    },
                                    ...transitionVariants,
                                }}
                            >
                                <h1 className="text-balance text-4xl font-medium sm:text-5xl md:text-6xl">
                                    Log Your Health Journey with a{' '}
                                    <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                                        Single Photo
                                    </span>
                                </h1>

                                <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
                                    Transform fitness and nutrition tracking with AI-powered visual logging. 
                                    Simply photograph your meals, workouts, and progress while our multimodal AI handles comprehensive tracking and insights.
                                </p>

                                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" asChild>
                                        <Link href="/login">
                                            Get Started Free
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <Link href="#demo">
                                            Watch Demo
                                        </Link>
                                    </Button>
                                </div>

                                <div className="mt-8 text-sm text-muted-foreground">
                                    ✨ No tedious manual entry • 🤖 AI-powered analysis • 📊 Real-time insights
                                </div>

                                {/* Phone Mockup */}
                                <PhoneMockup />
                            </AnimatedGroup>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <StatsSection />

                {/* Input to Insights Demo Section */}
                <section id="demo" className="py-20 bg-muted/50">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">From Any Input to Smart Insights</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Our universal AI flow processes photos, audio, and text to automatically categorize and analyze your health activities
                            </p>
                        </div>
                        <InputToInsightsFlow />
                    </div>
                </section>

                {/* Features Section */}
                <FeaturesSection />

                {/* Use Cases Section */}
                <UseCasesSection />

                {/* Testimonials Section */}
                <TestimonialsSection />

                {/* Product Showcase Section */}
                <ProductShowcaseSection />

                {/* Pricing Section */}
                <PricingSection />

                {/* Security & Trust Section */}
                <SecuritySection />

                {/* FAQ Section */}
                <FAQSection />

                {/* Final CTA Section */}
                <CTASection />

                {/* Trusted By Section */}
                <TrustedBySection />
            </main>
        </>
    )
}

// Stats/Milestones Section
const StatsSection = () => {
    const stats = [
        { number: "50K+", label: "Photos Analyzed", icon: Camera },
        { number: "99.2%", label: "Accuracy Rate", icon: Target },
        { number: "2M+", label: "Activities Logged", icon: BarChart3 },
        { number: "<3s", label: "Analysis Time", icon: Clock },
    ]

    return (
        <section className="py-16 bg-background">
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="flex justify-center mb-3">
                                <stat.icon className="w-8 h-8 text-orange-500" />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">{stat.number}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Features Section
const FeaturesSection = () => {
    const features = [
        {
            icon: Camera,
            title: "Visual-First Tracking",
            description: "Advanced computer vision recognizes food, portions, and workout activities from simple photos with 99%+ accuracy.",
            gradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
        },
        {
            icon: Brain,
            title: "Multimodal AI Intelligence",
            description: "Single AI flow processes any combination of images, text, and audio for comprehensive health activity detection.",
            gradient: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
        },
        {
            icon: TrendingUp,
            title: "Smart Analytics Dashboard",
            description: "Real-time insights and personalized recommendations powered by continuous learning from your patterns.",
            gradient: "from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
        },
        {
            icon: Zap,
            title: "Instant Analysis",
            description: "Get comprehensive nutritional breakdown and fitness insights in under 3 seconds with our optimized AI models.",
            gradient: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
        },
        {
            icon: Target,
            title: "Personalized Goals",
            description: "AI-driven goal setting and tracking that adapts to your lifestyle, preferences, and progress patterns.",
            gradient: "from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20"
        },
        {
            icon: Users,
            title: "Community Insights",
            description: "Compare progress with similar users while maintaining privacy through federated learning approaches.",
            gradient: "from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20"
        }
    ]

    return (
        <section className="py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Powered by Cutting-Edge AI</h2>
                    <p className="text-lg text-muted-foreground">
                        Experience the future of health tracking with multimodal AI capabilities
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className={`p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border`}>
                            <feature.icon className="w-12 h-12 text-orange-600 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Use Cases Section
const UseCasesSection = () => {
    const useCases = [
        {
            title: "For Fitness Enthusiasts",
            icon: "🏃‍♀️",
            description: "Track workouts, progress photos, and performance metrics automatically",
            features: ["Workout recognition", "Progress tracking", "Performance analytics", "Goal optimization"]
        },
        {
            title: "For Nutrition Focused",
            icon: "🥗",
            description: "Effortless meal logging with detailed nutritional breakdowns",
            features: ["Food recognition", "Calorie tracking", "Macro analysis", "Meal planning"]
        },
        {
            title: "For Health Conscious",
            icon: "💪",
            description: "Comprehensive wellness tracking including sleep, stress, and activities",
            features: ["Holistic tracking", "Health insights", "Trend analysis", "Preventive care"]
        },
        {
            title: "For Busy Professionals",
            icon: "⏰",
            description: "Quick health logging that fits into your schedule",
            features: ["Voice logging", "Quick capture", "Smart reminders", "Minimal effort"]
        }
    ]

    return (
        <section className="py-20 bg-muted/30">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Perfect for Every Lifestyle</h2>
                    <p className="text-lg text-muted-foreground">
                        Whether you're a fitness enthusiast or just starting your health journey
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {useCases.map((useCase, index) => (
                        <Card key={index} className="p-6">
                            <div className="flex items-start gap-4">
                                <span className="text-4xl">{useCase.icon}</span>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                                    <p className="text-muted-foreground mb-4">{useCase.description}</p>
                                    <ul className="space-y-2">
                                        {useCase.features.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Testimonials Section
const TestimonialsSection = () => {
    const testimonials = [
        {
            name: "Sarah Chen",
            role: "Fitness Coach",
            content: "Fitally has revolutionized how I track my clients' progress. The AI accuracy is incredible - it saves me hours of manual logging.",
            avatar: "SC",
            rating: 5
        },
        {
            name: "Marcus Rodriguez",
            role: "Busy Executive",
            content: "Finally, a health app that doesn't require me to spend 10 minutes logging every meal. Just snap a photo and it's done!",
            avatar: "MR",
            rating: 5
        },
        {
            name: "Dr. Emily Watson",
            role: "Nutritionist",
            content: "The nutritional analysis is remarkably accurate. I recommend Fitally to all my patients who struggle with food tracking.",
            avatar: "EW",
            rating: 5
        }
    ]

    return (
        <section className="py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Loved by Health Enthusiasts</h2>
                    <p className="text-lg text-muted-foreground">
                        See what our users are saying about their Fitally experience
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="p-6">
                            <div className="flex items-center gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <div className="font-semibold">{testimonial.name}</div>
                                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Product Showcase Section (placeholder for mobile mockups)
const ProductShowcaseSection = () => {
    return (
        <section className="py-20 bg-muted/50">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">See Fitally in Action</h2>
                    <p className="text-lg text-muted-foreground">
                        Experience the intuitive interface designed for effortless health tracking
                    </p>
                </div>

                <div className="bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 rounded-2xl p-12 text-center border">
                    <Smartphone className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Mobile Mockups Coming Soon</h3>
                    <p className="text-muted-foreground mb-6">
                        Interactive demos and beautiful screenshots of the Fitally mobile experience
                    </p>
                    <Button variant="outline" asChild>
                        <Link href="/login">Try Live Demo</Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}

// Pricing Section
const PricingSection = () => {
    const plans = [
        {
            name: "Free",
            price: "$0",
            period: "forever",
            description: "Perfect for getting started",
            features: [
                "10 photo analyses per month",
                "Basic nutrition tracking",
                "Simple progress charts",
                "Community access"
            ],
            cta: "Start Free",
            popular: false
        },
        {
            name: "Pro",
            price: "$9",
            period: "per month",
            description: "For serious health enthusiasts",
            features: [
                "Unlimited photo analyses",
                "Advanced AI insights",
                "Custom goal setting",
                "Meal planning assistance",
                "Priority support",
                "Export data"
            ],
            cta: "Start Pro Trial",
            popular: true
        },
        {
            name: "Team",
            price: "$29",
            period: "per month",
            description: "For coaches and professionals",
            features: [
                "Everything in Pro",
                "Up to 10 client accounts",
                "Team analytics dashboard",
                "White-label options",
                "API access",
                "Dedicated support"
            ],
            cta: "Contact Sales",
            popular: false
        }
    ]

    return (
        <section className="py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
                    <p className="text-lg text-muted-foreground">
                        Start free, upgrade when you need more power
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <Card key={index} className={`p-6 relative ${plan.popular ? 'border-orange-500 border-2' : ''}`}>
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">/{plan.period}</span>
                                </div>
                                <p className="text-muted-foreground mb-6">{plan.description}</p>
                            </div>
                            
                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button 
                                className={`w-full ${plan.popular ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600' : ''}`}
                                variant={plan.popular ? 'default' : 'outline'}
                                asChild
                            >
                                <Link href="/login">{plan.cta}</Link>
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Security Section
const SecuritySection = () => {
    const trustSignals = [
        {
            icon: Shield,
            title: "SOC2 Compliant",
            description: "Enterprise-grade security standards"
        },
        {
            icon: Users,
            title: "GDPR Ready",
            description: "Full data privacy compliance"
        },
        {
            icon: Clock,
            title: "99.99% Uptime",
            description: "Reliable service you can count on"
        }
    ]

    return (
        <section className="py-20 bg-muted/30">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Security & Trust</h2>
                    <p className="text-lg text-muted-foreground">
                        Your health data is protected with enterprise-grade security
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {trustSignals.map((signal, index) => (
                        <div key={index} className="text-center">
                            <signal.icon className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">{signal.title}</h3>
                            <p className="text-muted-foreground">{signal.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// FAQ Section
const FAQSection = () => {
    const faqs = [
        {
            question: "How accurate is the AI food recognition?",
            answer: "Our multimodal AI achieves 99.2% accuracy in food recognition and portion estimation, trained on millions of food images and validated by nutrition experts."
        },
        {
            question: "Can I use Fitally offline?",
            answer: "Basic logging works offline, but AI analysis requires an internet connection. All offline data syncs automatically when you're back online."
        },
        {
            question: "Is my health data secure?",
            answer: "Absolutely. We use end-to-end encryption, are SOC2 compliant, and never share your personal health data with third parties."
        },
        {
            question: "What platforms does Fitally support?",
            answer: "Currently available as a web app with iOS and Android apps launching Q2 2025. WhatsApp bot integration is also planned."
        },
        {
            question: "Can I export my data?",
            answer: "Pro and Team users can export all their data in standard formats (JSON, CSV) at any time. Free users have limited export options."
        }
    ]

    return (
        <section className="py-20">
            <div className="mx-auto max-w-4xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                    <p className="text-lg text-muted-foreground">
                        Everything you need to know about Fitally
                    </p>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <Card key={index} className="p-6">
                            <h3 className="font-semibold mb-2">{faq.question}</h3>
                            <p className="text-muted-foreground">{faq.answer}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Final CTA Section
const CTASection = () => {
    return (
        <section className="py-20 bg-gradient-to-br from-orange-500 to-pink-500">
            <div className="mx-auto max-w-4xl px-6 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                    Ready to Transform Your Health Journey?
                </h2>
                <p className="text-xl text-orange-100 mb-8">
                    Join thousands of users who've simplified their health tracking with AI
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50" asChild>
                        <Link href="/login">
                            Start Free Today
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600" asChild>
                        <Link href="#demo">
                            See How It Works
                        </Link>
                    </Button>
                </div>
                <p className="text-orange-100 text-sm mt-4">
                    No credit card required • Free forever plan available
                </p>
            </div>
        </section>
    )
}

const FitallyHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const menuItems = [
        { name: 'Features', href: '#demo' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'About', href: '#about' },
    ]

    return (
        <header>
            <nav className="fixed group z-20 w-full px-2">
                <div className={cn(
                    'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', 
                    isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5'
                )}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link href="/" aria-label="home" className="flex items-center space-x-2">
                                <FitallyLogo />
                            </Link>
                        </div>

                        <div className="hidden lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="ghost" asChild className="hidden md:block">
                                <Link href="/login">Sign In</Link>
                            </Button>
                            <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" asChild>
                                <Link href="/login">Get Started</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

const TrustedBySection = () => {
    const brands = [
        "Google Gemini", "OpenAI GPT-4V", "Supabase", "Next.js", "Vercel", "TypeScript", "Genkit", "Claude AI"
    ]

    return (
        <section className="py-16 bg-muted/30">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-8">
                    <p className="text-sm font-medium text-muted-foreground">Powered by industry-leading technologies</p>
                </div>
                <InfiniteSlider className="[--duration:25s]" durationOnHover={75}>
                    {brands.map((brand, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-center px-6 py-3 text-sm font-medium text-muted-foreground/80"
                        >
                            {brand}
                        </div>
                    ))}
                </InfiniteSlider>
            </div>
        </section>
    )
}

const FitallyLogo = () => (
    <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            Fitally
        </span>
    </div>
)

export default FitallyLandingPage 