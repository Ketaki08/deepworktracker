"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Square, Clock, Brain, Coffee, Dumbbell, Briefcase } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type ActivityType = {
  duration: number;
  description: string;
  type: string;
  startTime: number;
  endTime: number;
};

interface Activity {
    type: string;
    startTime: number;
    description?: string;
}

interface Summary {
  [key: string]: {
    totalHours: number;
    percentage: number;
  };
}

export default function Home() {
  const [workdayLength, setWorkdayLength] = useState(8 * 60 * 60)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isRunning, setIsRunning] = useState(false)
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [workdayStartTime, setWorkdayStartTime] = useState<number | null>(null);
  const [workdayRemainingTime, setWorkdayRemainingTime] = useState(workdayLength);
  const [isWorkdayActive, setIsWorkdayActive] = useState(false);
  const [showActivityPrompt, setShowActivityPrompt] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<Summary>({});
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkdayActive) {
      interval = setInterval(() => {
        setWorkdayRemainingTime(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            setIsWorkdayActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkdayActive]);

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const formatElapsedTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = timeInSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const handleStart = () => {
    if (!currentActivity) return
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleStop = () => {
    setIsRunning(false);
    if (currentActivity && typeof currentActivity === 'object' && !Array.isArray(currentActivity)) {
      const description = prompt("Please enter a description for this activity:") || "";
      setActivities([...activities, { 
        ...currentActivity, 
        duration: elapsedTime,
        description,
        endTime: Date.now() 
      }]);
      setElapsedTime(0);
      setCurrentActivity(null);
    }
  }

  const handleWorkdayLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = parseFloat(e.target.value)
    if (!isNaN(hours) && hours > 0) {
      const newLength = Math.round(hours * 60 * 60)
      setWorkdayLength(newLength)
      setWorkdayRemainingTime(newLength)
    }
  }

  const activityTypes = [
    { value: "deep-work", label: "Deep Work", icon: Brain },
    { value: "shallow-work", label: "Shallow Work", icon: Briefcase },
    { value: "break", label: "Break", icon: Coffee },
    { value: "exercise", label: "Exercise", icon: Dumbbell },
  ]

  const startDay = () => {
    setIsWorkdayActive(true);
    if (workdayRemainingTime === 0) {
      setWorkdayRemainingTime(workdayLength);
    }
    setWorkdayStartTime(Date.now());
    if (!currentActivity) {
      setShowActivityPrompt(true);
    }
  };

  const calculateSummary = () => {
    const totalTime = activities.reduce((acc, activity) => acc + activity.duration, 0);
    const summaryData: Summary = {};

    activityTypes.forEach(type => {
      const typeActivities = activities.filter(activity => activity.type === type.value);
      const typeTotalTime = typeActivities.reduce((acc, activity) => acc + activity.duration, 0);
      const typeHours = typeTotalTime / 3600;
      const typePercentage = (typeTotalTime / totalTime) * 100;

      summaryData[type.value] = {
        totalHours: parseFloat(typeHours.toFixed(2)),
        percentage: parseFloat(typePercentage.toFixed(2))
      };
    });

    setSummary(summaryData);
  };

  const generateAiSummary = async () => {
    setIsGeneratingAiSummary(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          activities,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI summary');
      }

      const data = await response.json();
      setAiSummary(data.summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummary("Failed to generate AI summary. Please try again.");
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  const endDay = () => {
    setIsWorkdayActive(false);
    setWorkdayRemainingTime(workdayLength);
    setCurrentActivity(null);
    setWorkdayStartTime(null);
    calculateSummary();
    setShowSummary(true);
    generateAiSummary();
  };

  const closeSummary = () => {
    setShowSummary(false);
    setActivities([]);
    setAiSummary("");
  };


  const handleActivitySelection = (value: string) => {
    setCurrentActivity({ type: value, startTime: Date.now() });
    setShowActivityPrompt(false);
    setIsRunning(true); // Automatically start the timer
    setElapsedTime(0); // Reset elapsed time for the new activity
  };


  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Time Tracking App</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Workday Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="text-gray-500" />
                <Input
                  type="number"
                  placeholder="Workday length (hours)"
                  value={workdayLength / 3600}
                  onChange={handleWorkdayLengthChange}
                  className="flex-grow"
                  min="0.5"
                  step="0.5"
                />
              </div>
              <div className="text-4xl font-bold text-center">{formatTime(workdayRemainingTime)}</div>
              <div className="flex justify-center space-x-2">
                <Button onClick={startDay} disabled={isWorkdayActive}>
                  <Play className="mr-2 h-4 w-4" /> Start Day
                </Button>
                <Button onClick={endDay} disabled={!isWorkdayActive}>
                  <Square className="mr-2 h-4 w-4" /> End Day
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={currentActivity?.type}
                onValueChange={(value) => setCurrentActivity({ type: value, startTime: Date.now() })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <type.icon className="mr-2 h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-4xl font-bold text-center">{formatElapsedTime(elapsedTime)}</div>
              <div className="flex justify-center space-x-2">
                <Button onClick={handleStart} disabled={isRunning || !currentActivity}>
                  <Play className="mr-2 h-4 w-4" /> Start
                </Button>
                <Button onClick={handlePause} disabled={!isRunning}>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </Button>
                <Button onClick={handleStop} disabled={!currentActivity}>
                  <Square className="mr-2 h-4 w-4" /> Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Completed Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const IconComponent = activityTypes.find((type) => type.value === activity.type)?.icon;

              return (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                  <div className="flex items-center flex-grow">
                    {IconComponent && typeof IconComponent === 'function' && (
                      <IconComponent className="mr-2 h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {activityTypes.find((type) => type.value === activity.type)?.label}
                    </span>
                    {activity.description && (
                      <span className="ml-2 text-sm text-gray-500">({activity.description})</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end ml-4">
                    <span className="text-sm text-gray-600">
                      {formatDateTime(activity.startTime)} - {formatDateTime(activity.endTime)}
                    </span>
                    <span className="font-medium">
                      {Math.round(activity.duration / 60)} mins
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showActivityPrompt} onOpenChange={setShowActivityPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose an activity to start your day</DialogTitle>
          </DialogHeader>
          <Select onValueChange={handleActivitySelection}>
            <SelectTrigger>
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center">
                    <type.icon className="mr-2 h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>End of Day Summary</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              {Object.entries(summary).map(([type, data]) => (
                <div key={type} className="mb-2">
                  <strong>{activityTypes.find(t => t.value === type)?.label}:</strong>
                  <span className="ml-2">{data.totalHours} hours ({data.percentage}%)</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">AI-Generated Summary</h3>
              {isGeneratingAiSummary ? (
                <p>Generating summary...</p>
              ) : (
                <p className="whitespace-pre-wrap">{aiSummary}</p>
              )}
            </div>
          </div>
          <Button onClick={closeSummary} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}