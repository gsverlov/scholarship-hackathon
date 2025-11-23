import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { studentProfileSchema, type StudentProfile, type ScholarshipMatch } from "@shared/schema";

interface ProfileFormProps {
  onSubmit: (profile: StudentProfile, matches: ScholarshipMatch[]) => void;
}

export function ProfileForm({ onSubmit }: ProfileFormProps) {
  const { toast } = useToast();

  const form = useForm<StudentProfile>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      name: "",
      gpa: null,
      degreeLevel: "undergraduate",
      fieldOfStudy: null,
      citizenship: null,
      age: null,
      activities: "",
      backgroundStory: "",
      careerGoals: "",
      challenges: null,
    },
  });

  const matchScholarshipsMutation = useMutation({
    mutationFn: async (studentProfile: StudentProfile) => {
      const response = await apiRequest(
        "POST",
        "/api/match-scholarships",
        { studentProfile }
      );
      const data = await response.json() as { matches: ScholarshipMatch[] };
      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Scholarships Found!",
        description: `We found ${data.matches.length} matching scholarships for you.`,
      });
      onSubmit(variables, data.matches);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to find matching scholarships. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: StudentProfile) => {
    matchScholarshipsMutation.mutate(data);
  };

  const fillExampleData = () => {
    form.setValue("name", "Jordan Chen");
    form.setValue("gpa", 3.8);
    form.setValue("degreeLevel", "undergraduate");
    form.setValue("fieldOfStudy", "English Literature");
    form.setValue("citizenship", "United States");
    form.setValue("age", 19);
    form.setValue("activities", "Editor-in-Chief of school literary magazine, founder of Poetry Slam Club, lead vocalist in jazz ensemble, volunteer creative writing tutor at community center, published poet in regional anthologies");
    form.setValue("backgroundStory", "I discovered my love for words and music growing up in a multicultural neighborhood where stories and songs bridged language barriers. As a first-generation college student, I've used writing and music as tools to explore my identity and connect with others. I believe in the transformative power of the arts to build empathy and understanding across diverse communities.");
    form.setValue("careerGoals", "I aspire to become a published author and arts educator, combining my passions for literature, poetry, and music. My goal is to create accessible creative writing programs for underserved youth and eventually establish a nonprofit arts center that provides free workshops in writing, poetry, and music. I also hope to write novels and poetry collections that amplify marginalized voices.");
    form.setValue("challenges", "Growing up in a low-income household, I often lacked resources for formal music lessons or writing workshops. I taught myself piano through YouTube tutorials and developed my writing skills by reading library books and participating in free online writing communities. Balancing work to support my family while pursuing my artistic passions has taught me resilience and time management.");
    
    toast({
      title: "Example filled!",
      description: "The form has been filled with sample data. Feel free to edit or submit as is.",
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Your Profile</CardTitle>
        <CardDescription>
          Tell us about yourself to find the best scholarship matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name"
                        data-testid="input-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gpa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPA</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4.0"
                        placeholder="3.75"
                        data-testid="input-gpa"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormDescription className="text-sm">On a 4.0 scale</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="degreeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-degree">
                          <SelectValue placeholder="Select degree level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high school">High School</SelectItem>
                        <SelectItem value="undergraduate">Undergraduate</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                        <SelectItem value="unknown">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fieldOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Study</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Computer Science, Biology, etc."
                        data-testid="input-field"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="citizenship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Citizenship</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="United States, Canada, etc."
                        data-testid="input-citizenship"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="21"
                        data-testid="input-age"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activities & Involvement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your extracurricular activities, leadership roles, volunteer work, etc."
                      className="min-h-[100px]"
                      data-testid="textarea-activities"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="backgroundStory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Story</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your background, experiences, and what makes you unique..."
                      className="min-h-[120px]"
                      data-testid="textarea-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="careerGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Career Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What are your career aspirations and future plans?"
                      className="min-h-[100px]"
                      data-testid="textarea-goals"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="challenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenges Overcome (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any significant challenges or obstacles you've overcome..."
                      className="min-h-[100px]"
                      data-testid="textarea-challenges"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={fillExampleData}
                data-testid="button-autofill"
              >
                Autofill Example
              </Button>
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={matchScholarshipsMutation.isPending}
                data-testid="button-submit-profile"
              >
                {matchScholarshipsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Find My Scholarships
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
