"use client";

import { useMemo } from "react";

interface CalorieMeterProps {
  netBalance: number;
  goal: number;
  budget: number;
  foodCalories: number;
  workoutCalories: number;
  bmr: number;
  className?: string;
}

export function CalorieMeter({
  netBalance,
  goal,
  budget,
  foodCalories,
  workoutCalories,
  bmr,
  className = ""
}: CalorieMeterProps) {
  const meterData = useMemo(() => {
    // Determine goal type and status
    const isWeightLoss = goal < 0;
    const isWeightGain = goal > 0;
    const isMaintenance = goal === 0;
    
    // Calculate if on track (within 100 calories of goal)
    const isOnTrack = Math.abs(netBalance - goal) <= 100;
    
    // Determine meter color based on goal progress
    let meterColor = "bg-gray-400";
    let statusText = "";
    
    if (isOnTrack) {
      meterColor = "bg-green-500";
      statusText = "On Track";
    } else if (isWeightLoss) {
      if (netBalance <= goal) {
        meterColor = "bg-green-500";
        statusText = "Great Deficit";
      } else if (netBalance < 0) {
        meterColor = "bg-yellow-500";
        statusText = "Small Deficit";
      } else {
        meterColor = "bg-red-500";
        statusText = "Surplus";
      }
    } else if (isWeightGain) {
      if (netBalance >= goal) {
        meterColor = "bg-green-500";
        statusText = "Good Surplus";
      } else if (netBalance > 0) {
        meterColor = "bg-yellow-500";
        statusText = "Small Surplus";
      } else {
        meterColor = "bg-red-500";
        statusText = "Deficit";
      }
    } else {
      // Maintenance
      if (Math.abs(netBalance) <= 50) {
        meterColor = "bg-green-500";
        statusText = "Maintaining";
      } else {
        meterColor = "bg-yellow-500";
        statusText = netBalance > 0 ? "Slight Surplus" : "Slight Deficit";
      }
    }
    
    return {
      meterColor,
      statusText,
      isOnTrack
    };
  }, [netBalance, goal]);

  const totalCaloriesBurned = bmr + workoutCalories;

  return (
    <div className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Calorie Balance</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          meterData.isOnTrack 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        }`}>
          {meterData.statusText}
        </span>
      </div>

      {/* Visual Meter */}
      <div className="relative mb-6">
        {/* Main meter bar */}
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
          {/* Goal marker */}
          <div 
            className="absolute top-0 h-full w-1 bg-blue-600 z-10"
            style={{ 
              left: `${Math.max(0, Math.min(100, ((goal + 1000) / 2000) * 100))}%` 
            }}
          />
          
          {/* Current balance fill */}
          <div 
            className={`h-full transition-all duration-500 ${meterData.meterColor}`}
            style={{ 
              width: `${Math.max(0, Math.min(100, ((netBalance + 1000) / 2000) * 100))}%` 
            }}
          />
        </div>
        
        {/* Scale labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>-1000</span>
          <span>0</span>
          <span>+1000</span>
        </div>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">
            {netBalance > 0 ? '+' : ''}{netBalance}
          </p>
          <p className="text-xs text-muted-foreground">Net Balance</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {goal > 0 ? '+' : ''}{goal}
          </p>
          <p className="text-xs text-muted-foreground">Daily Goal</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Food Consumed:</span>
          <span className="font-medium">+{foodCalories} cal</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">BMR Burned:</span>
          <span className="font-medium">-{bmr} cal</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Workout Burned:</span>
          <span className="font-medium">-{workoutCalories} cal</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between font-semibold">
          <span>Net Balance:</span>
          <span className={netBalance > 0 ? 'text-red-600' : 'text-green-600'}>
            {netBalance > 0 ? '+' : ''}{netBalance} cal
          </span>
        </div>
      </div>
    </div>
  );
}