import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';
import { ChefHat, Plus, Utensils } from 'lucide-react';

interface MealPlan {
  id: string;
  plan_name: string;
  recipes: any;
  nutritional_info: any;
  created_at: string;
  user_id: string;
}

const MealPlannerPage = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  const [planName, setPlanName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const generateMealPlan = () => {
    if (!planName) {
      toast({
        title: "Error",
        description: "Please enter a plan name",
        variant: "destructive",
      });
      return;
    }

    const sampleRecipes = [
      {
        day: 'Monday',
        breakfast: 'Oatmeal with berries',
        lunch: 'Grilled chicken salad',
        dinner: 'Baked salmon with vegetables'
      },
      {
        day: 'Tuesday',
        breakfast: 'Greek yogurt with granola',
        lunch: 'Quinoa bowl',
        dinner: 'Lean beef stir-fry'
      }
    ];

    const nutritionalInfo = {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 70
    };

    const newPlan: MealPlan = {
      id: Date.now().toString(),
      plan_name: planName,
      recipes: sampleRecipes,
      nutritional_info: nutritionalInfo,
      created_at: new Date().toISOString(),
      user_id: user?.id || ''
    };

    setMealPlans(prev => [newPlan, ...prev]);
    setCurrentPlan(newPlan);
    setPlanName('');

    toast({
      title: "Success",
      description: "Meal plan generated successfully!",
    });
  };

  const deleteMealPlan = (id: string) => {
    setMealPlans(prev => prev.filter(plan => plan.id !== id));
    if (currentPlan?.id === id) {
      setCurrentPlan(null);
    }

    toast({
      title: "Success",
      description: "Meal plan deleted successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-green-600" />
              AI Meal Planner
            </CardTitle>
            <CardDescription>
              Generate personalized meal plans for healthy eating
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Create New Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Plan name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
              <Button onClick={generateMealPlan} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Generate Plan
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Meal Plans</CardTitle>
            </CardHeader>
            <CardContent>
              {mealPlans.length === 0 ? (
                <p className="text-gray-500 text-center">No meal plans yet. Create your first plan!</p>
              ) : (
                <div className="space-y-4">
                  {mealPlans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{plan.plan_name}</h3>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(plan.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPlan(plan)}
                          >
                            View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMealPlan(plan.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {currentPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                {currentPlan.plan_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Weekly Menu</h4>
                  {currentPlan.recipes && Array.isArray(currentPlan.recipes) ? (
                    <div className="space-y-2">
                      {currentPlan.recipes.map((day: any, index: number) => (
                        <div key={index} className="border rounded p-3">
                          <h5 className="font-medium">{day.day}</h5>
                          <p className="text-sm text-gray-600">Breakfast: {day.breakfast}</p>
                          <p className="text-sm text-gray-600">Lunch: {day.lunch}</p>
                          <p className="text-sm text-gray-600">Dinner: {day.dinner}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No recipes available</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Nutritional Info</h4>
                  {currentPlan.nutritional_info ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Calories:</span>
                        <Badge variant="outline">{currentPlan.nutritional_info.calories || 'N/A'}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Protein:</span>
                        <Badge variant="outline">{currentPlan.nutritional_info.protein || 'N/A'}g</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Carbs:</span>
                        <Badge variant="outline">{currentPlan.nutritional_info.carbs || 'N/A'}g</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Fat:</span>
                        <Badge variant="outline">{currentPlan.nutritional_info.fat || 'N/A'}g</Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No nutritional info available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MealPlannerPage;
