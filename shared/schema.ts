import { z } from "zod";

// Student Profile Schema
export const studentProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gpa: z.number().min(0).max(4.0).nullable(),
  degreeLevel: z.enum(["high school", "undergraduate", "graduate", "unknown"]),
  fieldOfStudy: z.string().nullable(),
  citizenship: z.string().nullable(),
  age: z.number().int().positive().nullable(),
  activities: z.string().min(10, "Please describe your activities"),
  backgroundStory: z.string().min(10, "Please share your background"),
  careerGoals: z.string().min(10, "Please describe your goals"),
  challenges: z.string().nullable(),
});

export type StudentProfile = z.infer<typeof studentProfileSchema>;

// Scholarship Match Schema
export const scholarshipMatchSchema = z.object({
  scholarship: z.string(),
  distance: z.number(),
  url: z.string(),
  full_text: z.string(),
  metadata: z.object({
    url: z.string().optional(),
    minimum_gpa: z.string().optional(),
    degree_levels: z.string().optional(),
    fields_of_study: z.string().optional(),
    emphasis_areas: z.string().optional(),
    values_mission: z.string().optional(),
    award_amount: z.string().optional(),
  }),
  rank: z.number().optional(),
  match_score: z.number().optional(),
  reasoning: z.string().optional(),
});

export type ScholarshipMatch = z.infer<typeof scholarshipMatchSchema>;

// Essay Generation Result Schema
export const essayResultSchema = z.object({
  essay: z.string(),
  selected_strategy: z.object({
    cluster_id: z.number(),
    cluster_name: z.string(),
    description_archetype: z.string(),
    writing_strategy: z.object({
      broad_instructions: z.string(),
      structural_template: z.string(),
    }),
  }),
  matching_clusters: z.array(z.string()),
  scholarship_name: z.string(),
});

export type EssayResult = z.infer<typeof essayResultSchema>;

// API Request/Response Types
export type MatchScholarshipsRequest = {
  studentProfile: StudentProfile;
};

export type MatchScholarshipsResponse = {
  matches: ScholarshipMatch[];
};

export type GenerateEssayRequest = {
  scholarshipDescription: string;
  studentProfile: StudentProfile;
};

export type GenerateEssayResponse = EssayResult;
