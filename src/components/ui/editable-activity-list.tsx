"use client";

import { useState } from "react";
import { Plus, Minus, Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type FoodItem, type ExerciseSet } from "@/lib/ai/genkit-config";

interface EditableFoodListProps {
  title: string;
  foodItems: FoodItem[];
  onUpdate: (items: FoodItem[]) => void;
  allowAdd?: boolean;
}

interface EditableExerciseListProps {
  title: string;
  exercises: ExerciseSet[];
  onUpdate: (exercises: ExerciseSet[]) => void;
  allowAdd?: boolean;
}

export function EditableFoodList({ title, foodItems, onUpdate, allowAdd = true }: EditableFoodListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FoodItem>>({});

  const startEdit = (item: FoodItem) => {
    setEditingId(item.id);
    setEditValues(item);
  };

  const saveEdit = () => {
    if (!editingId || !editValues) return;
    
    const updatedItems = foodItems.map(item => 
      item.id === editingId ? { ...item, ...editValues } : item
    );
    onUpdate(updatedItems);
    setEditingId(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const removeItem = (id: string) => {
    const updatedItems = foodItems.filter(item => item.id !== id);
    onUpdate(updatedItems);
  };

  const addNewItem = () => {
    const newItem: FoodItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: "New Food Item",
      quantity: { amount: 1, unit: "serving" },
      calories: 100,
      confidence: 0.5
    };
    onUpdate([...foodItems, newItem]);
    startEdit(newItem);
  };

  const updateEditValue = (field: string, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedValue = (parentField: string, field: string, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof FoodItem] as any),
        [field]: value
      }
    }));
  };

  const getTotalCalories = () => {
    return foodItems.reduce((total, item) => total + item.calories, 0);
  };

  if (foodItems.length === 0 && !allowAdd) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Total: {getTotalCalories()} cal
            </span>
            {allowAdd && (
              <Button variant="outline" size="sm" onClick={addNewItem}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {foodItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {editingId === item.id ? (
              // Edit mode
              <>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Food name"
                    value={editValues.name || ""}
                    onChange={(e) => updateEditValue("name", e.target.value)}
                    className="h-8"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={editValues.quantity?.amount || ""}
                      onChange={(e) => updateNestedValue("quantity", "amount", parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                    <Input
                      placeholder="Unit"
                      value={editValues.quantity?.unit || ""}
                      onChange={(e) => updateNestedValue("quantity", "unit", e.target.value)}
                      className="h-8 w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Calories"
                      value={editValues.calories || ""}
                      onChange={(e) => updateEditValue("calories", parseInt(e.target.value) || 0)}
                      className="h-8 w-24"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={saveEdit}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </>
            ) : (
              // View mode
              <>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity.amount} {item.quantity.unit} • {item.calories} cal
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                    <Minus className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EditableExerciseList({ title, exercises, onUpdate, allowAdd = true }: EditableExerciseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ExerciseSet>>({});

  const startEdit = (item: ExerciseSet) => {
    setEditingId(item.id);
    setEditValues(item);
  };

  const saveEdit = () => {
    if (!editingId || !editValues) return;
    
    const updatedItems = exercises.map(item => 
      item.id === editingId ? { ...item, ...editValues } : item
    );
    onUpdate(updatedItems);
    setEditingId(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const removeItem = (id: string) => {
    const updatedItems = exercises.filter(item => item.id !== id);
    onUpdate(updatedItems);
  };

  const addNewItem = () => {
    const newItem: ExerciseSet = {
      id: Math.random().toString(36).substr(2, 9),
      name: "New Exercise",
      sets: 3,
      reps: 10,
      confidence: 0.5
    };
    onUpdate([...exercises, newItem]);
    startEdit(newItem);
  };

  const updateEditValue = (field: string, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedValue = (parentField: string, field: string, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof ExerciseSet] as any),
        [field]: value
      }
    }));
  };

  if (exercises.length === 0 && !allowAdd) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {allowAdd && (
            <Button variant="outline" size="sm" onClick={addNewItem}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {exercises.map((item) => (
          <div key={item.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {editingId === item.id ? (
              // Edit mode
              <>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Exercise name"
                    value={editValues.name || ""}
                    onChange={(e) => updateEditValue("name", e.target.value)}
                    className="h-8"
                  />
                  <div className="flex gap-2">
                    {editValues.sets !== undefined && (
                      <Input
                        type="number"
                        placeholder="Sets"
                        value={editValues.sets || ""}
                        onChange={(e) => updateEditValue("sets", parseInt(e.target.value) || 0)}
                        className="h-8 w-16"
                      />
                    )}
                    {editValues.reps !== undefined && (
                      <Input
                        type="number"
                        placeholder="Reps"
                        value={editValues.reps || ""}
                        onChange={(e) => updateEditValue("reps", parseInt(e.target.value) || 0)}
                        className="h-8 w-16"
                      />
                    )}
                    {editValues.weight && (
                      <>
                        <Input
                          type="number"
                          placeholder="Weight"
                          value={editValues.weight?.amount || ""}
                          onChange={(e) => updateNestedValue("weight", "amount", parseFloat(e.target.value) || 0)}
                          className="h-8 w-20"
                        />
                        <select
                          value={editValues.weight?.unit || "lbs"}
                          onChange={(e) => updateNestedValue("weight", "unit", e.target.value)}
                          className="h-8 px-2 border rounded text-sm"
                        >
                          <option value="lbs">lbs</option>
                          <option value="kg">kg</option>
                        </select>
                      </>
                    )}
                    {editValues.duration && (
                      <>
                        <Input
                          type="number"
                          placeholder="Duration"
                          value={editValues.duration?.value || ""}
                          onChange={(e) => updateNestedValue("duration", "value", parseInt(e.target.value) || 0)}
                          className="h-8 w-20"
                        />
                        <select
                          value={editValues.duration?.unit || "minutes"}
                          onChange={(e) => updateNestedValue("duration", "unit", e.target.value)}
                          className="h-8 px-2 border rounded text-sm"
                        >
                          <option value="seconds">sec</option>
                          <option value="minutes">min</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={saveEdit}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </>
            ) : (
              // View mode
              <>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.sets && item.reps && `${item.sets} sets × ${item.reps} reps`}
                    {item.weight && ` • ${item.weight.amount} ${item.weight.unit}`}
                    {item.duration && ` • ${item.duration.value} ${item.duration.unit}`}
                    {item.calories && ` • ${item.calories} cal`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                    <Minus className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 