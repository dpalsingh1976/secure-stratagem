import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, DollarSign, Shield, TrendingUp, TrendingDown, PiggyBank, Users, Percent, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Scene {
  id: number;
  title: string;
  description: string;
  duration: number; // seconds
}

const scenes: Scene[] = [
  { id: 1, title: "Premium Payment", description: "You pay premiums into the policy, building your financial foundation.", duration: 10 },
  { id: 2, title: "Fund Allocation", description: "The insurance company deducts costs for coverage and fees. The rest goes to your cash value.", duration: 12 },
  { id: 3, title: "Index Linking", description: "Your cash value is linked to market indexes like the S&P 500—without direct market exposure.", duration: 12 },
  { id: 4, title: "Market Gains", description: "When the index rises, you earn interest up to a cap rate. If the index gains 15%, you might earn 10%.", duration: 12 },
  { id: 5, title: "Floor Protection", description: "When the index drops, your floor (typically 0%) protects your cash value from losses.", duration: 10 },
  { id: 6, title: "Tax Advantages", description: "Cash value grows tax-deferred. Access funds later via tax-free loans or withdrawals.", duration: 10 },
  { id: 7, title: "Death Benefit", description: "Your beneficiaries receive a tax-free death benefit, providing lasting protection.", duration: 10 },
];

const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

// Audio cache to avoid regenerating audio for the same scene
const audioCache = new Map<number, string>();

export const IULExplainerAnimation: React.FC = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scene = scenes[currentScene];

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    const tickMs = 50;
    const incrementPerTick = (tickMs / (scene.duration * 1000)) * 100;

    intervalRef.current = setInterval(() => {
      setSceneProgress((prev) => {
        if (prev >= 100) {
          // Move to next scene
          if (currentScene < scenes.length - 1) {
            setCurrentScene((s) => s + 1);
            return 0;
          } else {
            setIsPlaying(false);
            clearTimer();
            return 100;
          }
        }
        return prev + incrementPerTick;
      });
    }, tickMs);
  }, [scene.duration, currentScene, clearTimer]);

  useEffect(() => {
    if (isPlaying) {
      startTimer();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isPlaying, startTimer, clearTimer]);

  useEffect(() => {
    // Reset progress when scene changes
    setSceneProgress(0);
    if (isPlaying) {
      startTimer();
    }
    // Play audio for the new scene if sound is enabled
    if (soundEnabled) {
      playSceneAudio(currentScene);
    }
  }, [currentScene]);

  // Stop audio when sound is disabled
  useEffect(() => {
    if (!soundEnabled && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [soundEnabled]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSceneAudio = async (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Check cache first
    if (audioCache.has(sceneIndex)) {
      const cachedUrl = audioCache.get(sceneIndex)!;
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      audio.play().catch(console.error);
      return;
    }

    setIsLoadingAudio(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fiqmtirctaqxhqnwfuqq.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ text: scene.description }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the audio URL
      audioCache.set(sceneIndex, audioUrl);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      toast({
        variant: 'destructive',
        title: 'Audio Error',
        description: 'Could not play narration. Please try again.',
      });
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleRestart = () => {
    setCurrentScene(0);
    setSceneProgress(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1);
      setSceneProgress(0);
    }
  };

  const handleNext = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(currentScene + 1);
      setSceneProgress(0);
    }
  };

  // Calculate overall progress
  const completedScenesDuration = scenes.slice(0, currentScene).reduce((acc, s) => acc + s.duration, 0);
  const currentSceneContribution = (sceneProgress / 100) * scene.duration;
  const overallProgress = ((completedScenesDuration + currentSceneContribution) / totalDuration) * 100;

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-gradient-to-br from-card to-muted/50 rounded-2xl border border-border overflow-hidden shadow-elegant"
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Scene Indicators */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-4">
        {scenes.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => { setCurrentScene(idx); setSceneProgress(0); }}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              idx === currentScene 
                ? "bg-primary scale-125" 
                : idx < currentScene 
                  ? "bg-primary/60" 
                  : "bg-muted-foreground/30"
            )}
            aria-label={`Go to scene ${idx + 1}: ${s.title}`}
          />
        ))}
      </div>

      {/* Animation Stage */}
      <div className="relative h-[320px] md:h-[380px] flex items-center justify-center overflow-hidden px-4">
        <AnimatedScene sceneId={currentScene + 1} progress={sceneProgress} />
      </div>

      {/* Scene Info */}
      <div className="px-6 pb-4 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 transition-all duration-300">
          {scene.title}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {scene.description}
        </p>
      </div>

      {/* Scene Progress */}
      <div className="px-6 pb-4">
        <Progress value={sceneProgress} className="h-1" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn("h-10 w-10", soundEnabled && "bg-primary/10 border-primary")}
          title={soundEnabled ? "Mute narration" : "Enable narration"}
        >
          {isLoadingAudio ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentScene === 0}
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleRestart}
          className="h-10 w-10"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={handlePlayPause}
          className="h-12 w-12 rounded-full"
          size="icon"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentScene === scenes.length - 1}
          className="h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// Individual Scene Animations
const AnimatedScene: React.FC<{ sceneId: number; progress: number }> = ({ sceneId, progress }) => {
  switch (sceneId) {
    case 1:
      return <Scene1Premium progress={progress} />;
    case 2:
      return <Scene2Allocation progress={progress} />;
    case 3:
      return <Scene3IndexLink progress={progress} />;
    case 4:
      return <Scene4MarketGains progress={progress} />;
    case 5:
      return <Scene5FloorProtection progress={progress} />;
    case 6:
      return <Scene6TaxAdvantages progress={progress} />;
    case 7:
      return <Scene7DeathBenefit progress={progress} />;
    default:
      return null;
  }
};

// Scene 1: Premium Payment
const Scene1Premium: React.FC<{ progress: number }> = ({ progress }) => {
  const showDollar1 = progress > 10;
  const showDollar2 = progress > 25;
  const showDollar3 = progress > 40;
  const showPolicy = progress > 20;
  const showAmount = progress > 60;

  return (
    <div className="relative flex items-center justify-center gap-8 md:gap-16 w-full">
      {/* You */}
      <div className="flex flex-col items-center gap-2 animate-fade-in-up">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="w-8 h-8 md:w-10 md:h-10 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">You</span>
      </div>

      {/* Flowing Dollars */}
      <div className="relative w-24 md:w-32 h-12">
        {showDollar1 && (
          <div className="absolute top-0 animate-flow-right">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
        )}
        {showDollar2 && (
          <div className="absolute top-3 animate-flow-right" style={{ animationDelay: '0.3s' }}>
            <DollarSign className="w-5 h-5 text-primary/80" />
          </div>
        )}
        {showDollar3 && (
          <div className="absolute top-1 animate-flow-right" style={{ animationDelay: '0.6s' }}>
            <DollarSign className="w-7 h-7 text-primary/60" />
          </div>
        )}
      </div>

      {/* Policy */}
      <div className={cn(
        "flex flex-col items-center gap-2 transition-all duration-500",
        showPolicy ? "opacity-100 scale-100" : "opacity-0 scale-90"
      )}>
        <div className="w-20 h-24 md:w-24 md:h-28 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
          <div className="text-center text-primary-foreground">
            <PiggyBank className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1" />
            <span className="text-xs font-medium">IUL Policy</span>
          </div>
        </div>
        {showAmount && (
          <div className="animate-count-up bg-primary/10 px-3 py-1 rounded-full">
            <span className="text-lg font-bold text-primary">$1,000</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Scene 2: Fund Allocation
const Scene2Allocation: React.FC<{ progress: number }> = ({ progress }) => {
  const coiWidth = Math.min(progress * 1.5, 30);
  const cashWidth = Math.min(Math.max(progress - 30, 0) * 1.4, 70);
  const showLabels = progress > 50;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="text-center animate-fade-in-up">
        <div className="text-2xl md:text-3xl font-bold text-primary">$1,000</div>
        <div className="text-sm text-muted-foreground">Premium Received</div>
      </div>

      {/* Allocation Bar */}
      <div className="w-full h-16 bg-muted rounded-xl overflow-hidden flex relative">
        <div 
          className="h-full bg-destructive/80 transition-all duration-300 flex items-center justify-center"
          style={{ width: `${coiWidth}%` }}
        >
          {showLabels && coiWidth > 20 && (
            <span className="text-xs font-medium text-destructive-foreground">COI</span>
          )}
        </div>
        <div 
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 flex items-center justify-center"
          style={{ width: `${cashWidth}%` }}
        >
          {showLabels && cashWidth > 30 && (
            <span className="text-sm font-medium text-primary-foreground">Cash Value</span>
          )}
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between w-full text-sm">
        <div className={cn(
          "flex flex-col items-center transition-all duration-500",
          showLabels ? "opacity-100" : "opacity-0"
        )}>
          <div className="w-3 h-3 rounded-full bg-destructive mb-1" />
          <span className="text-muted-foreground">~$150-300</span>
          <span className="text-xs text-muted-foreground">Insurance Cost</span>
        </div>
        <div className={cn(
          "flex flex-col items-center transition-all duration-500",
          showLabels ? "opacity-100" : "opacity-0"
        )}>
          <div className="w-3 h-3 rounded-full bg-primary mb-1" />
          <span className="text-muted-foreground">~$700-850</span>
          <span className="text-xs text-muted-foreground">Cash Value</span>
        </div>
      </div>
    </div>
  );
};

// Scene 3: Index Link
const Scene3IndexLink: React.FC<{ progress: number }> = ({ progress }) => {
  const showChart = progress > 15;
  const showLink = progress > 40;
  const showCash = progress > 30;
  const pulseLink = progress > 60;

  return (
    <div className="flex items-center justify-center gap-6 md:gap-12 w-full">
      {/* S&P 500 Chart */}
      <div className={cn(
        "flex flex-col items-center gap-2 transition-all duration-500",
        showChart ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
      )}>
        <div className="w-28 h-20 md:w-36 md:h-24 bg-muted rounded-lg p-2 relative overflow-hidden">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <path
              d="M0,40 Q20,35 30,30 T50,25 T70,20 T90,15 L100,12"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              className={cn(
                "transition-all duration-1000",
                showChart ? "stroke-dashoffset-0" : ""
              )}
              style={{
                strokeDasharray: 150,
                strokeDashoffset: showChart ? 0 : 150,
              }}
            />
          </svg>
        </div>
        <span className="text-sm font-medium text-foreground">S&P 500</span>
      </div>

      {/* Link Line */}
      <div className={cn(
        "relative w-12 md:w-20 h-1 transition-all duration-500",
        showLink ? "opacity-100" : "opacity-0"
      )}>
        <div className={cn(
          "absolute inset-0 bg-primary rounded-full",
          pulseLink && "animate-pulse-glow"
        )} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-xs font-bold bg-card px-1">
          LINKED
        </div>
      </div>

      {/* Cash Value */}
      <div className={cn(
        "flex flex-col items-center gap-2 transition-all duration-500",
        showCash ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      )}>
        <div className={cn(
          "w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 flex items-center justify-center",
          pulseLink && "animate-pulse"
        )}>
          <DollarSign className="w-10 h-10 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">Cash Value</span>
      </div>
    </div>
  );
};

// Scene 4: Market Gains with Cap
const Scene4MarketGains: React.FC<{ progress: number }> = ({ progress }) => {
  const indexGain = Math.min(progress * 0.2, 15);
  const creditedGain = Math.min(progress * 0.15, 10);
  const showCap = progress > 50;
  const showCredit = progress > 70;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="flex items-end gap-8 h-48">
        {/* Index Performance */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-40 w-16 bg-muted rounded-lg overflow-hidden">
            <div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-300 rounded-t"
              style={{ height: `${indexGain * 5}%` }}
            />
            {showCap && (
              <div className="absolute w-full border-t-2 border-dashed border-amber-500" style={{ bottom: '66%' }}>
                <span className="absolute -right-2 -top-6 text-xs font-bold text-amber-600 bg-card px-1 rounded">CAP</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
            <span className="text-lg font-bold text-green-600">+{indexGain.toFixed(0)}%</span>
            <div className="text-xs text-muted-foreground">Index</div>
          </div>
        </div>

        {/* Credited Rate */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-40 w-16 bg-muted rounded-lg overflow-hidden">
            <div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-primary-light transition-all duration-300 rounded-t"
              style={{ height: `${creditedGain * 5}%` }}
            />
          </div>
          <div className="text-center">
            <Percent className="w-5 h-5 text-primary mx-auto" />
            <span className="text-lg font-bold text-primary">+{creditedGain.toFixed(0)}%</span>
            <div className="text-xs text-muted-foreground">Credited</div>
          </div>
        </div>
      </div>

      {showCredit && (
        <div className="animate-count-up bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800">
          <span className="text-green-700 dark:text-green-400 font-medium">
            You earn up to the cap rate: <strong>10%</strong>
          </span>
        </div>
      )}
    </div>
  );
};

// Scene 5: Floor Protection
const Scene5FloorProtection: React.FC<{ progress: number }> = ({ progress }) => {
  const indexDrop = Math.min(progress * 0.3, 20);
  const showShield = progress > 40;
  const showProtected = progress > 70;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="flex items-end gap-8 h-48">
        {/* Index Drop */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-40 w-16 bg-muted rounded-lg overflow-hidden flex items-end">
            <div 
              className="w-full bg-gradient-to-t from-red-500 to-red-400 transition-all duration-300 rounded-t absolute bottom-0"
              style={{ height: `${Math.max(60 - indexDrop * 2, 20)}%` }}
            />
            <div 
              className="absolute top-0 left-0 right-0 bg-red-200/50 transition-all duration-300"
              style={{ height: `${indexDrop * 2}%` }}
            />
          </div>
          <div className="text-center">
            <TrendingDown className="w-5 h-5 text-red-500 mx-auto" />
            <span className="text-lg font-bold text-red-600">-{indexDrop.toFixed(0)}%</span>
            <div className="text-xs text-muted-foreground">Index</div>
          </div>
        </div>

        {/* Protected Cash Value */}
        <div className="flex flex-col items-center gap-2 relative">
          {showShield && (
            <div className="absolute -top-2 -right-2 z-10 animate-scale-in">
              <Shield className="w-8 h-8 text-green-500 fill-green-100" />
            </div>
          )}
          <div className="relative h-40 w-16 bg-muted rounded-lg overflow-hidden">
            <div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-primary-light transition-all duration-300 rounded-t"
              style={{ height: '60%' }}
            />
          </div>
          <div className="text-center">
            <Shield className="w-5 h-5 text-primary mx-auto" />
            <span className="text-lg font-bold text-primary">0%</span>
            <div className="text-xs text-muted-foreground">Your Floor</div>
          </div>
        </div>
      </div>

      {showProtected && (
        <div className="animate-count-up bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800">
          <span className="text-green-700 dark:text-green-400 font-medium">
            <Shield className="w-4 h-4 inline mr-1" />
            Your cash value is <strong>protected</strong> from losses
          </span>
        </div>
      )}
    </div>
  );
};

// Scene 6: Tax Advantages
const Scene6TaxAdvantages: React.FC<{ progress: number }> = ({ progress }) => {
  const showGrowth = progress > 20;
  const showDeferred = progress > 40;
  const showAccess = progress > 60;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="flex items-center gap-8">
        {/* Tax-Deferred Growth */}
        <div className={cn(
          "flex flex-col items-center gap-3 transition-all duration-500",
          showGrowth ? "opacity-100 scale-100" : "opacity-0 scale-90"
        )}>
          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 flex items-center justify-center relative">
            <DollarSign className="w-10 h-10 text-primary" />
            {showDeferred && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-scale-in">
                TAX-DEFERRED
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-foreground">Cash Value Grows</span>
        </div>

        {/* Access */}
        {showAccess && (
          <div className="flex flex-col items-center gap-3 animate-slide-in-right">
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Tax-Free Loans</span>
              </div>
              <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Tax-Free Withdrawals*</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        *Up to basis; loans reduce death benefit. Consult a tax advisor.
      </p>
    </div>
  );
};

// Scene 7: Death Benefit
const Scene7DeathBenefit: React.FC<{ progress: number }> = ({ progress }) => {
  const showShield = progress > 20;
  const showFamily = progress > 40;
  const showBenefit = progress > 60;
  const showSummary = progress > 80;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center gap-6">
        {/* Shield with Family */}
        <div className={cn(
          "relative transition-all duration-500",
          showShield ? "opacity-100 scale-100" : "opacity-0 scale-90"
        )}>
          <div className="w-28 h-32 md:w-32 md:h-36 relative">
            <Shield className="w-full h-full text-primary fill-primary/10" />
            {showFamily && (
              <div className="absolute inset-0 flex items-center justify-center animate-fade-in-up">
                <Users className="w-12 h-12 text-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Benefit Amount */}
        {showBenefit && (
          <div className="flex flex-col items-center gap-2 animate-count-up">
            <div className="text-3xl md:text-4xl font-bold text-primary">$500,000</div>
            <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">TAX-FREE</span>
            </div>
            <span className="text-sm text-muted-foreground">Death Benefit</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {showSummary && (
        <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up">
          <div className="bg-muted px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Shield className="w-3 h-3" /> Protection
          </div>
          <div className="bg-muted px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Growth
          </div>
          <div className="bg-muted px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Tax Benefits
          </div>
        </div>
      )}
    </div>
  );
};

export default IULExplainerAnimation;
